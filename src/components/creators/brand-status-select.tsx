'use client';

import { useState, useCallback } from 'react';
import { ENGAGEMENT_STATUS_OPTIONS, getEngagementStatusConfig } from '@/lib/constants';
import type { EngagementStatus, Brand, BrandEngagement } from '@/types/database';

interface BrandStatusSelectProps {
  readonly creatorId: string;
  readonly brand: Brand;
  readonly engagement: BrandEngagement | undefined;
  readonly onStatusChange: (
    creatorId: string,
    brand: Brand,
    status: EngagementStatus,
    engagementId: string | null,
  ) => Promise<void>;
}

export function BrandStatusSelect({
  creatorId,
  brand,
  engagement,
  onStatusChange,
}: BrandStatusSelectProps) {
  const [isSaving, setIsSaving] = useState(false);
  const currentStatus = engagement?.status ?? null;
  const statusConfig = currentStatus
    ? getEngagementStatusConfig(currentStatus)
    : null;

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.stopPropagation();
      const newStatus = e.target.value as EngagementStatus;
      if (newStatus === currentStatus) return;
      setIsSaving(true);
      try {
        await onStatusChange(
          creatorId,
          brand,
          newStatus,
          engagement?.id ?? null,
        );
      } finally {
        setIsSaving(false);
      }
    },
    [creatorId, brand, currentStatus, engagement?.id, onStatusChange],
  );

  return (
    <div
      className="relative inline-flex items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={currentStatus ?? ''}
        onChange={handleChange}
        disabled={isSaving}
        className={`appearance-none cursor-pointer rounded text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-500 px-2 py-1
          ${statusConfig ? statusConfig.color : 'bg-zinc-800 text-zinc-500'} bg-opacity-80
          ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 4px center',
          backgroundSize: '16px',
          paddingRight: '24px',
        }}
      >
        <option value="">--</option>
        {ENGAGEMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isSaving && (
        <span className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-indigo-400" />
      )}
    </div>
  );
}
