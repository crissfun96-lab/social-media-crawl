'use client';

import { useFetch } from '@/lib/hooks';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCards, PlatformBreakdown, OutreachBreakdown } from '@/components/dashboard/stats-cards';
import { RecentPosts } from '@/components/dashboard/recent-posts';
import { LoadingPage } from '@/components/ui/spinner';
import type { DashboardStats } from '@/types/database';

export default function DashboardPage() {
  const { data: stats, loading, error } = useFetch<DashboardStats>('/api/stats');

  if (loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load stats: {error}</p>
        <p className="text-sm text-zinc-500 mt-2">Make sure your Supabase credentials are set in .env.local</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Social media creator tracking overview" />
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <PlatformBreakdown data={stats.byPlatform} />
        <OutreachBreakdown data={stats.byOutreachStatus} />
      </div>
      <div className="mt-6">
        <RecentPosts posts={stats.recentPosts} />
      </div>
    </>
  );
}
