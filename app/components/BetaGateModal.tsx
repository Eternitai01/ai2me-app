'use client'

import { X } from 'lucide-react'

interface BetaGateModalProps {
  onClose: () => void
}

/**
 * Beta Gate Modal
 *
 * Shown when a non-allowlisted user attempts to start any AI2me tool
 * during the internal beta period.
 *
 * The underlying tool action is NOT started — this modal intercepts
 * the action before it begins.
 */
export default function BetaGateModal({ onClose }: BetaGateModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Clicking the backdrop doesn't close — user must click "Got it"
        e.stopPropagation()
      }}
    >
      <div className="relative bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        {/* AI2me Logo mark */}
        <div className="flex justify-center mb-6">
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#0066FF" />
              </linearGradient>
            </defs>
            <path d="M50 8L87 28V68L50 88L13 68V28L50 8Z" stroke="url(#mgGrad)" strokeWidth="4" fill="none" />
            <path
              d="M32 50C32 44 36 40 42 40C48 40 50 44 50 50C50 56 52 60 58 60C64 60 68 56 68 50C68 44 64 40 58 40C52 40 50 44 50 50C50 56 48 60 42 60C36 60 32 56 32 50Z"
              stroke="url(#mgGrad)"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Welcome to AI2me
        </h2>

        {/* Body */}
        <div className="text-gray-600 dark:text-gray-300 text-center space-y-4 mt-4">
          <p>
            Thanks for signing up for{' '}
            <span className="font-semibold text-gray-900 dark:text-white">AI2me.com</span>.
          </p>
          <p>
            We are currently completing our final internal beta testing before opening the platform to new users.
          </p>

          {/* Highlight */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl px-5 py-4">
            <p className="font-semibold text-blue-700 dark:text-blue-300 text-lg">
              You&rsquo;re on the list.
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
              We&rsquo;ll send you an email in early September as soon as your access is ready.
            </p>
          </div>

          <p className="text-sm">
            We look forward to having you experience the new AI2me.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
