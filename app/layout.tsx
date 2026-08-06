import type React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { Toaster } from "sonner";
import { CookieConsentModal } from "@/components/CookieConsentModal";
import { GlobalAuthModal } from "@/components/GlobalAuthModal";
import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";
import ClientProviders from "./ClientProviders";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export const metadata = {
  title: "The Operating System for Building and Running Businesses",
  description:
    "A Complete AI Operating System\nBuild + Launch + Operate + Scale",
  openGraph: {
    type: 'website',
    url: 'https://www.ai2me.com/',
    title: "The Operating System for Building and Running Businesses",
    description: 'A Complete AI Operating System\nBuild + Launch + Operate + Scale',
    images: [
      {
        url: 'https://www.ai2me.com/thumbnail.png?v=8',
        alt: 'AI2me Platform',
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Operating System for Building and Running Businesses',
    description: 'A Complete AI Operating System\nBuild + Launch + Operate + Scale',
    images: ['https://www.ai2me.com/thumbnail.png?v=8'],
  },
  other: {
    "fb:app_id": "1922177521720591",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeScript = `
(function(){
  var s=localStorage.getItem('chat-theme');
  var t=(s==='light'||s==='dark')?s:(typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  if(document.documentElement){document.documentElement.classList.add(t);}
})();
`;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SessionProvider>
          <AuthProvider>
            <AuthModalProvider>
              <ClientProviders>
                {children}
                <Toaster position="top-right" richColors closeButton />
                <CookieConsentModal />
              </ClientProviders>
            </AuthModalProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
