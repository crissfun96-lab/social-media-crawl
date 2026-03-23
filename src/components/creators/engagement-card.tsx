'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  getBrandConfig,
  getEngagementStatusConfig,
  formatCurrency,
  formatNumber,
  ENGAGEMENT_STATUS_OPTIONS,
  BRAND_OPTIONS,
} from '@/lib/constants';
import type { BrandEngagement, EngagementStatus, Brand } from '@/types/database';

interface EngagementCardProps {
  readonly engagement: BrandEngagement & { readonly creator_name?: string };
  readonly onStatusChange: (id: string, status: EngagementStatus) => Promise<void>;
  readonly onShareToBrand: (engagement: BrandEngagement, targetBrand: Brand) => Promise<void>;
}

export function EngagementCard({ engagement, onStatusChange, onShareToBrand }: EngagementCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const brandConfig = getBrandConfig(engagement.brand);
  const statusConfig = getEngagementStatusConfig(engagement.status);

  const handleStatusChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as EngagementStatus;
    if (newStatus === engagement.status) return;
    setIsUpdating(true);
    try {
      await onStatusChange(engagement.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  }, [engagement.id, engagement.status, onStatusChange]);

  const handleShare = useCallback(async (targetBrand: Brand) => {
    setShowShareMenu(false);
    await onShareToBrand(engagement, targetBrand);
  }, [engagement, onShareToBrand]);

  const whatsappUrl = engagement.contact_number
    ? `https://wa.me/${engagement.contact_number.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors">
      {/* Header: brand + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className={brandConfig.color}>{brandConfig.label}</Badge>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
        {engagement.pic && (
          <span className="text-xs text-zinc-500">PIC: {engagement.pic}</span>
        )}
      </div>

      {/* Financial details */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-zinc-500 text-xs">Rate</div>
          <div className="text-zinc-200 font-medium">{formatCurrency(engagement.rate_rm)}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">Payout</div>
          <div className="text-zinc-200 font-medium">{formatCurrency(engagement.payout_rm)}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs">Food Credit</div>
          <div className="text-zinc-200 font-medium">{formatCurrency(engagement.food_credit_rm)}</div>
        </div>
      </div>

      {/* Metrics */}
      {(engagement.posted_link || engagement.likes != null || engagement.collects != null) && (
        <div className="flex items-center gap-4 text-sm">
          {engagement.likes != null && (
            <div className="flex items-center gap-1 text-zinc-400">
              <svg className="h-4 w-4 text-red-500/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              <span className="font-medium text-zinc-300">{formatNumber(engagement.likes)}</span>
            </div>
          )}
          {engagement.collects != null && (
            <div className="flex items-center gap-1 text-zinc-400">
              <svg className="h-4 w-4 text-amber-500/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              <span className="font-medium text-zinc-300">{formatNumber(engagement.collects)}</span>
            </div>
          )}
          {engagement.posted_link && (
            <a
              href={engagement.posted_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View Post
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1">
          <Select
            options={ENGAGEMENT_STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
            value={engagement.status}
            onChange={handleStatusChange}
            disabled={isUpdating}
          />
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium
              bg-green-900 text-green-300 hover:bg-green-800 transition-colors min-h-[38px]"
            title="WhatsApp"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        )}

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowShareMenu(prev => !prev)}
          >
            Share
          </Button>
          {showShareMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 min-w-[140px]">
              {BRAND_OPTIONS
                .filter(b => b.value !== engagement.brand)
                .map(b => (
                  <button
                    key={b.value}
                    onClick={() => handleShare(b.value)}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                  >
                    {b.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Month / Notes */}
      {(engagement.month || engagement.notes) && (
        <div className="text-xs text-zinc-500 pt-1 border-t border-zinc-800">
          {engagement.month && <span>Month: {engagement.month}</span>}
          {engagement.month && engagement.notes && <span> | </span>}
          {engagement.notes && <span>{engagement.notes}</span>}
        </div>
      )}
    </div>
  );
}

interface EngagementCardListProps {
  readonly engagements: ReadonlyArray<BrandEngagement & { readonly creator_name?: string }>;
  readonly onStatusChange: (id: string, status: EngagementStatus) => Promise<void>;
  readonly onShareToBrand: (engagement: BrandEngagement, targetBrand: Brand) => Promise<void>;
}

export function EngagementCardList({ engagements, onStatusChange, onShareToBrand }: EngagementCardListProps) {
  if (engagements.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        No engagements found for this creator.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {engagements.map(engagement => (
        <EngagementCard
          key={engagement.id}
          engagement={engagement}
          onStatusChange={onStatusChange}
          onShareToBrand={onShareToBrand}
        />
      ))}
    </div>
  );
}
