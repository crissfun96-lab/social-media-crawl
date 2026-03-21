'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatNumber, getPlatformLabel, getOutreachStatusConfig } from '@/lib/constants';
import type { Creator } from '@/types/database';

interface CreatorTableProps {
  readonly creators: readonly Creator[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggleSelect: (id: string) => void;
  readonly onToggleSelectAll: () => void;
  readonly allSelected: boolean;
}

export function CreatorTable({
  creators,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
}: CreatorTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-2 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
              />
            </th>
            <th className="text-left py-3 px-2 font-medium text-zinc-400">Creator</th>
            <th className="text-left py-3 px-2 font-medium text-zinc-400 hidden sm:table-cell">Platform</th>
            <th className="text-right py-3 px-2 font-medium text-zinc-400 hidden md:table-cell">Followers</th>
            <th className="text-left py-3 px-2 font-medium text-zinc-400 hidden lg:table-cell">Location</th>
            <th className="text-left py-3 px-2 font-medium text-zinc-400">Status</th>
            <th className="text-left py-3 px-2 font-medium text-zinc-400 hidden lg:table-cell">Tags</th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creator) => {
            const statusConfig = getOutreachStatusConfig(creator.outreach_status);
            return (
              <tr key={creator.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 px-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(creator.id)}
                    onChange={() => onToggleSelect(creator.id)}
                    className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-3 px-2">
                  <Link href={`/creators/${creator.id}`} className="group">
                    <div className="font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors">
                      {creator.name}
                    </div>
                    <div className="text-xs text-zinc-500">@{creator.username}</div>
                  </Link>
                </td>
                <td className="py-3 px-2 hidden sm:table-cell">
                  <Badge className="bg-zinc-800 text-zinc-300">{getPlatformLabel(creator.platform)}</Badge>
                </td>
                <td className="py-3 px-2 text-right text-zinc-300 hidden md:table-cell">
                  {formatNumber(creator.follower_count)}
                </td>
                <td className="py-3 px-2 text-zinc-400 hidden lg:table-cell">
                  {creator.location ?? '-'}
                </td>
                <td className="py-3 px-2">
                  <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                </td>
                <td className="py-3 px-2 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {creator.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} className="bg-zinc-800 text-zinc-400">{tag}</Badge>
                    ))}
                    {creator.tags.length > 3 && (
                      <Badge className="bg-zinc-800 text-zinc-500">+{creator.tags.length - 3}</Badge>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
