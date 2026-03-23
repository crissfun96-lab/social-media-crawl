'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatNumber, getPlatformLabel, getCreatorTier, getBrandConfig, getEngagementStatusConfig } from '@/lib/constants';
import { StatusSelect } from './status-select';
import { CreatorCardList } from './creator-card';
import type { Creator, OutreachStatus, BrandEngagement } from '@/types/database';

export type SortField = 'name' | 'follower_count' | 'outreach_status' | 'location' | 'likes_count' | 'profile_likes_saves' | 'created_at';
export type SortOrder = 'asc' | 'desc';

interface SortHeaderProps {
  readonly label: string;
  readonly field: SortField;
  readonly currentSort: SortField;
  readonly currentOrder: SortOrder;
  readonly onSort: (field: SortField) => void;
  readonly className?: string;
}

function SortHeader({ label, field, currentSort, currentOrder, onSort, className }: SortHeaderProps) {
  const isActive = currentSort === field;
  return (
    <th
      className={`text-left py-3 px-2 font-medium text-zinc-400 cursor-pointer select-none hover:text-zinc-200 transition-colors ${className ?? ''}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`text-xs ${isActive ? 'text-indigo-400' : 'text-zinc-600'}`}>
          {isActive ? (currentOrder === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </div>
    </th>
  );
}

function EngagementBadges({ engagements }: { readonly engagements: readonly BrandEngagement[] }) {
  if (engagements.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {engagements.map(eng => {
        const brandCfg = getBrandConfig(eng.brand);
        const statusCfg = getEngagementStatusConfig(eng.status);
        return (
          <span
            key={eng.id}
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${brandCfg.color}`}
            title={`${brandCfg.label}: ${statusCfg.label}${eng.contact_number ? ` | ${eng.contact_number}` : ''}`}
          >
            {brandCfg.label}
            <span className={`rounded-full px-1 ${statusCfg.color}`}>{statusCfg.label}</span>
          </span>
        );
      })}
    </div>
  );
}

