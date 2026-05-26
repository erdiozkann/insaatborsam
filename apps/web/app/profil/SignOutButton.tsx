'use client'

import { signOutAction } from './actions'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
      >
        Çıkış Yap
      </button>
    </form>
  )
}
