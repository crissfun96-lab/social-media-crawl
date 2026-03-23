'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useFetch } from '@/lib/hooks';
import { EngagementCardList } from '@/components/creators/engagement-card';
import {
  formatNumber,
  getPlatformLabel,
  getOutreachStatusConfig,
  OUTREACH_STATUS_OPTIONS,
} from '@/lib/constants';
import type { Creator, PostWithCreator, BrandEngagement, EngagementStatus, Brand } from '@/types/database';

interface CreatorDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default function CreatorDetailPage({ params }: CreatorDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: creator, loading, error, refetch } = useFetch<Creator>(`/api/creators/${id}`);
  const { data: posts } = useFetch<readonly PostWithCreator[]>(`/api/posts?creator_id=${id}`);
  const { data: engagements, refetch: refetchEngagements } = useFetch<readonly BrandEngagement[]>(`/api/engagements?creator_id=${id}`);

  const [editingStatus, setEditingStatus] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const updateCreator = useCallback(async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/creators/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        refetch();
      } else {
        alert(`Update failed: ${json.error}`);
      }
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
      setEditingStatus(false);
      setEditingNotes(false);
      setEditingTags(false);
    }
  }, [id, refetch]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this creator?')) return;
    try {
      const res = await fetch(`/api/creators/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/creators');
      } else {
        alert(`Delete failed: ${json.error}`);
      }
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [id, router]);

  const handleEngagementStatusChange = useCallback(async (engagementId: string, status: EngagementStatus) => {
    await fetch(`/api/engagements/${engagementId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    refetchEngagements();
  }, [refetchEngagements]);

  const handleShareToBrand = useCallback(async (engagement: BrandEngagement, targetBrand: Brand) => {
    const res = await fetch('/api/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_id: engagement.creator_id,
        brand: targetBrand,
        status: 'prospect',
        pic: engagement.pic,
        rate_rm: engagement.rate_rm,
        contact_number: engagement.contact_number,
      }),
    });
    const json = await res.json();
    if (json.success) {
      refetchEngagements();
    } else {
      alert(`Share failed: ${json.error}`);
    }
  }, [refetchEngagements]);

  if (loading) return <LoadingPage />;

  if (error || !creator) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">{error ?? 'Creator not found'}</p>
        <Link href="/creators" className="text-indigo-400 text-sm mt-2 inline-block">Back to creators</Link>
      </div>
    );
  }

  const statusConfig = getOutreachStatusConfig(creator.outreach_status);

  return (
    <>
      <PageHeader
        title={creator.name}
        subtitle={`@${creator.username} on ${getPlatformLabel(creator.platform)}`}
        action={
          <div className="flex items-center gap-2">
            <a
              href={creator.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              View Profile
            </a>
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Profile */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader title="Profile" />
            <dl className="space-y-3">
              <InfoRow label="Platform" value={getPlatformLabel(creator.platform)} />
              <InfoRow label="Followers" value={formatNumber(creator.follower_count)} />
              <InfoRow label="Following" value={formatNumber(creator.following_count)} />
              <InfoRow label="Posts" value={formatNumber(creator.post_count)} />
              <InfoRow label="Location" value={creator.location ?? '-'} />
              <InfoRow label="Content Type" value={creator.content_type ?? '-'} />
              <InfoRow label="Contact" value={creator.contact_info ?? '-'} />
              {creator.bio && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Bio</dt>
                  <dd className="text-sm text-zinc-300 mt-0.5 zh-text">{creator.bio}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Outreach Status */}
          <Card>
            <CardHeader
              title="Outreach Status"
              action={
                !editingStatus && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingStatus(true); setNewStatus(creator.outreach_status); }}>
                    Edit
                  </Button>
                )
              }
            />
            {editingStatus ? (
              <div className="space-y-3">
                <Select
                  options={OUTREACH_STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateCreator({ outreach_status: newStatus })} disabled={saving}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingStatus(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            )}
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader
              title="Tags"
              action={
                !editingTags && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingTags(true); setTagInput(creator.tags.join(', ')); }}>
                    Edit
                  </Button>
                )
              }
            />
            {editingTags ? (
              <div className="space-y-3">
                <Input
                  placeholder="Comma-separated tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateCreator({ tags: tagInput.split(',').map(t => t.trim()).filter(Boolean) })}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingTags(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {creator.tags.length > 0 ? (
                  creator.tags.map((tag) => (
                    <Badge key={tag} className="bg-zinc-800 text-zinc-300">{tag}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No tags</p>
                )}
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader
              title="Outreach Notes"
              action={
                !editingNotes && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(true); setNotes(creator.outreach_notes ?? ''); }}>
                    Edit
                  </Button>
                )
              }
            />
            {editingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add outreach notes..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateCreator({ outreach_notes: notes })} disabled={saving}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                {creator.outreach_notes ?? 'No notes yet'}
              </p>
            )}
          </Card>
        </div>

        {/* Right column - Engagements + Posts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Engagements */}
          <Card>
            <CardHeader
              title="Brand Engagements"
              subtitle={`${engagements?.length ?? 0} engagements`}
            />
            <EngagementCardList
              engagements={(engagements ?? []) as ReadonlyArray<BrandEngagement & { readonly creator_name?: string }>}
              onStatusChange={handleEngagementStatusChange}
              onShareToBrand={handleShareToBrand}
            />
          </Card>

          {/* Posts */}
          <Card>
            <CardHeader
              title="Tracked Posts"
              subtitle={`${(posts as readonly PostWithCreator[] | null)?.length ?? 0} posts`}
            />
            {!posts || posts.length === 0 ? (
              <EmptyState
                title="No posts tracked"
                description="Import posts to see them here."
              />
            ) : (
              <div className="space-y-3">
                {posts.map((post: PostWithCreator) => (
                  <div key={post.id} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {post.is_about_byondwalls && (
                            <Badge className="bg-indigo-900 text-indigo-300">About Us</Badge>
                          )}
                          <Badge className="bg-zinc-700 text-zinc-300">
                            {getPlatformLabel(post.platform)}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium text-zinc-200 zh-text">
                          {post.title ?? 'Untitled'}
                        </h4>
                        {post.content && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 zh-text">{post.content}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                          <span>{formatNumber(post.likes)} likes</span>
                          <span>{formatNumber(post.comments)} comments</span>
                          <span>{formatNumber(post.saves)} saves</span>
                          <span>{formatNumber(post.views)} views</span>
                        </div>
                        {post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.hashtags.map((tag) => (
                              <span key={tag} className="text-xs text-indigo-400">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex-shrink-0"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-300">{value}</dd>
    </div>
  );
}
