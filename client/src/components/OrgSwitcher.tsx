import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentOrgId } from '@/stores/org-store'
import { useOrganizationsList, useSwitchOrganization } from '@/hooks/org-hooks'

export default function OrgSwitcher() {
  const currentOrgId = useCurrentOrgId()
  const switchOrg = useSwitchOrganization()
  const { data, isPending } = useOrganizationsList()

  // Pas d'org (loading ou compte sans org) → rien, plutôt qu'un dropdown vide.
  if (isPending || !data || data.length === 0) return null

  return (
    <Select
      value={currentOrgId ?? undefined}
      onValueChange={switchOrg}
    >
      <SelectTrigger className="min-w-48">
        <SelectValue placeholder="Sélectionner une organisation" />
      </SelectTrigger>
      <SelectContent>
        {data.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
