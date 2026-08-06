"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type TranslationMap = Record<string, string>;
const TranslationCache: Record<string, TranslationMap> = {};

const LanguageContext = createContext<{
  language: string;
  t: (key: string, fallback?: string) => string;
}>({ language: "en", t: (k, f) => f ?? k });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState<TranslationMap>({});

  const loadTranslations = useCallback(async (lang: string) => {
    if (lang === "en") { setTranslations({}); return; }
    if (TranslationCache[lang]) { setTranslations(TranslationCache[lang]); return; }
    try {
      const mod = await import(`./locales/${lang}.json`);
      TranslationCache[lang] = mod.default;
      setTranslations(mod.default);
    } catch { setTranslations({}); }
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ai2me_language") || "en" : "en";
    setLanguage(stored);
    loadTranslations(stored);

    const handler = () => {
      const lang = localStorage.getItem("ai2me_language") || "en";
      setLanguage(lang);
      loadTranslations(lang);
    };
    window.addEventListener("ai2me-language-change", handler);
    return () => window.removeEventListener("ai2me-language-change", handler);
  }, [loadTranslations]);

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[key] ?? fallback ?? key;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
