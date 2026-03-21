import type { Platform, OutreachStatus, CampaignStatus, CampaignCreatorStatus } from '@/types/database';

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

export const DEFAULT_PAGE_SIZE = 20;

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
