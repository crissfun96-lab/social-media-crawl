'use client';

import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCompactNumber, getCreatorTier, getOutreachStatusConfig } from '@/lib/constants';

interface TopCreatorEntry {
  readonly name: string;
  readonly follower_count: number;
  readonly likes_count?: number;
  readonly outreach_status: string;
  readonly profile_url: string;
}

interface TopCreatorsProps {
  readonly creators: ReadonlyArray<TopCreatorEntry>;
}

const RANK_DOTS: ReadonlyArray<{ readonly color: string; readonly label: string }> = [
  { color: 'bg-amber-400', label: 'Gold' },
  { color: 'bg-zinc-300', label: 'Silver' },
  { color: 'bg-amber-700', label: 'Bronze' },
];

export function TopCreators({ creators }: TopCreatorsProps) {
  return (
    <Card>
      <CardHeader
        title="Top Creators"
        action={
          <Link
            href="/creators/spreadsheet?sort_by=follower_count&sort_order=desc"
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View all
          </Link>
        }
      />
      {creators.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No creators yet</p>
      ) : (
        <div className="space-y-2">
          {creators.map((creator, index) => {
            const tier = getCreatorTier(creator.follower_count);
            const outreachConfig = getOutreachStatusConfig(creator.outreach_status);
            const rankDot = index < 3 ? RANK_DOTS[index] : null;
            const likesAndSaves = creator.likes_count ?? 0;

            return (
              <div
                key={`${creator.name}-${index}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                {/* Rank */}
                <div className="flex items-center gap-1.5 w-7 flex-shrink-0">
                  {rankDot ? (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${rankDot.color}`}
                      title={rankDot.label}
                    />
                  ) : (
                    <span className="w-2.5 text-center text-xs text-zinc-600">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Creator info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate zh-text">
                      {creator.name}
                    </span>
                    <Badge className={tier.color}>
                      {tier.emoji} {tier.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                    <span>{formatCompactNumber(creator.follower_count)} followers</span>
                    {likesAndSaves > 0 && (
                      <span>{formatCompactNumber(likesAndSaves)} likes</span>
                    )}
                  </div>
                </div>

                {/* Status + link */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={outreachConfig.color}>
                    {outreachConfig.label}
                  </Badge>
                  {creator.profile_url && (
                    <a
                      href={creator.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                    >
                      Open XHS
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
