'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/constants';

interface PicBreakdownProps {
  readonly data: ReadonlyArray<{ readonly pic: string; readonly count: number }>;
  readonly totalSpent: number;
}

const PIC_COLORS: Record<string, string> = {
  liz: 'bg-pink-500',
  amber: 'bg-amber-500',
  'amber/liz': 'bg-violet-500',
  'amber/niling': 'bg-teal-500',
};

export function PicBreakdown({ data, totalSpent }: PicBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader title="PIC Breakdown" />
      {data.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No PIC assignments yet</p>
      ) : (
        <div className="space-y-3">
          {data.map(({ pic, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = PIC_COLORS[pic.toLowerCase()] ?? 'bg-zinc-500';
            return (
              <div key={pic} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm text-zinc-300 capitalize">{pic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-200 tabular-nums">{count}</span>
                  <span className="text-xs text-zinc-500">({pct}%)</span>
                </div>
              </div>
            );
          })}
          <div className="border-t border-zinc-800 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Spent</span>
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
