'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { getEngagementStatusConfig, formatCompactNumber } from '@/lib/constants';

interface EngagementPipelineProps {
  readonly data: ReadonlyArray<{ readonly status: string; readonly count: number }>;
}

export function EngagementPipeline({ data }: EngagementPipelineProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader title="Engagement Pipeline" />
      {data.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No engagements yet</p>
      ) : (
        <div className="space-y-2">
          {data.map(({ status, count }) => {
            const config = getEngagementStatusConfig(status);
            const widthPct = Math.max((count / maxCount) * 100, 6);
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    {formatCompactNumber(count)}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
