'use client';

import { useState, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { LoadingPage, Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getCampaignStatusConfig, CAMPAIGN_STATUS_OPTIONS, formatNumber, getPlatformLabel } from '@/lib/constants';
import type { CampaignWithCreators } from '@/types/database';

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: campaigns, loading, error, refetch } = useCampaignsFetch('/api/campaigns');

  if (loading) return <LoadingPage />;

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Failed to load campaigns: {error}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle={`${campaigns?.length ?? 0} campaigns`}
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            + New Campaign
          </Button>
        }
      />

      {showForm && (
        <CreateCampaignForm
          onCreated={() => { setShowForm(false); refetch(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onUpdate={refetch} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No campaigns yet"
          description="Create your first influencer campaign to get started."
          action={<Button onClick={() => setShowForm(true)}>Create Campaign</Button>}
        />
      )}
    </>
  );
}

function CreateCampaignForm({
  onCreated,
  onCancel,
}: {
  readonly onCreated: () => void;
  readonly onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [keywords, setKeywords] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          budget: budget ? parseFloat(budget) : null,
          target_keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
          target_hashtags: hashtags ? hashtags.split(',').map(h => h.trim()) : [],
        }),
      });

      const json = await res.json();
      if (json.success) {
        onCreated();
      } else {
        setError(json.error ?? 'Failed to create campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }, [name, description, budget, keywords, hashtags, onCreated]);

  return (
    <Card className="mb-6">
      <CardHeader title="New Campaign" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Campaign Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chinese New Year Food Bloggers"
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Campaign goals and details..."
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Budget (MYR)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="5000"
            min="0"
            step="0.01"
          />
          <Input
            label="Target Keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="korean food, bbq"
          />
          <Input
            label="Target Hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="klfoodies, koreanfood"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" /> Creating...</> : 'Create Campaign'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function CampaignCard({
  campaign,
  onUpdate,
}: {
  readonly campaign: CampaignWithCreators;
  readonly onUpdate: () => void;
}) {
  const statusConfig = getCampaignStatusConfig(campaign.status);
  const creatorCount = campaign.campaign_creators?.length ?? 0;
  const totalSpend = campaign.campaign_creators?.reduce(
    (sum, cc) => sum + (cc.payment_amount ?? 0),
    0
  ) ?? 0;

  return (
    <Card className="hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-200">{campaign.name}</h3>
          {campaign.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{campaign.description}</p>
          )}
        </div>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
          <p className="text-lg font-bold text-zinc-200">{creatorCount}</p>
          <p className="text-[10px] text-zinc-500">Creators</p>
        </div>
        <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
          <p className="text-lg font-bold text-zinc-200">
            {campaign.budget ? `RM ${formatNumber(campaign.budget)}` : '-'}
          </p>
          <p className="text-[10px] text-zinc-500">Budget</p>
        </div>
        <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
          <p className="text-lg font-bold text-zinc-200">
            {totalSpend > 0 ? `RM ${formatNumber(totalSpend)}` : '-'}
          </p>
          <p className="text-[10px] text-zinc-500">Spent</p>
        </div>
      </div>

      {campaign.target_hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {campaign.target_hashtags.map((tag) => (
            <span key={tag} className="text-xs text-indigo-400">#{tag}</span>
          ))}
        </div>
      )}

      {creatorCount > 0 && (
        <div className="border-t border-zinc-800 pt-3 mt-3">
          <p className="text-xs font-medium text-zinc-400 mb-2">Creators</p>
          <div className="space-y-1">
            {campaign.campaign_creators.slice(0, 5).map((cc) => (
              <div key={cc.creator_id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">
                  {cc.creators.name}
                  <span className="text-zinc-500 ml-1">({getPlatformLabel(cc.creators.platform)})</span>
                </span>
                <Badge className="bg-zinc-800 text-zinc-400">{cc.status}</Badge>
              </div>
            ))}
            {creatorCount > 5 && (
              <p className="text-xs text-zinc-500">+{creatorCount - 5} more</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function useCampaignsFetch(url: string) {
  const [state, setState] = useState<{
    data: CampaignWithCreators[] | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  const urlRef = useRef(url);
  urlRef.current = url;

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(urlRef.current);
      const json = await res.json();
      if (!json.success) {
        setState({ data: null, loading: false, error: json.error ?? 'Unknown error' });
      } else {
        setState({ data: json.data, loading: false, error: null });
      }
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Fetch failed' });
    }
  }, []);

  const prevUrl = useRef('');
  if (url !== prevUrl.current) {
    prevUrl.current = url;
    refetch();
  }

  return { ...state, refetch };
}
