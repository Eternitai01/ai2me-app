export interface VideoPlatformOption {
  name: string;
  value: string;
  selectedModel?: string;
  selectedModelLabel?: string;
  selectedResolution?: string;
  selectedDuration?: string;
  selectedSize?: string;
  selectedSecond?: string;
  selectedStyle?: string | null;
  selectedEffect?: string;
  selectedAspectRatio?: string;
  selectedPersonGeneration?: string;
  aspectRatio?: string;
  isSeed?: boolean;
  seed?: number;
  isImageRequired?: boolean;
  isBase64Object?: boolean;
  isUploadImage?: boolean;
  isNegativePrompt?: boolean;
  negativePrompt?: string;
  referenceImage?: string;
  base64Payload?: string;
  base64Full?: string;
  models?: { id: string; label: string }[];
  resolutions?: string[];
  durations?: string[];
  sizes?: string[];
  seconds?: string[];
  styles?: { id: string; label: string }[];
  effects?: { id: string; label: string }[];
  aspectRatios?: string[];
  personGenerations?: string[];
}

export const videosPlatform: VideoPlatformOption[] = [
  // Sora - hidden for now
  // {
  //   name: "Sora",
  //   value: "Sora",
  //   selectedModel: "Sora",
  //   selectedModelLabel: "Select Model",
  //   models: [{ id: "Sora", label: "Select Model" }],
  //   sizes: ["1920x1080", "1280x720", "960x540"],
  //   seconds: ["5", "10", "15"],
  //   selectedSize: "1920x1080",
  //   selectedSecond: "5",
  //   selectedEffect: "",
  //   selectedStyle: null,
  //   effects: [],
  //   styles: [],
  // },
  {
    name: "Wan",
    value: "Wan",
    selectedModel: "Wan",
    selectedModelLabel: "Wan",
    models: [{ id: "Wan", label: "Wan" }],
    resolutions: ["1920x1080", "1280x720"],
    durations: ["5", "10"],
    selectedResolution: "1920x1080",
    selectedDuration: "5",
    isSeed: true,
    seed: undefined,
    isNegativePrompt: true,
    negativePrompt: "",
  },
  // Leonardo - hidden for now
  // {
  //   name: "Leonardo",
  //   value: "Leonardo",
  //   selectedModel: "Leonardo",
  //   selectedModelLabel: "Leonardo",
  //   models: [{ id: "Leonardo", label: "Leonardo" }],
  //   resolutions: ["1920x1080", "1280x720"],
  //   durations: ["5", "10"],
  //   selectedResolution: "1920x1080",
  //   selectedDuration: "5",
  //   isSeed: true,
  //   seed: undefined,
  //   isNegativePrompt: true,
  //   negativePrompt: "",
  // },
  // Google - hidden for now
  // {
  //   name: "Google",
  //   value: "Google",
  //   selectedModel: "Google",
  //   selectedModelLabel: "Google",
  //   models: [{ id: "Google", label: "Google" }],
  //   selectedPersonGeneration: "auto",
  //   personGenerations: ["auto", "none"],
  //   isImageRequired: false,
  //   referenceImage: "",
  //   base64Payload: "",
  // },
  {
    name: "EternitAI",
    value: "EternitAI",
    selectedModel: "MiniMax-Hailuo-02",
    selectedModelLabel: "Hailuo 02",
    models: [
      { id: "MiniMax-Hailuo-02",  label: "Hailuo 02 (default)" },
      { id: "MiniMax-Hailuo-2.3", label: "Hailuo 2.3" },
      { id: "T2V-01",             label: "T2V-01" },
      { id: "T2V-01-Director",    label: "T2V-01 Director" },
      { id: "I2V-01",             label: "I2V-01 (image to video)" },
      { id: "I2V-01-Director",    label: "I2V-01 Director" },
    ],
    durations: ["6", "10"],
    resolutions: ["1080P", "768P", "720P"],
    selectedDuration: "6",
    selectedResolution: "1080P",
    isImageRequired: false,
    referenceImage: "",
    base64Full: "",
  },
  // Kling - hidden for now
  // {
  //   name: "Kling",
  //   value: "Kling",
  //   selectedModel: "Kling",
  //   selectedModelLabel: "Kling",
  //   models: [{ id: "Kling", label: "Kling" }],
  //   durations: ["5", "10"],
  //   selectedDuration: "5",
  //   selectedAspectRatio: "16:9",
  //   aspectRatios: ["16:9", "9:16", "1:1"],
  //   selectedStyle: null,
  //   styles: [
  //     { id: "std", label: "Standard" },
  //     { id: "pro", label: "Pro" },
  //   ],
  //   isNegativePrompt: true,
  //   negativePrompt: "",
  // },
];

export function getVideoPlatformByValue(value: string): VideoPlatformOption | undefined {
  return videosPlatform.find((p) => p.value === value);
}

export const DEFAULT_VIDEO_PLATFORM_VALUE = "EternitAI";
