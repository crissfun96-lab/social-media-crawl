'use client';

import { useState, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LoadingPage } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/creators/pagination';
import { Button } from '@/components/ui/button';
import { formatNumber, getPlatformLabel, PLATFORM_OPTIONS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { PostWithCreator } from '@/types/database';

export default function PostsPage() {
  const [platform, setPlatform] = useState('');
  const [isAboutBw, setIsAboutBw] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('per_page', String(DEFAULT_PAGE_SIZE));
  queryParams.set('sort_by', sortBy);
  queryParams.set('sort_order', 'desc');
  if (platform) queryParams.set('platform', platform);
  if (isAboutBw) queryParams.set('is_about_byondwalls', isAboutBw);
  if (dateFrom) queryParams.set('date_from', dateFrom);
  if (dateTo) queryParams.set('date_to', dateTo);

  const { data: postsData, loading, error } = usePostsFetch(`/api/posts?${queryParams.toString()}`);

  if (loading) return <LoadingPage />;

  if (error) {
    // Likely empty collection — show empty state instead of error
    return (
      <>
        <PageHeader title="Posts" subtitle="Track XHS posts about Byondwalls" />
        <EmptyState
          title="No posts tracked yet"
          description="This page tracks XHS posts about Byondwalls. Posts will appear here as KOCs start reviewing Byondwalls and you import their posts."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Posts"
        subtitle={`${postsData?.total ?? 0} tracked posts`}
      />

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Select
          options={PLATFORM_OPTIONS.map(p => ({ value: p.value, label: p.label }))}
          placeholder="All Platforms"
          value={platform}
          onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: 'true', label: 'About Byond Walls' },
            { value: 'false', label: 'Not About Us' },
          ]}
          placeholder="All Posts"
          value={isAboutBw}
          onChange={(e) => { setIsAboutBw(e.target.value); setPage(1); }}
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          placeholder="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          placeholder="To date"
        />
        <Select
          options={[
            { value: 'created_at', label: 'Newest' },
            { value: 'likes', label: 'Most Likes' },
            { value: 'saves', label: 'Most Saves' },
            { value: 'views', label: 'Most Views' },
            { value: 'comments', label: 'Most Comments' },
          ]}
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
        />
      </div>

      {postsData && postsData.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postsData.items.map((post) => (
              <Card key={post.id} className="hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-zinc-800 text-zinc-300">
                        {getPlatformLabel(post.platform)}
                      </Badge>
                      {post.is_about_byondwalls && (
                        <Badge className="bg-indigo-900 text-indigo-300">About Us</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-zinc-200 zh-text">
                      {post.title ?? 'Untitled Post'}
                    </h3>
                    {post.content && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-3 zh-text">{post.content}</p>
                    )}
                    {post.creators && (
                      <p className="text-xs text-zinc-400 mt-2">
                        by {post.creators.name} (@{post.creators.username})
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <StatMini label="Likes" value={post.likes} />
                      <StatMini label="Comments" value={post.comments} />
                      <StatMini label="Saves" value={post.saves} />
                      <StatMini label="Views" value={post.views} />
                    </div>
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.hashtags.slice(0, 5).map((tag) => (
                          <span key={tag} className="text-xs text-indigo-400">#{tag}</span>
                        ))}
                        {post.hashtags.length > 5 && (
                          <span className="text-xs text-zinc-500">+{post.hashtags.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button variant="ghost" size="sm">View</Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
          <Pagination
            page={postsData.page}
            perPage={postsData.perPage}
            total={postsData.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No posts found"
          description="Import posts or adjust your filters."
        />
      )}
    </>
  );
}

function StatMini({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold text-zinc-200">{formatNumber(value)}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

function usePostsFetch(url: string) {
  const [state, setState] = useState<{
    data: { items: PostWithCreator[]; total: number; page: number; perPage: number } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  const urlRef = useRef(url);
  urlRef.current = url;

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(urlRef.current);
      const json = await res.json();
      if (!json.success) {
        setState({ data: null, loading: false, error: json.error ?? 'Unknown error' });
      } else {
        setState({
          data: {
            items: json.data,
            total: json.meta?.total ?? 0,
            page: json.meta?.page ?? 1,
            perPage: json.meta?.per_page ?? DEFAULT_PAGE_SIZE,
          },
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Fetch failed' });
    }
  }, []);

  const prevUrl = useRef('');
  if (url !== prevUrl.current) {
    prevUrl.current = url;
    refetch();
  }

  return { ...state, refetch };
}
