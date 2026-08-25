"use client";

import { useRouter } from "next/navigation";

interface BetaGateModalProps {
  /** Called when the user clicks "Got it" */
  onClose: () => void;
}

/**
 * Beta Gate Modal — shown when a non-allowlisted user tries to enter a tool.
 *
 * The tool does NOT execute. "Got it" returns them to the home page.
 */
export default function BetaGateModal({ onClose }: BetaGateModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-[#111827] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <svg
            width="56"
            height="56"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bvGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <path
              d="M50 8L87 28V68L50 88L13 68V28L50 8Z"
              stroke="url(#bvGrad)"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M32 50C32 44 36 40 42 40C48 40 50 44 50 50C50 56 52 60 58 60C64 60 68 56 68 50C68 44 64 40 58 40C52 40 50 44 50 50C50 56 48 60 42 60C36 60 32 56 32 50Z"
              stroke="url(#bvGrad)"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
          Welcome to AI2me
        </h2>

        {/* Body */}
        <div className="space-y-4 text-center text-gray-600 dark:text-gray-300">
          <p>
            Thanks for signing up for{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              AI2me.com
            </span>
            .
          </p>
          <p>
            We are currently completing our final internal beta testing before
            opening the platform to new users.
          </p>

          {/* Highlight box */}
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl px-5 py-4 my-4">
            <p className="font-semibold text-indigo-700 dark:text-indigo-300 text-lg">
              You&rsquo;re on the list.
            </p>
            <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1">
              We&rsquo;ll send you an email in early September as soon as your
              access is ready.
            </p>
          </div>

          <p className="text-sm">
            We look forward to having you experience the new AI2me.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
