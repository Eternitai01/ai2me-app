'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import BetaGateModal from '@/app/components/BetaGateModal'

interface BetaGateState {
  /** True if INTERNAL_BETA_MODE is on AND the current user is not allowlisted */
  betaRestricted: boolean
  /** True if the modal is currently visible */
  modalVisible: boolean
  /**
   * Call this before starting any protected tool action.
   * Returns true  → user has access, proceed with the action.
   * Returns false → user is restricted, modal has been shown, do NOT proceed.
   */
  guardAction: () => Promise<boolean>
  closeModal: () => void
}

const BetaGateContext = createContext<BetaGateState>({
  betaRestricted: false,
  modalVisible: false,
  guardAction: async () => true,
  closeModal: () => {},
})

export function BetaGateProvider({ children }: { children: React.ReactNode }) {
  const [betaRestricted, setBetaRestricted] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const resolveRef = useRef<((allowed: boolean) => void) | null>(null)

  // Check access once on mount (and after any auth change)
  useEffect(() => {
    let cancelled = false
    fetch('/api/beta/check', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        // Restricted = beta mode is on AND user doesn't have access
        setBetaRestricted(data.betaMode === true && data.hasAccess === false)
      })
      .catch(() => {
        // On error, default to unrestricted — don't block users due to network issues
        if (!cancelled) setBetaRestricted(false)
      })
    return () => { cancelled = true }
  }, [])

  const guardAction = useCallback((): Promise<boolean> => {
    if (!betaRestricted) return Promise.resolve(true)

    // Show the modal and return a promise that resolves when the user closes it
    setModalVisible(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [betaRestricted])

  const closeModal = useCallback(() => {
    setModalVisible(false)
    resolveRef.current?.(false)
    resolveRef.current = null
  }, [])

  return (
    <BetaGateContext.Provider value={{ betaRestricted, modalVisible, guardAction, closeModal }}>
      {children}
      {modalVisible && <BetaGateModal onClose={closeModal} />}
    </BetaGateContext.Provider>
  )
}

export function useBetaGate(): BetaGateState {
  return useContext(BetaGateContext)
}
