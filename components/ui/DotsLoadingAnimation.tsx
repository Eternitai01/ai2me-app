"use client";

import { useState, useEffect } from "react";

interface DotsLoadingAnimationProps {
  loadingText?: string;
  extraHeight?: boolean;
  showBorder?: boolean;
  containerHeight?: string | null;
}

const COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-teal-400",
  "bg-cyan-400",
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function DotsLoadingAnimation({
  loadingText,
  extraHeight = false,
  showBorder = false,
  containerHeight = null,
}: DotsLoadingAnimationProps) {
  const [columns, setColumns]   = useState(7);
  const [rows, setRows]         = useState(6);
  const [dotSize, setDotSize]   = useState("w-1.5 h-1.5");
  const [gap, setGap]           = useState("gap-2");

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const baseRows  = loadingText ? 9 : 10;
      const mobileRows = loadingText ? 7 : 8;

      if (w >= 1536)      { setColumns(30); setRows(baseRows);   setDotSize("w-3.5 h-3.5"); setGap("gap-4"); }
      else if (w >= 1280) { setColumns(28); setRows(baseRows);   setDotSize("w-3 h-3");     setGap("gap-4"); }
      else if (w >= 1024) { setColumns(24); setRows(baseRows);   setDotSize("w-3 h-3");     setGap("gap-3.5"); }
      else if (w >= 768)  { setColumns(20); setRows(baseRows);   setDotSize("w-2.5 h-2.5"); setGap("gap-3"); }
      else if (w >= 468)  { setColumns(16); setRows(baseRows);   setDotSize("w-2 h-2");     setGap("gap-2.5"); }
      else                { setColumns(12); setRows(mobileRows); setDotSize("w-2 h-2");     setGap("gap-2"); }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [loadingText]);

  const dots       = Array.from({ length: columns * rows }, (_, i) => i);
  const dotColors  = dots.map(() => getRandomColor());

  const containerStyle = containerHeight && containerHeight !== "auto"
    ? { height: containerHeight }
    : {};

  return (
    <div
      className="flex-shrink-0 w-full snap-start flex items-stretch justify-center px-2 sm:px-4"
      data-loader="true"
    >
      <div
        className="relative flex items-stretch justify-center w-full max-w-full mx-auto"
        style={containerStyle}
      >
        {/* Optional rainbow gradient border */}
        {showBorder && (
          <div
            className="absolute inset-0 rounded-2xl p-[2px] animate-gradient z-0"
            style={{
              background: "linear-gradient(90deg,#f00,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#f00)",
              backgroundSize: "300% 100%",
            }}
          >
            <div className="w-full h-full rounded-2xl bg-black" />
          </div>
        )}

        {/* Dots grid */}
        <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full ${extraHeight ? "min-h-[220px] sm:min-h-[280px] md:min-h-[340px]" : ""}`}>
          <div className={`grid ${gap}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {dots.map((i) => (
              <span
                key={i}
                className={`${dotSize} ${dotColors[i]} rounded-full`}
                style={{
                  animation: "dots-blink 1.4s ease-in-out infinite",
                  animationDelay: `${(Math.random() * 1.2).toFixed(2)}s`,
                }}
              />
            ))}
          </div>

          {/* Loading text */}
          {loadingText && (
            <p className="mt-6 text-sm sm:text-base font-bold shine-text-loading">
              {loadingText}
            </p>
          )}
        </div>
      </div>

      {/* Keyframe + utility styles */}
      <style>{`
        @keyframes dots-blink {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
        @keyframes dots-gradient {
          0%   { background-position: 0%   50%; }
          100% { background-position: 300% 50%; }
        }
        .animate-gradient { animation: dots-gradient 4s linear infinite; }
        @keyframes shine-loading {
          0%   { background-position:  100% 0; }
          100% { background-position: -100% 0; }
        }
        .shine-text-loading {
          background: linear-gradient(90deg, #A1A1AA 0%, #0C03E0 60%, #A1A1AA 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 100%;
          animation: shine-loading 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
