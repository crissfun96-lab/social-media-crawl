'use client';

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
  return (
    <div className="flex flex-col gap-3 mb-4">
      <Input
        placeholder="Search by name or username..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
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
    </div>
  );
}
