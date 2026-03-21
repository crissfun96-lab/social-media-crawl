'use client';

import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, getPlatformLabel } from '@/lib/constants';
import type { PostWithCreator } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

interface RecentPostsProps {
  readonly posts: readonly PostWithCreator[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  return (
    <Card>
      <CardHeader
        title="Recent Posts About Us"
        action={
          <Link href="/posts?is_about_byondwalls=true" className="text-xs text-indigo-400 hover:text-indigo-300">
            View all
          </Link>
        }
      />
      {posts.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No posts yet</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-indigo-900/50 text-indigo-300">
                    {getPlatformLabel(post.platform)}
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-zinc-200 truncate">
                  {post.title ?? post.content?.slice(0, 80) ?? 'No title'}
                </p>
                {post.creators && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    by {post.creators.name} (@{post.creators.username})
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                  <span>{formatNumber(post.likes)} likes</span>
                  <span>{formatNumber(post.comments)} comments</span>
                  <span>{formatNumber(post.saves)} saves</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
