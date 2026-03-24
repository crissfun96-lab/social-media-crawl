'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { getBrandConfig, formatCompactNumber } from '@/lib/constants';

interface BrandBreakdownProps {
  readonly data: ReadonlyArray<{ readonly brand: string; readonly creatorCount: number }>;
}

export function BrandBreakdown({ data }: BrandBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.creatorCount, 0);

  return (
    <Card>
      <CardHeader title="Creators by Brand" />
      {data.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No brand engagements yet</p>
      ) : (
        <div className="space-y-3">
          {data.map(({ brand, creatorCount }) => {
            const config = getBrandConfig(brand);
            const pct = total > 0 ? Math.round((creatorCount / total) * 100) : 0;
            return (
              <div key={brand}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300 tabular-nums">
                    {formatCompactNumber(creatorCount)}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-zinc-600 pt-1">
            {formatCompactNumber(total)} total brand engagements
          </p>
        </div>
      )}
    </Card>
  );
}
