// Org courante (pivot multi-tenant), persistée en localStorage. apiFetch lit
// currentOrgId pour X-Organization-Id. Clear au logout wired dans api-bootstrap.ts
// (couplage à sens unique : org-store n'importe pas auth-store).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrgState {
  currentOrgId: string | null

  setCurrentOrgId: (id: string | null) => void
  clear: () => void
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrgId: null,

      setCurrentOrgId: (id) => set({ currentOrgId: id }),

      clear: () => set({ currentOrgId: null }),
    }),
    { name: 'org-store' },
  ),
)

export const useCurrentOrgId = () => useOrgStore((s) => s.currentOrgId)
