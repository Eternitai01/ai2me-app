"use client";
import { Button } from "@/components/ui/button";
import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Key,
  Send,
  Plus,
  MessageSquare,
  Clock,
  Star,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProviderIcon } from "@/components/ui/provider-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Tooltip import removed; using button title for hint
import chatHistoryService, { ChatSession } from "@/app/api/chatHistory";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ChatMessage {
  id: string;
  type: "incoming" | "outgoing";
  text?: string;
  // Optional metadata for feedback
  queryId?: string;
  query?: string;
  providerName?: string;
  model?: string;
  intent?: string;
}

type StartResponse = {
  session_id: string;
  ai_response?: string;
  response_type?: string;
  complexity_level?: string;
  query_id?: string;
  intent?: string;
  ai_provider?: {
    provider_name?: string;
    model?: string;
    model_name?: string;
  };
  provider_name?: string;
  model?: string;
  provider?: string;
};

type ContinueResponse = {
  session_id: string;
  query_id?: string;
  status?: string;
  answer?: string;
  intent?: string;
  ai_provider?: {
    provider_name?: string;
    model?: string;
    model_name?: string;
  };
  provider_name?: string;
  model?: string;
  provider?: string;
};

const initialChatMessages: ChatMessage[] = [];

// Removed static chat history - will be loaded from API

interface ExecutionResponseProps {
  title?: string;
}

