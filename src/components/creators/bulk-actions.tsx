'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { OUTREACH_STATUS_OPTIONS } from '@/lib/constants';

interface BulkActionsProps {
  readonly selectedCount: number;
  readonly onChangeStatus: (status: string) => void;
  readonly onAddTags: (tags: string[]) => void;
}

export function BulkActions({ selectedCount, onChangeStatus, onAddTags }: BulkActionsProps) {
  const [newStatus, setNewStatus] = useState('');
  const [tagInput, setTagInput] = useState('');

  if (selectedCount === 0) return null;

  function handleAddTags() {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      onAddTags(tags);
      setTagInput('');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-lg mb-4">
      <span className="text-sm text-indigo-300 font-medium">{selectedCount} selected</span>
      <div className="flex items-center gap-2">
        <Select
          options={OUTREACH_STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
          placeholder="Change status..."
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-40"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => { if (newStatus) { onChangeStatus(newStatus); setNewStatus(''); } }}
          disabled={!newStatus}
        >
          Apply
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add tags (comma-separated)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-48"
        />
        <Button size="sm" variant="secondary" onClick={handleAddTags} disabled={!tagInput.trim()}>
          Add Tags
        </Button>
      </div>
    </div>
  );
}
