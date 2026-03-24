'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { PageHeader } from '@/components/layout/page-header';
import { CreatorFilters } from '@/components/creators/creator-filters';
import { CreatorTable, type SortField, type SortOrder, type BrandEngagementMap } from '@/components/creators/creator-table';
import { BulkActions } from '@/components/creators/bulk-actions';
import { CsvExport } from '@/components/creators/csv-export';
import { Pagination } from '@/components/creators/pagination';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useDebounce, useFetch } from '@/lib/hooks';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Creator, OutreachStatus, Brand, EngagementStatus, BrandEngagement } from '@/types/database';

export default function CreatorsPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [outreachStatus, setOutreachStatus] = useState('');
  const [hasPostedAboutUs, setHasPostedAboutUs] = useState('');
  const [location, setLocation] = useState('');
  const [brand, setBrand] = useState('');
  const [pic, setPic] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [engagementVersion, setEngagementVersion] = useState(0);
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
  if (source) queryParams.set('source', source);
  queryParams.set('sort_by', sortField);
  queryParams.set('sort_order', sortOrder);

  // Always fetch all engagements (needed for brand status columns, PIC, source)
  const engagementUrl = `/api/engagements?per_page=2000&_v=${engagementVersion}`;
  const { data: allEngagementsRaw, refetch: refetchEngagements } = useFetch<readonly BrandEngagement[]>(engagementUrl);

  // Build brand engagement map: creator_id -> { songhwa?: BrandEngagement, byondwalls?: BrandEngagement }
  const engagementsByCreator = new Map<string, BrandEngagementMap>();
  const allEngagementsByCreator = new Map<string, readonly BrandEngagement[]>();

  if (allEngagementsRaw) {
    const tempAll = new Map<string, BrandEngagement[]>();
    for (const eng of allEngagementsRaw) {
      // Build brand map
      const existing = engagementsByCreator.get(eng.creator_id) ?? {};
      if (eng.brand === 'songhwa' || eng.brand === 'byondwalls') {
        const updated = { ...existing, [eng.brand]: eng };
        engagementsByCreator.set(eng.creator_id, updated);
      }
      // Build flat list map
      const list = tempAll.get(eng.creator_id) ?? [];
      tempAll.set(eng.creator_id, [...list, eng]);
    }
    for (const [cid, list] of tempAll) {
      allEngagementsByCreator.set(cid, list);
    }
  }

  // PIC filter: find creator IDs where any engagement has matching pic
  const picFilteredCreatorIds = pic
    ? new Set(
        (allEngagementsRaw ?? [])
          .filter((e) => e.pic === pic)
          .map((e) => e.creator_id),
      )
    : null;

  // Brand filter: find creator IDs where engagement matches brand
  const brandFilteredCreatorIds = brand
    ? new Set(
        (allEngagementsRaw ?? [])
          .filter((e) => e.brand === brand)
          .map((e) => e.creator_id),
      )
    : null;

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

  const handleBrandStatusChange = useCallback(async (
    creatorId: string,
    brandName: Brand,
    status: EngagementStatus,
    engagementId: string | null,
  ) => {
    if (engagementId) {
      // Update existing engagement
      const res = await fetch(`/api/engagements/${engagementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(`Failed to update status: ${json.error}`);
        return;
      }
    } else {
      // Create new engagement
      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creatorId,
          brand: brandName,
          status,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(`Failed to create engagement: ${json.error}`);
        return;
      }
    }
    // Refresh engagements
    setEngagementVersion((v) => v + 1);
  }, []);

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
        const importCreators = rows
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

        if (importCreators.length === 0) {
          alert('No valid rows found in CSV');
          return;
        }

        const res = await fetch('/api/import/creators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importCreators),
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

  // Apply client-side filters for PIC, Brand, and Source (from engagements + tags)
  const getFilteredCreators = (): readonly Creator[] => {
    if (!creators) return [];
    let items = creators.items;
    if (picFilteredCreatorIds) {
      items = items.filter((c) => picFilteredCreatorIds.has(c.id));
    }
    if (brandFilteredCreatorIds) {
      items = items.filter((c) => brandFilteredCreatorIds.has(c.id));
    }
    // Source filter is now server-side (via API query param)
    // PIC sub-filter for liz/amber within google-sheet source
    if (source === 'liz' || source === 'amber') {
      items = items.filter((c) => {
        const engs = allEngagementsByCreator.get(c.id) ?? [];
        return engs.some(e => e.pic === source);
      });
    }
    return items;
  };

  const filteredCreators = getFilteredCreators();

  if (creatorsLoading && !creators) return <LoadingPage />;

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
            <Link href="/creators/spreadsheet">
              <Button variant="secondary" size="sm">Spreadsheet</Button>
            </Link>
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
        brand={brand}
        onBrandChange={(v) => { setBrand(v); setPage(1); }}
        pic={pic}
        onPicChange={(v) => { setPic(v); setPage(1); }}
        source={source}
        onSourceChange={(v) => { setSource(v); setPage(1); }}
      />

      <BulkActions
        selectedCount={selectedIds.size}
        onChangeStatus={handleBulkStatusChange}
        onAddTags={handleBulkAddTags}
      />

      {filteredCreators.length > 0 ? (
        <>
          <CreatorTable
            creators={filteredCreators}
            selectedIds={selectedIds}
            engagementsByCreator={engagementsByCreator}
            allEngagements={allEngagementsByCreator}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            allSelected={filteredCreators.length > 0 && selectedIds.size === filteredCreators.length}
            onBrandStatusChange={handleBrandStatusChange}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <Pagination
            page={creators?.page ?? 1}
            perPage={creators?.perPage ?? DEFAULT_PAGE_SIZE}
            total={creators?.total ?? 0}
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
