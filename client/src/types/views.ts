// Mirror des DTO Output backend (App\Dto\Output) : enums en string, dates ISO 8601.

import type {
  ArticleImportStatus,
  ArticleStatus,
  MemberRole,
  PlanTier,
  SubscriptionStatus,
} from './enums'

export interface OrganizationView {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface UserView {
  id: string
  email: string | null
}

export interface MemberView {
  id: string
  userId: string
  email: string | null
  role: MemberRole
  invitedAt: string
  joinedAt: string | null
}

export interface ArticleView {
  id: string
  title: string
  slug: string
  content: string
  status: ArticleStatus
  authorId: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SubscriptionView {
  id: string
  plan: PlanTier
  status: SubscriptionStatus
  trialEndsAt: string
  currentPeriodEndsAt: string | null
}

export interface ArticleImportView {
  id: string
  status: ArticleImportStatus
  importedCount: number
  skippedCount: number
  finishedAt: string | null
  createdAt: string
}
