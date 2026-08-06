"use client";

export interface SizeOption {
  label: string;
  width: number;
  height: number;
}

/* ── Per-model aspect ratio options (sourced from eternitai constants/screens.js) ── */
const MODEL_SIZES: Record<string, SizeOption[]> = {
  "EternitAI Pro": [
    { label: "1:1",   width: 1024, height: 1024 },
    { label: "16:9",  width: 1024, height: 576  },
    { label: "9:16",  width: 576,  height: 1024 },
    { label: "4:3",   width: 1024, height: 768  },
    { label: "3:4",   width: 768,  height: 1024 },
    { label: "3:2",   width: 1344, height: 896  },
    { label: "2:3",   width: 896,  height: 1344 },
    { label: "21:9",  width: 1344, height: 576  },
  ],
  "Flux": [
    { label: "1:1",   width: 1024, height: 1024 },
    { label: "16:9",  width: 1024, height: 576  },
    { label: "9:16",  width: 576,  height: 1024 },
    { label: "3:2",   width: 1344, height: 896  },
    { label: "2:3",   width: 896,  height: 1344 },
    { label: "5:4",   width: 1280, height: 1024 },
    { label: "4:5",   width: 1024, height: 1280 },
  ],
  "Flux Advanced": [
    { label: "1:1",   width: 1024, height: 1024 },
    { label: "16:9",  width: 1024, height: 576  },
    { label: "9:16",  width: 576,  height: 1024 },
    { label: "3:2",   width: 1344, height: 896  },
    { label: "2:3",   width: 896,  height: 1344 },
    { label: "5:4",   width: 1280, height: 1024 },
    { label: "4:5",   width: 1024, height: 1280 },
  ],
  "Dalle-3": [
    { label: "1:1",   width: 1024, height: 1024 },
    { label: "7:4",   width: 1792, height: 1024 },
    { label: "4:7",   width: 1024, height: 1792 },
  ],
  "Ideogram": [
    { label: "1:1",   width: 960,  height: 1024 },
    { label: "16:9",  width: 1472, height: 576  },
    { label: "9:16",  width: 704,  height: 1280 },
    { label: "4:3",   width: 1216, height: 832  },
    { label: "3:4",   width: 768,  height: 1344 },
    { label: "2:3",   width: 832,  height: 1248 },
    { label: "3:2",   width: 1088, height: 768  },
    { label: "4:5",   width: 800,  height: 1280 },
    { label: "5:4",   width: 1280, height: 800  },
  ],
  "Stable diffusion": [
    { label: "1:1",   width: 512,  height: 512  },
    { label: "16:9",  width: 1024, height: 576  },
    { label: "9:16",  width: 576,  height: 1024 },
    { label: "4:3",   width: 1024, height: 768  },
    { label: "3:4",   width: 768,  height: 1024 },
    { label: "3:2",   width: 768,  height: 512  },
    { label: "2:3",   width: 512,  height: 768  },
    { label: "9:20",  width: 576,  height: 1280 },
  ],
  "Google": [
    { label: "1:1",   width: 1024, height: 1024 },
    { label: "16:9",  width: 1456, height: 819  },
    { label: "9:16",  width: 819,  height: 1456 },
    { label: "4:3",   width: 1232, height: 924  },
    { label: "3:4",   width: 924,  height: 1232 },
    { label: "3:2",   width: 1344, height: 896  },
    { label: "2:3",   width: 896,  height: 1344 },
    { label: "21:9",  width: 1640, height: 738  },
  ],
};

const DEFAULT_SIZES: SizeOption[] = [
  { label: "1:1",  width: 1024, height: 1024 },
  { label: "16:9", width: 1024, height: 576  },
  { label: "9:16", width: 576,  height: 1024 },
];

export function getSizesForModel(modelId: string): SizeOption[] {
  return MODEL_SIZES[modelId] ?? DEFAULT_SIZES;
}

export function getDefaultSize(modelId: string): SizeOption {
  const sizes = getSizesForModel(modelId);
  // Default to 1:1 if available, else first option
  return sizes.find(s => s.label === "1:1") ?? sizes[0];
}

/* ── Visual shape preview for each ratio ── */
function AspectBox({ width, height }: { width: number; height: number }) {
  const ratio = width / height;
  const BOX  = 28; // outer box size px
  const PAD  = 4;
  let w: number, h: number;
  if (ratio >= 1) {
    w = BOX - PAD;
    h = Math.round((BOX - PAD) / ratio);
  } else {
    h = BOX - PAD;
    w = Math.round((BOX - PAD) * ratio);
  }
  return (
    <span
      className="inline-block rounded-sm border-2 border-current"
      style={{ width: w, height: h }}
    />
  );
}

interface Props {
  modelId: string;
  selected: SizeOption;
  onChange: (size: SizeOption) => void;
}

export default function ImageSizeSelector({ modelId, selected, onChange }: Props) {
  const sizes = getSizesForModel(modelId);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {sizes.map((size) => {
        const isActive = size.label === selected.label;
        return (
          <button
            key={size.label}
            type="button"
            onClick={() => onChange(size)}
            title={`${size.width}×${size.height}`}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${isActive
                ? "border-[var(--chat-accent)] text-[var(--chat-accent)] bg-[var(--chat-accent)]/10"
                : "border-[var(--chat-border)] text-[var(--chat-text-secondary)] hover:border-[var(--chat-accent)]/50 hover:text-[var(--chat-text-primary)]"
              }`}
          >
            <AspectBox width={size.width} height={size.height} />
            <span>{size.label}</span>
          </button>
        );
      })}
    </div>
  );
}
