'use client';

import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ColumnMapping {
  readonly csvColumn: string;
  readonly field: string;
}

const ENGAGEMENT_FIELDS: readonly { readonly value: string; readonly label: string }[] = [
  { value: '', label: '-- Skip --' },
  { value: 'creator_id', label: 'Creator ID' },
  { value: 'creator_name', label: 'Creator Name' },
  { value: 'brand', label: 'Brand' },
  { value: 'status', label: 'Status' },
  { value: 'pic', label: 'PIC' },
  { value: 'rate_rm', label: 'Rate (RM)' },
  { value: 'payout_rm', label: 'Payout (RM)' },
  { value: 'food_credit_rm', label: 'Food Credit (RM)' },
  { value: 'proceed_date', label: 'Proceed Date' },
  { value: 'month', label: 'Month' },
  { value: 'contact_number', label: 'Contact Number' },
  { value: 'posted_link', label: 'Posted Link' },
  { value: 'likes', label: 'Likes' },
  { value: 'collects', label: 'Collects' },
  { value: 'paid_status', label: 'Paid Status' },
  { value: 'notes', label: 'Notes' },
] as const;

// Best-guess mapping from CSV header to engagement field
function autoMapColumn(header: string): string {
  const h = header.toLowerCase().trim();
  const mappings: Record<string, string> = {
    creator_id: 'creator_id',
    creator_name: 'creator_name',
    name: 'creator_name',
    brand: 'brand',
    status: 'status',
    pic: 'pic',
    rate_rm: 'rate_rm',
    rate: 'rate_rm',
    rate_card: 'rate_rm',
    payout_rm: 'payout_rm',
    payout: 'payout_rm',
    food_credit_rm: 'food_credit_rm',
    food_credit: 'food_credit_rm',
    proceed_date: 'proceed_date',
    month: 'month',
    contact_number: 'contact_number',
    phone: 'contact_number',
    posted_link: 'posted_link',
    link: 'posted_link',
    likes: 'likes',
    collects: 'collects',
    saves: 'collects',
    paid_status: 'paid_status',
    notes: 'notes',
  };
  return mappings[h] ?? '';
}

interface CsvUploadProps {
  readonly onImportComplete: () => void;
}

export function CsvUpload({ onImportComplete }: CsvUploadProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<readonly string[]>([]);
  const [csvRows, setCsvRows] = useState<ReadonlyArray<Record<string, string>>>([]);
  const [mappings, setMappings] = useState<readonly ColumnMapping[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; errors?: unknown[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        if (rows.length === 0) {
          setError('CSV file is empty');
          return;
        }
        const headers = Object.keys(rows[0]);
        setCsvHeaders(headers);
        setCsvRows(rows);
        setMappings(headers.map(h => ({ csvColumn: h, field: autoMapColumn(h) })));
        setStep('mapping');
      },
      error: (err) => {
        setError(`CSV parse error: ${err.message}`);
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleMappingChange = useCallback((csvColumn: string, field: string) => {
    setMappings(prev =>
      prev.map(m => m.csvColumn === csvColumn ? { ...m, field } : m)
    );
  }, []);

  const getMappedData = useCallback((): Record<string, unknown>[] => {
    return csvRows.map(row => {
      const mapped: Record<string, unknown> = {};
      for (const m of mappings) {
        if (!m.field) continue;
        const val = row[m.csvColumn];
        if (m.field === 'rate_rm' || m.field === 'payout_rm' || m.field === 'food_credit_rm' || m.field === 'likes' || m.field === 'collects') {
          mapped[m.field] = val ? parseFloat(val) || null : null;
        } else {
          mapped[m.field] = val || null;
        }
      }
      return mapped;
    });
  }, [csvRows, mappings]);

  const handlePreview = useCallback(() => {
    const hasCreatorId = mappings.some(m => m.field === 'creator_id');
    const hasBrand = mappings.some(m => m.field === 'brand');
    if (!hasCreatorId || !hasBrand) {
      setError('You must map at least "Creator ID" and "Brand" columns.');
      return;
    }
    setError(null);
    setStep('preview');
  }, [mappings]);

  const handleImport = useCallback(async () => {
    setStep('importing');
    setError(null);
    try {
      const data = getMappedData();
      const res = await fetch('/api/import/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setImportResult(json.data);
        setStep('done');
        onImportComplete();
      } else {
        setError(json.error ?? 'Import failed');
        setStep('preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  }, [getMappedData, onImportComplete]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setMappings([]);
    setImportResult(null);
    setError(null);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100">Import Engagements from CSV</h3>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Upload a CSV file exported from Google Sheets. The file should contain engagement data
            with columns like creator_id, brand, status, rate_rm, etc.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Select CSV File
          </Button>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Map CSV columns to engagement fields. {csvRows.length} rows detected.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {csvHeaders.map(header => {
              const mapping = mappings.find(m => m.csvColumn === header);
              return (
                <div key={header} className="flex items-center gap-2">
                  <span className="text-sm text-zinc-300 min-w-[120px] truncate" title={header}>
                    {header}
                  </span>
                  <span className="text-zinc-600 text-xs">-&gt;</span>
                  <Select
                    options={ENGAGEMENT_FIELDS.map(f => ({ value: f.value, label: f.label }))}
                    value={mapping?.field ?? ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePreview}>Preview Data</Button>
            <Button variant="secondary" onClick={handleReset}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Preview of first 5 rows. {csvRows.length} total rows will be imported.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {mappings.filter(m => m.field).map(m => (
                    <th key={m.csvColumn} className="text-left py-2 px-2 text-zinc-400 font-medium text-xs">
                      {m.field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getMappedData().slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    {mappings.filter(m => m.field).map(m => (
                      <td key={m.csvColumn} className="py-2 px-2 text-zinc-300 text-xs truncate max-w-[150px]">
                        {String(row[m.field] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleImport}>
              Import {csvRows.length} Records
            </Button>
            <Button variant="secondary" onClick={() => setStep('mapping')}>Back to Mapping</Button>
            <Button variant="secondary" onClick={handleReset}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === 'importing' && (
        <div className="flex items-center gap-3 py-4">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
          <span className="text-zinc-300">Importing {csvRows.length} engagements...</span>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 'done' && importResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-900 text-green-300">
              {importResult.imported} / {importResult.total} imported
            </Badge>
            {importResult.errors && importResult.errors.length > 0 && (
              <Badge className="bg-amber-900 text-amber-300">
                {importResult.errors.length} errors
              </Badge>
            )}
          </div>
          <Button variant="secondary" onClick={handleReset}>Import Another</Button>
        </div>
      )}
    </div>
  );
}
