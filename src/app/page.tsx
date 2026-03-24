'use client';

import { useFetch } from '@/lib/hooks';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCards, OutreachBreakdown } from '@/components/dashboard/stats-cards';
import { BrandBreakdown } from '@/components/dashboard/brand-breakdown';
import { PicBreakdown } from '@/components/dashboard/pic-breakdown';
import { EngagementPipeline } from '@/components/dashboard/engagement-pipeline';
import { RecentPosts } from '@/components/dashboard/recent-posts';
import { TopCreators } from '@/components/dashboard/top-creators';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DashboardSkeleton } from '@/components/ui/spinner';
import type { DashboardStats } from '@/types/database';

function getTodaySubtitle(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const { data: stats, loading, error } = useFetch<DashboardStats>('/api/stats');

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load stats: {error}</p>
        <p className="text-sm text-zinc-500 mt-2">Make sure your Firebase credentials are set in .env.local</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <PageHeader
        title="Byondwalls KOC Dashboard"
        subtitle={getTodaySubtitle()}
      />
      <StatsCards stats={stats} />
      <div className="mt-6">
        <QuickActions />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <BrandBreakdown data={stats.byBrand ?? []} />
        <PicBreakdown data={stats.picBreakdown ?? []} totalSpent={stats.totalSpent ?? 0} />
        <EngagementPipeline data={stats.engagementPipeline ?? []} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <OutreachBreakdown data={stats.byOutreachStatus} />
        <TopCreators creators={stats.topCreators ?? []} />
      </div>
      <div className="mt-6">
        <RecentPosts posts={stats.recentPosts} />
      </div>
    </>
  );
}
