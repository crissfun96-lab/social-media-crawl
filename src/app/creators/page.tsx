'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { PageHeader } from '@/components/layout/page-header';
import { CreatorFilters } from '@/components/creators/creator-filters';
import { CreatorTable, type SortField, type SortOrder } from '@/components/creators/creator-table';
import { BulkActions } from '@/components/creators/bulk-actions';
import { CsvExport } from '@/components/creators/csv-export';
import { Pagination } from '@/components/creators/pagination';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useDebounce } from '@/lib/hooks';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Creator, OutreachStatus } from '@/types/database';

export default function CreatorsPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [outreachStatus, setOutreachStatus] = useState('');
  const [hasPostedAboutUs, setHasPostedAboutUs] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedLocation = useDebounce(location, 300);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('per_page', String(DEFAULT_PAGE_SIZE));
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (platform) queryParams.set('platform', platform);
  if (outreachStatus) queryParams.set('outreach_status', outreachStatus);
  if (hasPostedAboutUs) queryParams.set('has_posted_about_us', hasPostedAboutUs);
  if (debouncedLocation) queryParams.set('location', debouncedLocation);
  queryParams.set('sort_by', sortField);
  queryParams.set('sort_order', sortOrder);

  const { data: creators, loading: creatorsLoading, error: creatorsError, refetch: creatorsRefetch } = useCustomCreatorsFetch(
    `/api/creators?${queryParams.toString()}`
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (!creators) return;
    setSelectedIds(prev => {
      if (prev.size === creators.items.length) return new Set();
      return new Set(creators.items.map(c => c.id));
    });
  }, [creators]);

  const handleBulkStatusChange = useCallback(async (status: string) => {
    const promises = Array.from(selectedIds).map(id =>
      fetch(`/api/creators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outreach_status: status }),
      })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    creatorsRefetch();
  }, [selectedIds, creatorsRefetch]);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  }, [sortField]);

  const handleSingleStatusChange = useCallback(async (id: string, status: OutreachStatus) => {
    await fetch(`/api/creators/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outreach_status: status }),
    });
    creatorsRefetch();
  }, [creatorsRefetch]);

  const handleBulkAddTags = useCallback(async (tags: string[]) => {
    if (!creators) return;
    const promises = Array.from(selectedIds).map(id => {
      const creator = creators.items.find(c => c.id === id);
      if (!creator) return Promise.resolve();
      const existingTags = [...creator.tags];
      const mergedTags = [...new Set([...existingTags, ...tags])];
      return fetch(`/api/creators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: mergedTags }),
      });
    });
    await Promise.all(promises);
    setSelectedIds(new Set());
    creatorsRefetch();
  }, [selectedIds, creators, creatorsRefetch]);

  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        const creators = rows
          .filter(row => row.name && row.platform && row.platform_id)
          .map(row => ({
            platform: row.platform || 'xhs',
            platform_id: row.platform_id || '',
            name: row.name || '',
            username: row.username || '',
            profile_url: row.profile_url || `https://example.com/${row.username || ''}`,
            follower_count: row.follower_count ? parseInt(row.follower_count, 10) : null,
            following_count: row.following_count ? parseInt(row.following_count, 10) : null,
            post_count: row.post_count ? parseInt(row.post_count, 10) : null,
            bio: row.bio || null,
            location: row.location || null,
            content_type: row.content_type || null,
            has_posted_about_us: row.has_posted_about_us === 'true',
            outreach_status: row.outreach_status || 'not_contacted',
            outreach_notes: row.outreach_notes || null,
            contact_info: row.contact_info || null,
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          }));

        if (creators.length === 0) {
          alert('No valid rows found in CSV');
          return;
        }

        const res = await fetch('/api/import/creators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creators),
        });

        const json = await res.json();
        if (json.success) {
          alert(`Imported ${json.data.imported} of ${json.data.total} creators`);
          creatorsRefetch();
        } else {
          alert(`Import failed: ${json.error}`);
        }
      },
      error: (err) => {
        alert(`CSV parse error: ${err.message}`);
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [creatorsRefetch]);

  if (creatorsLoading) return <LoadingPage />;

  if (creatorsError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load creators: {creatorsError}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Creators"
        subtitle={`${creators?.total ?? 0} total creators`}
        action={
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvImport}
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Import CSV
            </Button>
            <CsvExport creators={creators?.items ?? []} />
            <Link href="/import">
              <Button size="sm">+ Add Creators</Button>
            </Link>
          </div>
        }
      />

      <CreatorFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        platform={platform}
        onPlatformChange={(v) => { setPlatform(v); setPage(1); }}
        outreachStatus={outreachStatus}
        onOutreachStatusChange={(v) => { setOutreachStatus(v); setPage(1); }}
        hasPostedAboutUs={hasPostedAboutUs}
        onHasPostedChange={(v) => { setHasPostedAboutUs(v); setPage(1); }}
        location={location}
        onLocationChange={(v) => { setLocation(v); setPage(1); }}
      />

      <BulkActions
        selectedCount={selectedIds.size}
        onChangeStatus={handleBulkStatusChange}
        onAddTags={handleBulkAddTags}
      />

      {creators && creators.items.length > 0 ? (
        <>
          <CreatorTable
            creators={creators.items}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allSelected={creators.items.length > 0 && selectedIds.size === creators.items.length}
            onStatusChange={handleSingleStatusChange}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <Pagination
            page={creators.page}
            perPage={creators.perPage}
            total={creators.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No creators found"
          description="Import creators via CSV or add them through the import page."
          action={
            <Link href="/import">
              <Button>Import Creators</Button>
            </Link>
          }
        />
      )}
    </>
  );
}

// Custom hook that also parses meta from the envelope
function useCustomCreatorsFetch(url: string) {
  const [state, setState] = useState<{
    data: { items: Creator[]; total: number; page: number; perPage: number } | null;
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

  // Refetch when URL changes
  const prevUrl = useRef('');
  if (url !== prevUrl.current) {
    prevUrl.current = url;
    refetch();
  }

  return { ...state, refetch };
}
