'use client';

import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

type ImportType = 'creators' | 'posts';
type ImportFormat = 'json' | 'csv';

interface ImportResult {
  readonly imported: number;
  readonly total: number;
  readonly errors?: ReadonlyArray<{ readonly index: number; readonly error: string }>;
}

const SAMPLE_CREATOR_JSON = JSON.stringify([
  {
    platform: 'xhs',
    platform_id: '12345',
    name: 'Food Reviewer',
    username: 'foodie123',
    profile_url: 'https://www.xiaohongshu.com/user/profile/12345',
    follower_count: 5000,
    location: 'KL',
    content_type: 'food_review',
    tags: ['food', 'kl', 'korean'],
  },
], null, 2);

const SAMPLE_POST_JSON = JSON.stringify([
  {
    creator_id: '<creator-uuid-here>',
    platform: 'xhs',
    post_url: 'https://www.xiaohongshu.com/explore/abc123',
    title: 'Best Korean BBQ in KL!',
    content: 'Went to Byond Walls today...',
    likes: 120,
    comments: 15,
    saves: 30,
    is_about_byondwalls: true,
    hashtags: ['koreanfood', 'klfoodies'],
  },
], null, 2);

const SAMPLE_CREATOR_CSV = `platform,platform_id,name,username,profile_url,follower_count,location,content_type,tags
xhs,12345,Food Reviewer,foodie123,https://www.xiaohongshu.com/user/profile/12345,5000,KL,food_review,"food,kl,korean"`;

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('creators');
  const [format, setFormat] = useState<ImportFormat>('json');
  const [inputData, setInputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    if (!inputData.trim()) {
      setError('Please paste your data first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let parsedData: unknown[];

      if (format === 'json') {
        try {
          parsedData = JSON.parse(inputData);
          if (!Array.isArray(parsedData)) {
            setError('JSON must be an array');
            setLoading(false);
            return;
          }
        } catch {
          setError('Invalid JSON format');
          setLoading(false);
          return;
        }
      } else {
        // Parse CSV manually for flexibility
        const lines = inputData.trim().split('\n');
        if (lines.length < 2) {
          setError('CSV must have a header row and at least one data row');
          setLoading(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        parsedData = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const obj: Record<string, unknown> = {};
          headers.forEach((header, i) => {
            const val = values[i]?.trim() ?? '';
            if (header === 'follower_count' || header === 'following_count' || header === 'post_count' ||
                header === 'likes' || header === 'comments' || header === 'saves' || header === 'views') {
              obj[header] = val ? parseInt(val, 10) : null;
            } else if (header === 'has_posted_about_us' || header === 'is_about_byondwalls') {
              obj[header] = val === 'true';
            } else if (header === 'tags' || header === 'hashtags' || header === 'keywords') {
              obj[header] = val ? val.split(',').map(t => t.trim()) : [];
            } else {
              obj[header] = val || null;
            }
          });
          return obj;
        });
      }

      const endpoint = importType === 'creators' ? '/api/import/creators' : '/api/import/posts';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      const json = await res.json();

      if (json.success) {
        setResult(json.data);
        setInputData('');
      } else {
        setError(json.error ?? 'Import failed');
        if (json.details) {
          setError(`${json.error}: ${JSON.stringify(json.details)}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }, [inputData, format, importType]);

  const handleLoadSample = useCallback(() => {
    if (format === 'json') {
      setInputData(importType === 'creators' ? SAMPLE_CREATOR_JSON : SAMPLE_POST_JSON);
    } else {
      setInputData(importType === 'creators' ? SAMPLE_CREATOR_CSV : '');
    }
  }, [format, importType]);

  return (
    <>
      <PageHeader
        title="Import Data"
        subtitle="Bulk import creators and posts via JSON or CSV"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <Select
                options={[
                  { value: 'creators', label: 'Creators' },
                  { value: 'posts', label: 'Posts' },
                ]}
                value={importType}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                className="w-32"
              />
              <Select
                options={[
                  { value: 'json', label: 'JSON' },
                  { value: 'csv', label: 'CSV' },
                ]}
                value={format}
                onChange={(e) => setFormat(e.target.value as ImportFormat)}
                className="w-24"
              />
              <Button variant="ghost" size="sm" onClick={handleLoadSample}>
                Load Sample
              </Button>
            </div>

            <Textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={16}
              placeholder={format === 'json' ? 'Paste JSON array here...' : 'Paste CSV with header row here...'}
              className="font-mono text-xs"
            />

            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleImport} disabled={loading || !inputData.trim()}>
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Importing...
                  </>
                ) : (
                  `Import ${importType}`
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-4 p-3 bg-green-950/30 border border-green-800/50 rounded-lg">
                <p className="text-sm text-green-400">
                  Successfully imported {result.imported} of {result.total} {importType}
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-yellow-400 mb-1">Errors:</p>
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-400">
                        Batch {e.index}: {e.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="API Endpoints" />
            <div className="space-y-3">
              <div>
                <code className="text-xs text-indigo-400 bg-zinc-800 px-2 py-1 rounded">
                  POST /api/import/creators
                </code>
                <p className="text-xs text-zinc-500 mt-1">Bulk import creators. Body: JSON array of creator objects.</p>
              </div>
              <div>
                <code className="text-xs text-indigo-400 bg-zinc-800 px-2 py-1 rounded">
                  POST /api/import/posts
                </code>
                <p className="text-xs text-zinc-500 mt-1">Bulk import posts. Body: JSON array of post objects.</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Required Fields" />
            <div className="space-y-2">
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 mb-1">Creators</h4>
                <p className="text-xs text-zinc-500">
                  platform, platform_id, name, username, profile_url
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 mb-1">Posts</h4>
                <p className="text-xs text-zinc-500">
                  creator_id, platform, post_url
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tips" />
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li>Creators are upserted by platform + platform_id</li>
              <li>Tags should be comma-separated in CSV</li>
              <li>Dates should be ISO 8601 format</li>
              <li>Follower counts must be integers</li>
              <li>Platform values: xhs, instagram, tiktok, youtube, facebook, twitter</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