function WhatsAppLink({ contactNumber }: { readonly contactNumber: string | null }) {
  if (!contactNumber) return null;
  const cleaned = contactNumber.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  return (
    <a
      href={`https://wa.me/${cleaned}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[10px] text-green-400 hover:text-green-300 transition-colors"
      title={`WhatsApp ${contactNumber}`}
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      WA
    </a>
  );
}

interface CreatorTableProps {
  readonly creators: readonly Creator[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggleSelect: (id: string) => void;
  readonly onToggleSelectAll: () => void;
  readonly allSelected: boolean;
  readonly onStatusChange?: (id: string, status: OutreachStatus) => Promise<void>;
  readonly sortField: SortField;
  readonly sortOrder: SortOrder;
  readonly onSort: (field: SortField) => void;
  readonly engagementsByCreator?: Map<string, readonly BrandEngagement[]>;
}

export function CreatorTable({
  creators,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onStatusChange,
  sortField,
  sortOrder,
  onSort,
  engagementsByCreator,
}: CreatorTableProps) {
  return (
    <>
      {/* Mobile: card layout + sort dropdown */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs text-zinc-500">Sort:</span>
          <select
            value={sortField}
            onChange={(e) => onSort(e.target.value as SortField)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="created_at">Newest</option>
            <option value="name">Name</option>
            <option value="follower_count">Followers</option>
            <option value="likes_count">Post Likes</option>
            <option value="profile_likes_saves">Profile L+S</option>
            <option value="outreach_status">Status</option>
            <option value="location">Location</option>
          </select>
          <button
            onClick={() => onSort(sortField)}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-1.5 py-1 rounded bg-zinc-800 border border-zinc-700"
          >
            {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
          </button>
        </div>
        <CreatorCardList creators={creators} onStatusChange={onStatusChange} />
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block overflow-x-auto">
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
              <SortHeader label="Creator" field="name" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} />
              <th className="text-left py-3 px-2 font-medium text-zinc-400 hidden sm:table-cell">Platform</th>
              <SortHeader label="Followers" field="follower_count" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} className="text-right hidden md:table-cell" />
              <SortHeader label="Post Likes" field="likes_count" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} className="text-right hidden md:table-cell" />
              <SortHeader label="Profile L+S" field="profile_likes_saves" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} className="text-right hidden lg:table-cell" />
              <SortHeader label="Location" field="location" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} className="hidden lg:table-cell" />
              <SortHeader label="Status" field="outreach_status" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} />
              <th className="text-left py-3 px-2 font-medium text-zinc-400 hidden lg:table-cell">Brands</th>
              <th className="text-left py-3 px-2 font-medium text-zinc-400 hidden lg:table-cell">Tags</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => {
              const ext = creator as Creator & { readonly likes_count?: number; readonly profile_likes_saves?: number };
              const likesCount = ext.likes_count;
              const profileLS = ext.profile_likes_saves;
              const creatorEngagements = engagementsByCreator?.get(creator.id) ?? [];
              const latestEngagement = creatorEngagements.length > 0 ? creatorEngagements[0] : null;
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
                    <div className="relative group/tooltip">
                      <Link href={`/creators/${creator.id}`} className="group">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors zh-text">
                            {creator.name}
                          </span>
                          {creator.follower_count != null && creator.follower_count > 0 && (
                            <span className={`${getCreatorTier(creator.follower_count).color} text-[9px] px-1 py-0 rounded`}>
                              {getCreatorTier(creator.follower_count).emoji}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">@{creator.username}</div>
                      </Link>
                      {/* Contact: WhatsApp link */}
                      {latestEngagement?.contact_number && (
                        <div className="mt-0.5">
                          <WhatsAppLink contactNumber={latestEngagement.contact_number} />
                        </div>
                      )}
                      {/* Hover tooltip with creator details */}
                      <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/tooltip:block w-80 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl text-sm">
                        <div className="font-semibold text-zinc-100 mb-2">{creator.name}</div>
                        {creator.outreach_notes && (
                          <div className="text-zinc-300 mb-2 text-xs">{creator.outreach_notes}</div>
                        )}
                        <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                          {creator.follower_count != null && (
                            <div><span className="text-zinc-500">Followers:</span> <span className="text-zinc-300">{formatNumber(creator.follower_count)}</span></div>
                          )}
                          {likesCount != null && (
                            <div><span className="text-zinc-500">Likes:</span> <span className="text-zinc-300">{formatNumber(likesCount)}</span></div>
                          )}
                          {creator.location && (
                            <div><span className="text-zinc-500">Location:</span> <span className="text-zinc-300">{creator.location}</span></div>
                          )}
                          {creator.content_type && (
                            <div><span className="text-zinc-500">Type:</span> <span className="text-zinc-300">{creator.content_type}</span></div>
                          )}
                        </div>
                        {creator.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {creator.tags.map((tag) => (
                              <span key={tag} className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-xs">{tag}</span>
                            ))}
                          </div>
                        )}
                        {creator.profile_url && (
                          <a href={creator.profile_url} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1">
                            View XHS Profile →
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell">
                    <Badge className="bg-zinc-800 text-zinc-300">{getPlatformLabel(creator.platform)}</Badge>
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300 hidden md:table-cell">
                    {formatNumber(creator.follower_count)}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300 hidden md:table-cell">
                    {likesCount != null && likesCount > 0 ? formatNumber(likesCount) : '-'}
                  </td>
                  <td className="py-3 px-2 text-right text-zinc-300 hidden lg:table-cell">
                    {profileLS != null && profileLS > 0 ? formatNumber(profileLS) : '-'}
                  </td>
                  <td className="py-3 px-2 text-zinc-400 hidden lg:table-cell">
                    {creator.location ?? '-'}
                  </td>
                  <td className="py-3 px-2">
                    <StatusSelect
                      creatorId={creator.id}
                      currentStatus={creator.outreach_status}
                      onStatusChange={onStatusChange}
                      compact
                    />
                  </td>
                  <td className="py-3 px-2 hidden lg:table-cell">
                    <EngagementBadges engagements={creatorEngagements} />
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
    </>
  );
}
