'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface QuickAction {
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly icon: string;
}

const ACTIONS: ReadonlyArray<QuickAction> = [
  {
    label: 'DM Next Creator',
    description: 'Reach out to the top not-contacted creator by followers',
    href: '/creators/spreadsheet?outreach_status=not_contacted',
    icon: '💬',
  },
  {
    label: 'View Spreadsheet',
    description: 'Browse and manage all creators in table view',
    href: '/creators/spreadsheet',
    icon: '📊',
  },
  {
    label: 'Import Data',
    description: 'Import creators and posts from CSV or XHS',
    href: '/import',
    icon: '📥',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {ACTIONS.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="hover:border-indigo-700 hover:bg-zinc-800/80 transition-colors cursor-pointer h-full">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none flex-shrink-0">{action.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100">{action.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{action.description}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
