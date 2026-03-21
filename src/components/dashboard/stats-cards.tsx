'use client';

import { Card } from '@/components/ui/card';
import {
  formatNumber,
  formatCompactNumber,
  OUTREACH_STATUS_OPTIONS,
  CREATOR_TIERS,
  getCreatorTier,
  getPlatformLabel,
} from '@/lib/constants';
import type { DashboardStats } from '@/types/database';
import type { PostWithCreator } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatsCardsProps {
  readonly stats: DashboardStats;
}

interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly accent: string;
  readonly detail?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const FUNNEL_STEPS = [
  { key: 'not_contacted', label: 'Not Contacted', bg: 'bg-zinc-600', text: 'text-zinc-300' },
  { key: 'contacted', label: 'Contacted', bg: 'bg-blue-600', text: 'text-blue-300' },
  { key: 'responded', label: 'Responded', bg: 'bg-purple-600', text: 'text-purple-300' },
  { key: 'agreed', label: 'Agreed', bg: 'bg-green-600', text: 'text-green-300' },
  { key: 'posted', label: 'Posted', bg: 'bg-emerald-500', text: 'text-emerald-300' },
] as const;

const TIER_COLORS: Record<string, string> = {
  nano: 'bg-zinc-500',
  micro: 'bg-sky-500',
  mid: 'bg-violet-500',
  macro: 'bg-amber-500',
  mega: 'bg-rose-500',
};

const PLATFORM_DOTS: Record<string, string> = {
  xhs: 'bg-red-500',
  instagram: 'bg-pink-500',
  tiktok: 'bg-cyan-400',
  youtube: 'bg-red-600',
  facebook: 'bg-blue-500',
  twitter: 'bg-sky-400',
};

// ---------------------------------------------------------------------------
// Helpers (pure, no mutations)
// ---------------------------------------------------------------------------

function getStatusCount(
  data: DashboardStats['byOutreachStatus'],
  status: string,
): number {
  return data.find(s => s.status === status)?.count ?? 0;
}

function computeContactedCount(data: DashboardStats['byOutreachStatus']): number {
  return (
    getStatusCount(data, 'contacted') +
    getStatusCount(data, 'responded') +
    getStatusCount(data, 'agreed') +
    getStatusCount(data, 'posted') +
    getStatusCount(data, 'declined')
  );
}

function computeResponseRate(data: DashboardStats['byOutreachStatus']): number {
  const contacted = computeContactedCount(data);
  if (contacted === 0) return 0;
  const responded =
    getStatusCount(data, 'responded') +
    getStatusCount(data, 'agreed') +
    getStatusCount(data, 'posted');
  return Math.round((responded / contacted) * 100);
}

function buildTierBars(
  tierBreakdown: DashboardStats['tierBreakdown'],
  total: number,
): ReadonlyArray<{ readonly tier: string; readonly pct: number }> {
  if (!tierBreakdown || total === 0) {
    return CREATOR_TIERS.map(t => ({ tier: t.tier, pct: 0 }));
  }
  return CREATOR_TIERS.map(t => {
    const count = tierBreakdown.find(tb => tb.tier === t.tier)?.count ?? 0;
    return { tier: t.tier, pct: Math.round((count / total) * 100) };
  });
}

// ---------------------------------------------------------------------------
// Mini-components
// ---------------------------------------------------------------------------

