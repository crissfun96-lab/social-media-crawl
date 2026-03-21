'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { OUTREACH_STATUS_OPTIONS, getOutreachStatusConfig } from '@/lib/constants';
import type { OutreachStatus } from '@/types/database';

interface StatusSelectProps {
  readonly creatorId: string;
  readonly currentStatus: OutreachStatus;
  readonly onStatusChange?: (id: string, status: OutreachStatus) => Promise<void>;
  readonly compact?: boolean;
}

export function StatusSelect({ creatorId, currentStatus, onStatusChange, compact }: StatusSelectProps) {
  const [selectedStatus, setSelectedStatus] = useState<OutreachStatus>(currentStatus);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  // Reset when current status changes from parent
  useEffect(() => {
    setSelectedStatus(currentStatus);
    setIsConfirming(false);
  }, [currentStatus]);

  // Close confirm on outside click
  useEffect(() => {
    if (!isConfirming) return;
    const handler = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setSelectedStatus(currentStatus);
        setIsConfirming(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isConfirming, currentStatus]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as OutreachStatus;
    setSelectedStatus(newStatus);
    if (newStatus !== currentStatus) {
      setIsConfirming(true);
    } else {
      setIsConfirming(false);
    }
  }, [currentStatus]);

  const handleConfirm = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onStatusChange || isSaving) return;
    setIsSaving(true);
    try {
      await onStatusChange(creatorId, selectedStatus);
      setIsConfirming(false);
    } finally {
      setIsSaving(false);
    }
  }, [creatorId, selectedStatus, onStatusChange, isSaving]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedStatus(currentStatus);
    setIsConfirming(false);
  }, [currentStatus]);

  const statusConfig = getOutreachStatusConfig(selectedStatus);

  if (!onStatusChange) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {statusConfig.label}
      </span>
    );
  }

  return (
    <div ref={confirmRef} className="relative inline-flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <select
        value={selectedStatus}
        onChange={handleChange}
        disabled={isSaving}
        className={`appearance-none cursor-pointer rounded text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-500
          ${compact ? 'px-2 py-1' : 'px-3 py-2 min-h-[44px]'}
          ${statusConfig.color} bg-opacity-80
          ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '16px', paddingRight: '24px' }}
      >
        {OUTREACH_STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {isConfirming && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-2 py-1 rounded text-xs font-medium bg-green-700 text-green-100 hover:bg-green-600 transition-colors min-h-[28px]"
          >
            {isSaving ? '...' : 'OK'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors min-h-[28px]"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
}
