'use client';

import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import type { Creator } from '@/types/database';

interface CsvExportProps {
  readonly creators: readonly Creator[];
}

export function CsvExport({ creators }: CsvExportProps) {
  function handleExport() {
    const rows = creators.map(c => ({
      name: c.name,
      username: c.username,
      platform: c.platform,
      platform_id: c.platform_id,
      profile_url: c.profile_url,
      follower_count: c.follower_count ?? '',
      following_count: c.following_count ?? '',
      post_count: c.post_count ?? '',
      bio: c.bio ?? '',
      location: c.location ?? '',
      content_type: c.content_type ?? '',
      has_posted_about_us: c.has_posted_about_us,
      outreach_status: c.outreach_status,
      outreach_notes: c.outreach_notes ?? '',
      contact_info: c.contact_info ?? '',
      tags: c.tags.join(', '),
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creators-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={creators.length === 0}>
      Export CSV
    </Button>
  );
}
