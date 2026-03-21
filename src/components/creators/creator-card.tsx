'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatNumber, getPlatformLabel, getOutreachStatusConfig, OUTREACH_STATUS_OPTIONS } from '@/lib/constants';
import type { Creator, OutreachStatus } from '@/types/database';

const STATUS_ORDER: readonly OutreachStatus[] = [
  'not_contacted',
  'contacted',
  'responded',
  'agreed',
  'posted',
  'declined',
];

interface CreatorCardProps {
  readonly creator: Creator;
  readonly onStatusChange?: (id: string, status: OutreachStatus) => Promise<void>;
}

export function CreatorCard({ creator, onStatusChange }: CreatorCardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const statusConfig = getOutreachStatusConfig(creator.outreach_status);

  const handleStatusCycle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onStatusChange || isChangingStatus) return;

    const currentIndex = STATUS_ORDER.indexOf(creator.outreach_status as OutreachStatus);
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];

    setIsChangingStatus(true);
    try {
      await onStatusChange(creator.id, nextStatus);
    } finally {
      setIsChangingStatus(false);
    }
  }, [creator.id, creator.outreach_status, onStatusChange, isChangingStatus]);

  const xhsPostUrl = creator.profile_url;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 active:scale-[0.98] transition-transform">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/creators/${creator.id}`} className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-100 truncate">{creator.name}</div>
          <div className="text-xs text-zinc-500 truncate">@{creator.username}</div>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-zinc-800 text-zinc-300 text-xs">{getPlatformLabel(creator.platform)}</Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        {creator.follower_count != null && (
          <div className="flex items-center gap-1 text-zinc-400">
            <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="font-medium text-zinc-300">{formatNumber(creator.follower_count)}</span>
          </div>
        )}
        {creator.location && (
          <div className="flex items-center gap-1 text-zinc-500 text-xs">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {creator.location}
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        {/* One-tap status change */}
        <button
          onClick={handleStatusCycle}
          disabled={isChangingStatus || !onStatusChange}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            transition-all min-h-[44px] border
            ${isChangingStatus ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}
            ${statusConfig.color} border-current/20`}
          title="Tap to advance status"
        >
          <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
          {isChangingStatus ? 'Updating…' : statusConfig.label}
          {onStatusChange && !isChangingStatus && (
            <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>

        {/* Open XHS post */}
        {xhsPostUrl && (
          <a
            href={xhsPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors min-h-[44px] min-w-[44px]"
            title="Open XHS profile"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

interface CreatorCardListProps {
  readonly creators: readonly Creator[];
  readonly onStatusChange?: (id: string, status: OutreachStatus) => Promise<void>;
}

export function CreatorCardList({ creators, onStatusChange }: CreatorCardListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {creators.map((creator) => (
        <CreatorCard key={creator.id} creator={creator} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}
