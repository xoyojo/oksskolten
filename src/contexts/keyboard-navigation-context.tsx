import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface KeyboardNavigationValue {
  focusedItemId: string | null
  setFocusedItemId: (id: string | null) => void
  resetFocus: () => void
}

const KeyboardNavigationContext = createContext<KeyboardNavigationValue | null>(null)

export function KeyboardNavigationProvider({ children }: { children: ReactNode }) {
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)

  const resetFocus = useCallback(() => {
    setFocusedItemId(null)
  }, [])

  return (
    <KeyboardNavigationContext.Provider
      value={{ focusedItemId, setFocusedItemId, resetFocus }}
    >
      {children}
    </KeyboardNavigationContext.Provider>
  )
}

export function useKeyboardNavigationContext() {
  const ctx = useContext(KeyboardNavigationContext)
  if (!ctx) throw new Error('useKeyboardNavigationContext must be used within KeyboardNavigationProvider')
  return ctx
}
