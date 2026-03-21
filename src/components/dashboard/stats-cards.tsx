'use client';

import { Card } from '@/components/ui/card';
import { formatNumber, getPlatformLabel, getOutreachStatusConfig } from '@/lib/constants';
import type { DashboardStats } from '@/types/database';

interface StatsCardsProps {
  readonly stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Creators" value={stats.totalCreators.toString()} />
      <StatCard label="Total Posts" value={stats.totalPosts.toString()} />
      <StatCard label="Posts About Us" value={stats.postsAboutUs.toString()} highlight />
      <StatCard
        label="Response Rate"
        value={stats.totalCreators > 0
          ? `${Math.round(
              ((stats.byOutreachStatus.find(s => s.status === 'responded')?.count ?? 0) +
               (stats.byOutreachStatus.find(s => s.status === 'agreed')?.count ?? 0) +
               (stats.byOutreachStatus.find(s => s.status === 'posted')?.count ?? 0)) /
              Math.max(1, stats.byOutreachStatus.find(s => s.status === 'contacted')?.count ?? 1) * 100
            )}%`
          : '0%'}
      />
    </div>
  );
}

function StatCard({ label, value, highlight }: { readonly label: string; readonly value: string; readonly highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-indigo-800' : ''}>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-indigo-400' : 'text-zinc-100'}`}>{value}</p>
    </Card>
  );
}

export function PlatformBreakdown({ data }: { readonly data: DashboardStats['byPlatform'] }) {
  if (data.length === 0) return null;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">By Platform</h3>
      <div className="space-y-2">
        {data.map(({ platform, count }) => (
          <div key={platform} className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{getPlatformLabel(platform)}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-zinc-300 w-8 text-right">{formatNumber(count)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function OutreachBreakdown({ data }: { readonly data: DashboardStats['byOutreachStatus'] }) {
  if (data.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Outreach Status</h3>
      <div className="space-y-2">
        {data.map(({ status, count }) => {
          const config = getOutreachStatusConfig(status);
          return (
            <div key={status} className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                {config.label}
              </span>
              <span className="text-sm font-medium text-zinc-300">{count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
