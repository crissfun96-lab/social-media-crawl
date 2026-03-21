'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatNumber, getPlatformLabel } from '@/lib/constants';
import { StatusSelect } from './status-select';
import type { Creator, OutreachStatus } from '@/types/database';

interface CreatorCardProps {
  readonly creator: Creator;
  readonly onStatusChange?: (id: string, status: OutreachStatus) => Promise<void>;
}

export function CreatorCard({ creator, onStatusChange }: CreatorCardProps) {
  const xhsPostUrl = creator.profile_url;
  const likesCount = (creator as Creator & { readonly likes_count?: number }).likes_count;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
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
        {likesCount != null && likesCount > 0 && (
          <div className="flex items-center gap-1 text-zinc-400">
            <svg className="h-4 w-4 text-red-500/70" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span className="font-medium text-zinc-300">{formatNumber(likesCount)}</span>
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
        {/* Status dropdown with confirm */}
        <div className="flex-1">
          <StatusSelect
            creatorId={creator.id}
            currentStatus={creator.outreach_status}
            onStatusChange={onStatusChange}
          />
        </div>

        {/* Open XHS post */}
        {xhsPostUrl && (
          <a
            href={xhsPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors min-h-[44px] min-w-[44px]"
            title="Open XHS profile"
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
