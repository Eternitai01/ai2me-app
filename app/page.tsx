"use client";

import React, { useState } from "react";

// Orb SVG Placeholder (replace with your AI orb image or DALL·E-asset)
const AIOrb = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
    <svg width={170} height={170} viewBox="0 0 170 170">
      <radialGradient id="orb" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#2224ff" />
        <stop offset="75%" stopColor="#444" />
        <stop offset="100%" stopColor="#191919" />
      </radialGradient>
      <circle cx={85} cy={85} r={80} fill="url(#orb)" />
      <path d="M50 85 Q85 60 120 85 T170 85" stroke="#fff" strokeWidth={3} fill="none" opacity={0.85}/>
    </svg>
  </div>
);

export default function Home() {
  const [mode, setMode] = useState("automated"); // "manual" or "automated"
  const [isLight, setIsLight] = useState(false);
  const bgColor = isLight ? "#fafafa" : "#000";
  const fgColor = isLight ? "#222" : "#fff";

  return (
    <div
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* Theme toggle button with Sun/Moon icon */}
      <button
        style={{
          position: "absolute",
          top: 18,
          right: 36,
          background: isLight ? "#222" : "#fff",
          color: isLight ? "#fff" : "#222",
          border: "none",
          borderRadius: 20,
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: "1.2rem",
        }}
        onClick={() => setIsLight((l) => !l)}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        {isLight ? "🌙" : "☀️"}
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80vh", justifyContent: "center" }}>
        <h1 style={{ fontSize: "3.2rem", marginBottom: 18, textAlign: "center", fontWeight: 700, letterSpacing: -1 }}>
          Invierte con AI2me
        </h1>
        <div style={{ maxWidth: 540, fontSize: "1.25rem", textAlign: "center", marginBottom: 32, color: "#bbb" }}>
          Alcanza tus metas con una cartera gestionada por IA.<br/>
          Invierte en piloto automático con transferencias periódicas, o participa manualmente.
          Capital sujeto a riesgo.
        </div>
        <button style={{ background: fgColor, color: bgColor, borderRadius: 28, padding: "14px 38px", border: "none", fontWeight: 600, fontSize: "1.1rem", cursor: "pointer", marginBottom: 32 }}>
          Pruébalo
        </button>
        <AIOrb />
      </div>
    </div>
  );
}
