'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { StatusSelect } from '@/components/creators/status-select';
import { LoadingPage } from '@/components/ui/spinner';
import { formatNumber, OUTREACH_STATUS_OPTIONS, PLATFORM_OPTIONS, getCreatorTier } from '@/lib/constants';
import type { Creator, OutreachStatus } from '@/types/database';

const PAGE_SIZE = 50;

export default function SpreadsheetPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('likes_count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('per_page', String(PAGE_SIZE));
  queryParams.set('sort_by', sortBy);
  queryParams.set('sort_order', sortOrder);
  if (statusFilter) queryParams.set('outreach_status', statusFilter);

  const { data, loading, error, refetch } = useCreatorsFetch(`/api/creators?${queryParams.toString()}`);

  const handleStatusChange = useCallback(async (id: string, status: OutreachStatus) => {
    await fetch(`/api/creators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outreach_status: status }),
    });
    refetch();
  }, [refetch]);

  const handleSort = useCallback((field: string) => {
    if (field === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }, [sortBy]);

  if (loading) return <LoadingPage />;

  if (error) {
    return <div className="p-8 text-center"><p className="text-red-400">Failed to load: {error}</p></div>;
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <>
      <PageHeader
        title="Spreadsheet View"
        subtitle={`${data?.total ?? 0} creators — click links to DM`}
        action={
          <Link href="/creators" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← Back to Cards
          </Link>
        }
      />

      {/* Quick filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {OUTREACH_STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          Page {page}/{totalPages} · Showing {PAGE_SIZE}/page
        </span>
      </div>

      {/* Spreadsheet table */}
      <div className="overflow-x-auto border border-zinc-800 rounded-lg">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-zinc-900 sticky top-0 z-10">
            <tr className="border-b border-zinc-700">
              <SortTh label="#" field="" sortBy="" sortOrder="desc" onSort={() => {}} className="w-10 text-center" />
              <SortTh label="Creator" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <th className="py-2 px-2 text-left font-medium text-zinc-400">XHS Link</th>
              <SortTh label="Followers" field="follower_count" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right" />
              <SortTh label="Likes" field="likes_count" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right" />
              <th className="py-2 px-2 text-left font-medium text-zinc-400">Location</th>
              <th className="py-2 px-2 text-left font-medium text-zinc-400">Tags</th>
              <th className="py-2 px-2 text-left font-medium text-zinc-400 min-w-[140px]">Status</th>
              <th className="py-2 px-2 text-left font-medium text-zinc-400">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {data?.items.map((creator, i) => {
              const likesCount = (creator as Creator & { likes_count?: number }).likes_count;
              return (
                <tr key={creator.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-1.5 px-2 text-center text-zinc-600">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/creators/${creator.id}`} className="text-zinc-200 hover:text-indigo-400 font-medium zh-text">
                        {creator.name}
                      </Link>
                      {creator.follower_count != null && creator.follower_count > 0 && (
                        <span className={`${getCreatorTier(creator.follower_count).color} text-[9px] px-1 py-0 rounded`}>
                          {getCreatorTier(creator.follower_count).emoji}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-600">@{creator.username}</div>
                  </td>
                  <td className="py-1.5 px-2">
                    {creator.profile_url ? (
                      <a
                        href={creator.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Open Profile
                      </a>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right text-zinc-300 font-mono">
                    {formatNumber(creator.follower_count)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-zinc-300 font-mono">
                    {likesCount != null ? formatNumber(likesCount) : '—'}
                  </td>
                  <td className="py-1.5 px-2 text-zinc-400 max-w-[120px] truncate">
                    {creator.location ?? '—'}
                  </td>
                  <td className="py-1.5 px-2 text-zinc-500 max-w-[150px] truncate">
                    {creator.tags.slice(0, 2).join(', ')}
                    {creator.tags.length > 2 ? ` +${creator.tags.length - 2}` : ''}
                  </td>
                  <td className="py-1.5 px-2">
                    <StatusSelect
                      creatorId={creator.id}
                      currentStatus={creator.outreach_status}
                      onStatusChange={handleStatusChange}
                      compact
                    />
                  </td>
                  <td className="py-1.5 px-2 text-zinc-500 max-w-[200px] truncate">
                    {creator.outreach_notes ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page + i - 2;
            if (p < 1 || p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 text-sm rounded ${p === page ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

function SortTh({ label, field, sortBy, sortOrder, onSort, className }: {
  readonly label: string;
  readonly field: string;
  readonly sortBy: string;
  readonly sortOrder: string;
  readonly onSort: (f: string) => void;
  readonly className?: string;
}) {
  if (!field) return <th className={`py-2 px-2 font-medium text-zinc-400 ${className ?? ''}`}>{label}</th>;
  const active = sortBy === field;
  return (
    <th
      className={`py-2 px-2 font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 select-none ${className ?? ''}`}
      onClick={() => onSort(field)}
    >
      {label} <span className={`text-[10px] ${active ? 'text-indigo-400' : 'text-zinc-600'}`}>{active ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}</span>
    </th>
  );
}

function useCreatorsFetch(url: string) {
  const [state, setState] = useState<{
    data: { items: Creator[]; total: number } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  const urlRef = useRef(url);
  urlRef.current = url;

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(urlRef.current);
      const json = await res.json();
      if (!json.success) {
        setState({ data: null, loading: false, error: json.error ?? 'Unknown error' });
      } else {
        setState({ data: { items: json.data, total: json.meta?.total ?? 0 }, loading: false, error: null });
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
