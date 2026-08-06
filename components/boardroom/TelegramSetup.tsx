"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TelegramSetupState = {
  step: number;
  groupLink: string;
  groupValidated: boolean;
  groupId: string;
  groupName: string;
  tokens: string;
  activationConfirmed: boolean;
  completed: boolean;
};

const STORAGE_KEY = "telegram_setup_state_v1";

const steps = [
  { id: 0, title: "Group Link", description: "Paste your Telegram invite link" },
  { id: 1, title: "Bot Tokens", description: "Enter 2 bot tokens" },
  { id: 2, title: "Activation", description: "Confirm bots are in the group" },
];

const defaultState: TelegramSetupState = {
  step: 0,
  groupLink: "",
  groupValidated: false,
  groupId: "",
  groupName: "",
  tokens: "",
  activationConfirmed: false,
  completed: false,
};

function parseTokens(tokensText: string): string[] {
  return tokensText
    .split(/[\n,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

const TelegramSetup: React.FC = () => {
  const [state, setState] = useState<TelegramSetupState>(defaultState);
  const [isMounted, setIsMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [isValidatingTokens, setIsValidatingTokens] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenResults, setTokenResults] = useState<
    { token: string; valid: boolean; bot_username?: string }[]
  >([]);
  const [tokensValidated, setTokensValidated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationResults, setActivationResults] = useState<
    { bot_id: string; bot_username: string; in_group: boolean; status?: string }[]
  >([]);
  const [activationComplete, setActivationComplete] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TelegramSetupState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          step: typeof parsed.step === "number" ? parsed.step : prev.step,
        }));
      }
    } catch {
      // ignore invalid localStorage
    }
  }, [isMounted]);

  const persist = useCallback((next: TelegramSetupState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  }, []);

  const tokensList = useMemo(() => parseTokens(state.tokens), [state.tokens]);

  const canProceed = useMemo(() => {
    if (state.step === 0) return state.groupValidated;
    if (state.step === 1) return tokensValidated;
    if (state.step === 2) return activationComplete;
    return false;
  }, [state.step, state.groupValidated, activationComplete, tokensValidated]);

  const goToStep = (nextStep: number) => {
    persist({ ...state, step: nextStep });
  };

  const handleReset = () => {
    persist(defaultState);
    setTokensValidated(false);
    setTokenResults([]);
    setTokenError(null);
    setActivationResults([]);
    setActivationError(null);
    setActivationComplete(false);
  };

  const handleFinish = () => {
    if (!activationComplete) return;
    persist({ ...state, completed: true });
  };

  const validateGroupLink = async () => {
    setIsValidating(true);
    setValidateError(null);
    try {
      const res = await fetch("/api/boardroom/telegram/validate-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_link: state.groupLink.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string;
        data?: { group_id?: string | number; group_name?: string };
      };
      if (!res.ok) {
        setValidateError(data.detail || "Failed to validate link");
        persist({ ...state, groupValidated: false, groupId: "", groupName: "" });
        return;
      }
      persist({
        ...state,
        groupValidated: true,
        groupId: data.data?.group_id ? String(data.data.group_id) : "",
        groupName: data.data?.group_name || "",
        step: 1,
      });
    } catch (err) {
      setValidateError((err as Error).message || "Validation failed");
      persist({ ...state, groupValidated: false, groupId: "", groupName: "" });
    } finally {
      setIsValidating(false);
    }
  };

  const validateTokens = async () => {
    setIsValidatingTokens(true);
    setTokenError(null);
    setTokensValidated(false);
    setTokenResults([]);
    try {
      const res = await fetch("/api/boardroom/telegram/validate-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: tokensList }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string;
        data?: { results?: { token: string; valid: boolean; bot_username?: string }[] };
      };
      if (!res.ok) {
        setTokenError(data.detail || "Failed to validate tokens");
        return;
      }
      const results = data.data?.results || [];
      setTokenResults(results);
      const allValid = results.length === 2 && results.every((r) => r.valid);
      setTokensValidated(allValid);
      if (allValid) {
        persist({ ...state, step: 2 });
      }
    } catch (err) {
      setTokenError((err as Error).message || "Token validation failed");
    } finally {
      setIsValidatingTokens(false);
    }
  };

  const activateBots = async () => {
    setIsActivating(true);
    setActivationError(null);
    setActivationComplete(false);
    try {
      const res = await fetch("/api/boardroom/telegram/add-bots-to-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string;
        data?: { results?: { bot_id: string; bot_username: string; in_group: boolean; status?: string }[] };
      };
      if (!res.ok) {
        setActivationError(data.detail || "Failed to activate bots");
        return;
      }
      const results = data.data?.results || [];
      setActivationResults(results);
      const allActive = results.length > 0 && results.every((r) => r.in_group && r.status === "active");
      setActivationComplete(allActive);
    } catch (err) {
      setActivationError((err as Error).message || "Activation failed");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <section
      className="w-full max-w-4xl mx-auto rounded-2xl border border-border bg-card p-6 shadow-sm"
      aria-label="Telegram setup wizard"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Boardroom Setup
          </p>
          <h2 className="text-xl font-semibold text-foreground">Telegram Setup Wizard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete all steps to connect your boardroom group.
          </p>
        </div>
        <Button variant="outlineGray" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((step) => {
          const isActive = state.step === step.id;
          const isComplete = state.step > step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(step.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? "border-foreground/40 bg-foreground/5"
                  : "border-border bg-background hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {step.title}
                </span>
                <span
                  className={`text-xs ${
                    isComplete ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  {isComplete ? "Done" : `Step ${step.id + 1}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background p-5">
        {state.completed ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
              Telegram setup complete. Your bots are active and ready to post.
            </div>
            <Button variant="outlineGray" size="sm" onClick={handleReset}>
              Reset Setup
            </Button>
          </div>
        ) : (
          <>
            {state.step === 0 && (
              <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Telegram Invite Link
              </label>
              <Input
                value={state.groupLink}
                onChange={(e) =>
                  persist({
                    ...state,
                    groupLink: e.target.value,
                    groupValidated: false,
                    groupId: "",
                    groupName: "",
                  })
                }
                placeholder="https://t.me/+yourInviteHash"
                className="mt-2"
              />
            </div>
            {state.groupValidated && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
                Link validated. {state.groupName ? `Group: ${state.groupName}` : "Group found."}
              </div>
            )}
            {validateError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {validateError}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={validateGroupLink}
                disabled={isValidating || !state.groupLink.trim()}
              >
                {isValidating ? "Validating..." : "Validate Link"}
              </Button>
              {state.groupId && (
                <span className="text-xs text-muted-foreground">
                  Group ID: {state.groupId}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Make sure the invite link is active and set to “Invite via link”.
            </p>
              </div>
            )}

            {state.step === 1 && (
              <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Bot Tokens (2)
              </label>
              <Textarea
                value={state.tokens}
                onChange={(e) =>
                  persist({ ...state, tokens: e.target.value })
                }
                placeholder="Paste 2 tokens, one per line"
                className="mt-2 min-h-[140px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tokens detected: {tokensList.length} / 2
            </p>
            {tokenError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {tokenError}
              </div>
            )}
            {tokenResults.length > 0 && (
              <div className="space-y-2 text-xs text-muted-foreground">
                {tokenResults.map((result, index) => (
                  <div
                    key={`${result.token}-${index}`}
                    className={`rounded-md border px-3 py-2 ${
                      result.valid
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-red-500/30 bg-red-500/10 text-red-500"
                    }`}
                  >
                    {result.valid ? "Valid" : "Invalid"} token
                    {result.bot_username ? ` • @${result.bot_username}` : ""}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={validateTokens}
                disabled={isValidatingTokens || tokensList.length !== 2}
              >
                {isValidatingTokens ? "Validating..." : "Validate Tokens"}
              </Button>
              {tokensValidated && (
                <span className="text-xs text-emerald-500">
                  All tokens validated.
                </span>
              )}
            </div>
              </div>
            )}

            {state.step === 2 && (
              <div className="space-y-4">
            <p className="text-sm text-foreground">
              Add all bots to your Telegram group, then confirm activation.
            </p>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={state.activationConfirmed}
                onChange={(e) =>
                  persist({ ...state, activationConfirmed: e.target.checked })
                }
                className="h-4 w-4 accent-emerald-500"
              />
                All bots have been added and can post in the group.
            </label>
            {activationError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {activationError}
              </div>
            )}
            {activationResults.length > 0 && (
              <div className="space-y-2 text-xs">
                {activationResults.map((result) => (
                  <div
                    key={result.bot_id}
                    className={`rounded-md border px-3 py-2 ${
                      result.in_group && result.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    @{result.bot_username || "bot"} • {result.in_group ? "In group" : "Not in group"} • {result.status || "pending"}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={activateBots}
                disabled={isActivating || !state.activationConfirmed}
              >
                {isActivating ? "Activating..." : "Activate Bots"}
              </Button>
              {activationComplete && (
                <span className="text-xs text-emerald-500">
                  Activation complete.
                </span>
              )}
            </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outlineGray"
          size="sm"
          onClick={() => goToStep(Math.max(0, state.step - 1))}
          disabled={state.step === 0 || state.completed}
        >
          Back
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() =>
            state.step === steps.length - 1 ? handleFinish() : goToStep(Math.min(steps.length - 1, state.step + 1))
          }
          disabled={!canProceed || state.completed}
        >
          {state.step === steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </section>
  );
};

export default TelegramSetup;
