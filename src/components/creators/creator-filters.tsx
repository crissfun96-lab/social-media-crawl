'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PLATFORM_OPTIONS, OUTREACH_STATUS_OPTIONS } from '@/lib/constants';

interface CreatorFiltersProps {
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly platform: string;
  readonly onPlatformChange: (value: string) => void;
  readonly outreachStatus: string;
  readonly onOutreachStatusChange: (value: string) => void;
  readonly hasPostedAboutUs: string;
  readonly onHasPostedChange: (value: string) => void;
  readonly location: string;
  readonly onLocationChange: (value: string) => void;
}

export function CreatorFilters({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  outreachStatus,
  onOutreachStatusChange,
  hasPostedAboutUs,
  onHasPostedChange,
  location,
  onLocationChange,
}: CreatorFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [platform, outreachStatus, hasPostedAboutUs, location].filter(Boolean).length;

  const filterGrid = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Select
        options={PLATFORM_OPTIONS.map(p => ({ value: p.value, label: p.label }))}
        placeholder="All Platforms"
        value={platform}
        onChange={(e) => onPlatformChange(e.target.value)}
      />
      <Select
        options={OUTREACH_STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
        placeholder="All Statuses"
        value={outreachStatus}
        onChange={(e) => onOutreachStatusChange(e.target.value)}
      />
      <Select
        options={[
          { value: 'true', label: 'Posted About Us' },
          { value: 'false', label: 'Not Posted' },
        ]}
        placeholder="All"
        value={hasPostedAboutUs}
        onChange={(e) => onHasPostedChange(e.target.value)}
      />
      <Input
        placeholder="Location (e.g. KL)"
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Search + filter toggle row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {/* Filter toggle — mobile only */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
            bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[44px] flex-shrink-0 border border-zinc-700"
          aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: always show filter grid */}
      <div className="hidden md:block">{filterGrid}</div>

      {/* Mobile: show filter grid when toggled */}
      {filtersOpen && <div className="md:hidden">{filterGrid}</div>}
    </div>
  );
}