export default function PlaygroundPage({ }: ExecutionResponseProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const {
    canAccessPlayground,
    isLoading: accessLoading,
    refreshAccess,
  } = usePlaygroundAccess();
  const router = useRouter();

  // API Key management
  const [apiKey, setApiKey] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instantResponse, setInstantResponse] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState<string>("auto");
  const [costSensitivity, setCostSensitivity] = useState<string>("medium");
  const [qualityPriority, setQualityPriority] = useState<string>("balanced");
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Chat history management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasLoadedSessions, setHasLoadedSessions] = useState(false);

  // Check playground access on mount and when returning from credits page
  useEffect(() => {
    const checkAccessAndRedirect = async () => {
      // Manually check access when playground page loads
      const hasAccess = await refreshAccess();
      if (!hasAccess) {
        router.push("/dashboard/credits");
      }
    };

    checkAccessAndRedirect();
  }, [router, refreshAccess]);

  // Load stored API key on component mount
  useEffect(() => {
    // Initialize responsive state for history sidebar: open by default on desktop
    const applyResponsiveSidebar = () => {
      if (typeof window === "undefined") return;
      setIsHistoryOpen(window.innerWidth >= 1024);
    };
    applyResponsiveSidebar();
    window.addEventListener("resize", applyResponsiveSidebar);

    const storedKey = localStorage.getItem("ai_service_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Show modal if no API key is stored
      setIsModalOpen(true);
    }

    return () => {
      window.removeEventListener("resize", applyResponsiveSidebar);
    };
  }, []);

  // Load chat sessions when API key is available
  useEffect(() => {
    if (apiKey) {
      loadChatSessions();
    }
  }, [apiKey]);

  const loadChatSessions = useCallback(async () => {
    if (!apiKey) return;

    setIsLoadingSessions(true);
    try {
      const response = await chatHistoryService.getChatSessions();
      setChatSessions(response.sessions);
      setHasLoadedSessions(true);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      // Only show error toast if we have previously loaded sessions successfully
      // This indicates the user had chat history before but now the API is failing
      if (hasLoadedSessions) {
        toast.error("Failed to load chat history");
      }
    } finally {
      setIsLoadingSessions(false);
    }
  }, [apiKey, hasLoadedSessions]);

  // Load chat history for a specific session
  const loadChatHistory = async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const history = await chatHistoryService.getChatHistory(sessionId);

      // Convert API messages to local format (include provider/model for UX)
      const localMessages: ChatMessage[] = history.messages.map((msg) => ({
        id: msg.id,
        type: msg.type,
        text: msg.text,
        providerName: msg.ai_metadata?.provider || undefined,
        model: msg.ai_metadata?.model || undefined,
      }));

      setMessages(localMessages);
      setSessionId(sessionId);
      setSelectedChat(sessionId);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Only show error toast if we're trying to load an existing session
      // (not a new/empty session)
      if (sessionId && sessionId.trim() !== "") {
        toast.error("Failed to load chat history");
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setSessionId("");
    setMessages([]);
    setInput("");
    setSelectedChat(null);
  };

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    localStorage.setItem("ai_service_api_key", apiKey);
    setIsModalOpen(false);
    toast.success("API key saved successfully");
    // Load chat sessions after API key is set
    loadChatSessions();
  };

  const handleApiKeyChange = () => {
    setIsModalOpen(true);
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callStart = async (question: string) => {
    if (!apiKey) {
      toast.error("Please enter an API key");
      setIsModalOpen(true);
      return;
    }

    // Add user message immediately
    const userMessageId = crypto.randomUUID();
    const loadingMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        type: "outgoing",
        text: question,
      },
      {
        id: loadingMessageId,
        type: "incoming",
        text: "loading", // Special loading state
      },
    ]);

    setIsStarting(true);
    try {
      // Use the Next.js API route proxy instead of calling AI service directly
      const response = await fetch("/api/ai/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          question,
          connector_ids: [],
          additional_content: "",
          preferences: {
            cost_sensitivity: costSensitivity,
            quality_priority: qualityPriority,
            response_time: "",
            // Send null for auto mode (not empty string) to ensure backend uses intelligent routing
            preferred_provider:
              preferredProvider === "auto" ? null : preferredProvider,
            // Model is null for auto selection
            preferred_model: null,
          },
          instant_response: instantResponse,
        }),
      });
      const data: StartResponse & { detail?: string } = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Failed to start session");

      setSessionId(data.session_id);
      setSelectedChat(data.session_id);

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "incoming" as const,
              text: data.ai_response || "No response received",
              queryId: data.query_id || loadingMessageId,
              query: question,
              providerName:
                data.ai_provider?.provider_name ||
                data.provider_name ||
                data.provider ||
                "",
              intent: data.intent || "code generation",
              model:
                data.ai_provider?.model_name ||
                data.ai_provider?.model ||
                data.model ||
                "",
            }
            : msg
        )
      );

      // Reload chat sessions to show the new session
      await loadChatSessions();
    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      toast.error(err.message || "Start failed");

      // Replace loading message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "incoming" as const,
              text: `Error: ${err.message || "Failed to get response"}`,
            }
            : msg
        )
      );
    } finally {
      setIsStarting(false);
    }
  };

  const callContinue = async (question: string) => {
    if (!apiKey) {
      toast.error("Please enter an API key");
      setIsModalOpen(true);
      return;
    }

    if (!sessionId) {
      await callStart(question);
      return;
    }

    // Add user message immediately
    const userMessageId = crypto.randomUUID();
    const loadingMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        type: "outgoing",
        text: question,
      },
      {
        id: loadingMessageId,
        type: "incoming",
        text: "loading", // Special loading state
      },
    ]);

    setIsSending(true);
    try {
      // Use the Next.js API route proxy instead of calling AI service directly
      const response = await fetch("/api/ai/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          question,
          additional_content: "",
          preferences: {
            cost_sensitivity: costSensitivity,
            quality_priority: qualityPriority,
            response_time: "",
            // Send null for auto mode (not empty string) to ensure backend uses intelligent routing
            preferred_provider:
              preferredProvider === "auto" ? null : preferredProvider,
            // Model is null for auto selection
            preferred_model: null,
          },
          instant_response: instantResponse,
        }),
      });
      const data: ContinueResponse & { detail?: string } =
        await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Failed to continue session");

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "incoming" as const,
              text: data.answer || "No response received",
              queryId: data.query_id || loadingMessageId,
              query: question,
              providerName:
                data.ai_provider?.provider_name ||
                data.provider_name ||
                data.provider ||
                "",
              intent: data.intent || "code generation",
              model:
                data.ai_provider?.model_name ||
                data.ai_provider?.model ||
                data.model ||
                "",
            }
            : msg
        )
      );
    } catch (e: unknown) {
      const err = e as Error;
      console.error(err);
      toast.error(err.message || "Continue failed");

      // Replace loading message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
              id: loadingMessageId,
              type: "incoming" as const,
              text: `Error: ${err.message || "Failed to get response"}`,
            }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input;
    setInput("");

    if (sessionId) {
      await callContinue(question);
    } else {
      await callStart(question);
    }
  };

  // Show loading state while checking access
  if (accessLoading) {
    return (
      <div className="flex h-screen bg-gray-50 chatLayout">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if no access
  if (!canAccessPlayground) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Playground</h1>
            <p className="text-gray-600">
              Chat with AI models using your API key
            </p>
          </div>
          <Button
            onClick={() => setIsHistoryOpen(true)}
            variant="outlineBlack"
            className="flex items-center gap-2 lg:hidden"
            aria-label="Open chat history"
            title="Open chat history"
          >
            <Menu className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* API Key Configuration */}
      <Card className="p-3">
        <CardHeader className="p-0 space-y-1">
          <CardTitle className="flex items-center gap-1 text-base">
            <Key className="w-4 h-4" />
            API Key Configuration
          </CardTitle>

          <div className="flex items-center justify-between gap-2">
            <CardDescription className="text-sm">
              {apiKey
                ? "API key is configured"
                : "Configure your API key to start chatting"}
            </CardDescription>

            <Button
              onClick={handleApiKeyChange}
              variant="outlineBlack"
              className="flex items-center gap-1 px-2 py-1 text-sm h-auto"
            >
              <Key className="h-3 w-3" />
              {apiKey ? "Change" : "Set"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg border">
        <div className="flex h-[600px] relative">
          {/* Overlay for mobile/tablet when sidebar open */}
          {isHistoryOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setIsHistoryOpen(false)}
            />
          )}

          {/* Chat History Sidebar (slide-in on mobile/tablet) */}
          <div
            className={
              `border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out ` +
              `lg:static lg:translate-x-0 lg:w-80 lg:z-auto ` +
              `${isHistoryOpen ? "translate-x-0" : "-translate-x-full"} ` +
              `fixed inset-y-0 left-0 z-50 w-72 bg-white lg:bg-transparent lg:fixed lg:inset-auto`
            }
            aria-hidden={
              !isHistoryOpen &&
              typeof window !== "undefined" &&
              window.innerWidth < 1024
            }
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Chat History
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleNewChat}
                    size="sm"
                    variant="outlineBlack"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                  {/* Close button for mobile/tablet */}
                  <Button
                    onClick={() => setIsHistoryOpen(false)}
                    size="icon"
                    variant="outline"
                    className="lg:hidden"
                    aria-label="Close chat history"
                    title="Close chat history"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto chat-scrollbar">
              <div className="p-2 space-y-1">
                {isLoadingSessions ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Loading chat history...
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    No chat history yet. Start a new conversation!
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors group ${selectedChat === session.session_id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                        }`}
                      onClick={() => loadChatHistory(session.session_id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700 truncate font-medium">
                              {session.title}
                            </div>
                            {session.preview && (
                              <div className="text-xs text-gray-500 truncate mt-1">
                                {session.preview}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {new Date(
                                  session.updated_at
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {session.message_count} messages
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading chat history...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-600">
                      Enter your message below to begin chatting with AI
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "outgoing"
                        ? "justify-end"
                        : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === "outgoing"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                        }`}
                    >
                      {message.text === "loading" ? (
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm">{message.text}</p>
                          {message.type === "incoming" &&
                            message.text &&
                            message.text !== "loading" && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {message.providerName && (
                                    <ProviderIcon
                                      providerName={message.providerName}
                                      model={message.model}
                                      size="sm"
                                      showModel={true}
                                    />
                                  )}
                                </div>
                                <div className="flex items-end">
                                  <FeedbackModal
                                    sessionId={sessionId}
                                    queryId={message.queryId || message.id}
                                    query={message.query || ""}
                                    providerName={message.providerName || ""}
                                    model={message.model || ""}
                                    intent={message.intent || ""}
                                    apiKey={apiKey}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isStarting || isSending}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isStarting || isSending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center flex-wrap gap-4">
                    {/* Provider Selection */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="provider-select"
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Preferred Provider:
                      </Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={preferredProvider}
                          onValueChange={setPreferredProvider}
                        >
                          <SelectTrigger className="w-48">
                            <div className="flex items-center gap-2">
                              {preferredProvider &&
                                preferredProvider !== "auto" && (
                                  <ProviderIcon
                                    providerName={preferredProvider}
                                    size="sm"
                                    showModel={false}
                                  />
                                )}
                              <SelectValue placeholder="Auto-select provider" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">
                              Auto-select provider
                            </SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="cohere">Cohere</SelectItem>
                            <SelectItem value="kimi">Kimi (Moonshot)</SelectItem>
                            <SelectItem value="minimax">MiniMax</SelectItem>
                            <SelectItem value="huggingface">
                              Hugging Face
                            </SelectItem>
                            <SelectItem value="azure_openai">
                              Azure OpenAI
                            </SelectItem>
                            <SelectItem value="aws_bedrock">
                              AWS Bedrock
                            </SelectItem>
                            <SelectItem value="mistral">Mistral</SelectItem>
                          </SelectContent>
                        </Select>
                        {preferredProvider && preferredProvider !== "auto" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreferredProvider("auto")}
                            className="text-xs"
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Cost Sensitivity Selection */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="cost-sensitivity-select"
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Cost Sensitivity:
                      </Label>
                      <Select
                        value={costSensitivity}
                        onValueChange={setCostSensitivity}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quality Priority Selection */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="quality-priority-select"
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Quality Priority:
                      </Label>
                      <Select
                        value={qualityPriority}
                        onValueChange={setQualityPriority}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cost">Cost</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Checkbox
                      id="instant-response"
                      checked={instantResponse}
                      onCheckedChange={(checked) =>
                        setInstantResponse(checked === true)
                      }
                      disabled={isStarting || isSending}
                      className="border border-gray-500"
                    />
                    <Label
                      htmlFor="instant-response"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Instant Response
                    </Label>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Configure API Key
            </DialogTitle>
            <DialogDescription>
              Enter your API key to start using the AI playground. You can
              create API keys in the API Keys section of the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsModalOpen(false);
                  router.push("/dashboard/api-keys");
                }}
                className="text-sm"
              >
                Create API Key
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={!apiKey}
                >
                  Cancel
                </Button>
                <Button onClick={handleApiKeySubmit} disabled={!apiKey.trim()}>
                  Save API Key
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeedbackModal({
  sessionId,
  queryId,
  query,
  providerName,
  model,
  intent,
  apiKey,
}: {
  sessionId: string;
  queryId: string;
  query: string;
  providerName: string;
  model: string;
  intent: string;
  apiKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const payload = {
        sessionId,
        queryId,
        query,
        intent: intent || "code generation",
        providerName,
        model,
        rating,
        comments: comments || undefined,
        responseTime: undefined,
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/v1/ai/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        toast.error("Failed to submit feedback");
      } else {
        toast.success("Thanks for your feedback!");
        setOpen(false);
        setRating(null);
        setComments("");
      }
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2">
      <Button
        variant="outlineBlack"
        size="sm"
        onClick={() => setOpen(true)}
        title="Rate this response"
        aria-label="Rate this response"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rate this response</DialogTitle>
            <DialogDescription>
              Your rating helps us improve responses. Comments are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Rating</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`p-2 rounded-md border transition ${rating && rating >= n
                        ? "bg-blue-600 border-blue-300"
                        : "bg-white"
                      }`}
                    aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`${rating && rating >= n ? "text-yellow-500" : "text-gray-400"}`}
                    />
                  </button>
                ))}
              </div>
              {!rating && (
                <p className="text-xs text-gray-500 mt-1">Rating is required</p>
              )}
            </div>
            <div>
              <Label className="text-sm">Comments (optional)</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share more about your rating..."
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outlineBlack"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={submitFeedback} disabled={!rating || submitting}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