function MiniProgressRing({ pct, size = 36 }: { readonly pct: number; readonly size?: number }) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-zinc-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-indigo-400"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function TierMiniBars(
  { bars }: { readonly bars: ReadonlyArray<{ readonly tier: string; readonly pct: number }> },
) {
  return (
    <div className="flex items-end gap-0.5 h-4 mt-2">
      {bars.map(({ tier, pct }) => (
        <div
          key={tier}
          className={`flex-1 rounded-sm ${TIER_COLORS[tier] ?? 'bg-zinc-600'}`}
          style={{ height: `${Math.max(pct, 8)}%` }}
          title={`${CREATOR_TIERS.find(t => t.tier === tier)?.label ?? tier}: ${pct}%`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent, detail }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`}
        aria-hidden="true"
      />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-zinc-100 tabular-nums">
        {value}
      </p>
      {detail}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatsCards (exported)
// ---------------------------------------------------------------------------

export function StatsCards({ stats }: StatsCardsProps) {
  const contacted = computeContactedCount(stats.byOutreachStatus);
  const contactedPct =
    stats.totalCreators > 0
      ? Math.round((contacted / stats.totalCreators) * 100)
      : 0;
  const responseRate = computeResponseRate(stats.byOutreachStatus);
  const tierBars = buildTierBars(stats.tierBreakdown, stats.totalCreators);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Creators"
        value={formatNumber(stats.totalCreators)}
        accent="bg-indigo-500"
        detail={
          <div>
            <TierMiniBars bars={tierBars} />
            <div className="flex gap-2 mt-1.5">
              {CREATOR_TIERS.map(t => (
                <span key={t.tier} className="text-[9px] text-zinc-600 uppercase">
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        }
      />

      <StatCard
        label="Contacted"
        value={formatNumber(contacted)}
        accent="bg-blue-500"
        detail={
          <div className="flex items-center gap-2 mt-2">
            <MiniProgressRing pct={contactedPct} />
            <span className="text-xs text-zinc-400">
              {contactedPct}% of total
            </span>
          </div>
        }
      />

      <StatCard
        label="Posts Tracked"
        value={formatNumber(stats.totalPosts)}
        accent="bg-purple-500"
        detail={
          stats.postsAboutUs > 0 ? (
            <p className="mt-2 text-xs text-emerald-400">
              {stats.postsAboutUs} about us
            </p>
          ) : undefined
        }
      />

      <StatCard
        label="Response Rate"
        value={`${responseRate}%`}
        accent="bg-emerald-500"
        detail={
          <p className="mt-2 text-xs text-zinc-500">
            responded + agreed + posted / contacted
          </p>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// OutreachFunnel (exported)
// ---------------------------------------------------------------------------

export function OutreachFunnel(
  { data }: { readonly data: DashboardStats['byOutreachStatus'] },
) {
  if (data.length === 0) return null;

  const steps = FUNNEL_STEPS.map(step => ({
    ...step,
    count: getStatusCount(data, step.key),
  }));

  const maxCount = Math.max(...steps.map(s => s.count), 1);

  const conversions: ReadonlyArray<string> = steps.slice(1).map((step, i) => {
    const prev = steps[i].count;
    if (prev === 0) return '—';
    return `${Math.round((step.count / prev) * 100)}%`;
  });

  return (
    <Card>
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Outreach Funnel
      </h3>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const widthPct = Math.max((step.count / maxCount) * 100, 4);
          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${step.text}`}>
                  {step.label}
                </span>
                <span className="text-xs tabular-nums text-zinc-400">
                  {formatCompactNumber(step.count)}
                </span>
              </div>
              <div className="relative h-6 bg-zinc-800/60 rounded overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${step.bg} rounded transition-all duration-500`}
                  style={{ width: `${widthPct}%` }}
                />
                <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-semibold text-white/80">
                  {step.count > 0 ? formatNumber(step.count) : ''}
                </span>
              </div>
              {i < steps.length - 1 && (
                <p className="text-[10px] text-zinc-600 mt-0.5 pl-1">
                  {conversions[i]} conversion
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PlatformBreakdown (exported)
// ---------------------------------------------------------------------------

export function PlatformBreakdown(
  { data }: { readonly data: DashboardStats['byPlatform'] },
) {
  if (data.length === 0) return null;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">By Platform</h3>
      <div className="space-y-2.5">
        {data.map(({ platform, count }) => {
          const dotColor = PLATFORM_DOTS[platform] ?? 'bg-zinc-500';
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={platform} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${dotColor}`}
                  aria-hidden="true"
                />
                <span className="text-sm text-zinc-400 zh-text">
                  {getPlatformLabel(platform)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dotColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-zinc-300 w-10 text-right tabular-nums">
                  {formatNumber(count)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// OutreachBreakdown (alias for funnel — keeps import compat)
// ---------------------------------------------------------------------------

export function OutreachBreakdown(
  { data }: { readonly data: DashboardStats['byOutreachStatus'] },
) {
  return <OutreachFunnel data={data} />;
}
