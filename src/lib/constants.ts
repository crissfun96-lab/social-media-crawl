import type { Platform, OutreachStatus, CampaignStatus, CampaignCreatorStatus, Brand, EngagementStatus } from '@/types/database';

export const PLATFORM_OPTIONS: readonly { readonly value: Platform; readonly label: string }[] = [
  { value: 'xhs', label: 'XHS (小红书)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter/X' },
] as const;

export const OUTREACH_STATUS_OPTIONS: readonly { readonly value: OutreachStatus; readonly label: string; readonly color: string }[] = [
  { value: 'not_contacted', label: 'Not Contacted', color: 'bg-zinc-700 text-zinc-300' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-900 text-blue-300' },
  { value: 'responded', label: 'Responded', color: 'bg-purple-900 text-purple-300' },
  { value: 'agreed', label: 'Agreed', color: 'bg-green-900 text-green-300' },
  { value: 'posted', label: 'Posted', color: 'bg-emerald-900 text-emerald-300' },
  { value: 'declined', label: 'Declined', color: 'bg-red-900 text-red-300' },
] as const;

export const CAMPAIGN_STATUS_OPTIONS: readonly { readonly value: CampaignStatus; readonly label: string; readonly color: string }[] = [
  { value: 'planning', label: 'Planning', color: 'bg-amber-900 text-amber-300' },
  { value: 'active', label: 'Active', color: 'bg-green-900 text-green-300' },
  { value: 'completed', label: 'Completed', color: 'bg-zinc-700 text-zinc-300' },
] as const;

export const CAMPAIGN_CREATOR_STATUS_OPTIONS: readonly { readonly value: CampaignCreatorStatus; readonly label: string }[] = [
  { value: 'invited', label: 'Invited' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'posted', label: 'Posted' },
  { value: 'paid', label: 'Paid' },
] as const;

export const CONTENT_TYPES = [
  'food_review',
  'vlog',
  'photography',
  'lifestyle',
  'travel',
  'beauty',
  'fashion',
  'fitness',
  'tech',
  'education',
  'other',
] as const;

export const DEFAULT_PAGE_SIZE = 50;

export function getPlatformLabel(platform: string): string {
  return PLATFORM_OPTIONS.find(p => p.value === platform)?.label ?? platform;
}

export function getOutreachStatusConfig(status: string) {
  return OUTREACH_STATUS_OPTIONS.find(s => s.value === status) ?? OUTREACH_STATUS_OPTIONS[0];
}

export function getCampaignStatusConfig(status: string) {
  return CAMPAIGN_STATUS_OPTIONS.find(s => s.value === status) ?? CAMPAIGN_STATUS_OPTIONS[0];
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// Creator tier system based on follower count
export type CreatorTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

export const CREATOR_TIERS: readonly { readonly tier: CreatorTier; readonly label: string; readonly min: number; readonly max: number; readonly color: string; readonly emoji: string }[] = [
  { tier: 'nano', label: 'Nano', min: 0, max: 999, color: 'bg-zinc-700 text-zinc-300', emoji: '🌱' },
  { tier: 'micro', label: 'Micro', min: 1000, max: 9999, color: 'bg-sky-900 text-sky-300', emoji: '⚡' },
  { tier: 'mid', label: 'Mid-Tier', min: 10000, max: 49999, color: 'bg-violet-900 text-violet-300', emoji: '🔥' },
  { tier: 'macro', label: 'Macro', min: 50000, max: 199999, color: 'bg-amber-900 text-amber-300', emoji: '💎' },
  { tier: 'mega', label: 'Mega', min: 200000, max: Infinity, color: 'bg-rose-900 text-rose-300', emoji: '👑' },
] as const;

export function getCreatorTier(followerCount: number | null | undefined): typeof CREATOR_TIERS[number] {
  const count = followerCount ?? 0;
  return CREATOR_TIERS.find(t => count >= t.min && count <= t.max) ?? CREATOR_TIERS[0];
}

export const BRAND_OPTIONS: readonly { readonly value: Brand; readonly label: string; readonly color: string }[] = [
  { value: 'songhwa', label: 'Songhwa', color: 'bg-orange-900 text-orange-300' },
  { value: 'byondwalls', label: 'Byondwalls', color: 'bg-indigo-900 text-indigo-300' },
  { value: 'hwc_coffee', label: 'HWC Coffee', color: 'bg-amber-900 text-amber-300' },
  { value: 'decore', label: 'De Core', color: 'bg-teal-900 text-teal-300' },
] as const;

export const ENGAGEMENT_STATUS_OPTIONS: readonly { readonly value: EngagementStatus; readonly label: string; readonly color: string }[] = [
  { value: 'prospect', label: 'Prospect', color: 'bg-zinc-700 text-zinc-300' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-900 text-blue-300' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-purple-900 text-purple-300' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-900 text-green-300' },
  { value: 'visited', label: 'Visited', color: 'bg-cyan-900 text-cyan-300' },
  { value: 'posted', label: 'Posted', color: 'bg-emerald-900 text-emerald-300' },
  { value: 'paid', label: 'Paid', color: 'bg-lime-900 text-lime-300' },
  { value: 'skipped', label: 'Skipped', color: 'bg-red-900 text-red-300' },
] as const;

export const PIC_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'liz', label: 'Liz' },
  { value: 'amber', label: 'Amber' },
  { value: 'amber/liz', label: 'Amber/Liz' },
  { value: 'amber/niling', label: 'Amber/Niling' },
] as const;

export function getBrandConfig(brand: string) {
  return BRAND_OPTIONS.find(b => b.value === brand) ?? BRAND_OPTIONS[0];
}

export function getEngagementStatusConfig(status: string) {
  return ENGAGEMENT_STATUS_OPTIONS.find(s => s.value === status) ?? ENGAGEMENT_STATUS_OPTIONS[0];
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '-';
  return `RM ${n.toLocaleString()}`;
}

export function formatCompactNumber(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
