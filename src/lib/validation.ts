import { z } from 'zod';

const PLATFORMS = ['xhs', 'instagram', 'tiktok', 'youtube', 'facebook', 'twitter'] as const;
const OUTREACH_STATUSES = ['not_contacted', 'contacted', 'responded', 'agreed', 'posted', 'declined'] as const;
const CAMPAIGN_STATUSES = ['planning', 'active', 'completed'] as const;
const CAMPAIGN_CREATOR_STATUSES = ['invited', 'accepted', 'posted', 'paid'] as const;

export const creatorSchema = z.object({
  platform: z.enum(PLATFORMS),
  platform_id: z.string().min(1, 'Platform ID is required'),
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  profile_url: z.string().url('Must be a valid URL'),
  follower_count: z.number().int().nonnegative().nullable().optional(),
  following_count: z.number().int().nonnegative().nullable().optional(),
  post_count: z.number().int().nonnegative().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  has_posted_about_us: z.boolean().optional(),
  outreach_status: z.enum(OUTREACH_STATUSES).optional(),
  outreach_notes: z.string().nullable().optional(),
  contact_info: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const creatorUpdateSchema = creatorSchema.partial();

export const postSchema = z.object({
  creator_id: z.string().uuid('Must be a valid creator ID'),
  platform: z.enum(PLATFORMS),
  post_url: z.string().url('Must be a valid URL'),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  likes: z.number().int().nonnegative().optional(),
  comments: z.number().int().nonnegative().optional(),
  saves: z.number().int().nonnegative().optional(),
  views: z.number().int().nonnegative().optional(),
  is_about_byondwalls: z.boolean().optional(),
  post_date: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().nullable().optional(),
  target_keywords: z.array(z.string()).optional(),
  target_hashtags: z.array(z.string()).optional(),
  budget: z.number().nonnegative().nullable().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

export const campaignCreatorSchema = z.object({
  campaign_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  status: z.enum(CAMPAIGN_CREATOR_STATUSES).optional(),
  payment_amount: z.number().nonnegative().nullable().optional(),
  post_id: z.string().uuid().nullable().optional(),
});

export const bulkCreatorsSchema = z.array(creatorSchema).min(1, 'At least one creator required');
export const bulkPostsSchema = z.array(postSchema).min(1, 'At least one post required');

export type CreatorInput = z.infer<typeof creatorSchema>;
export type CreatorUpdateInput = z.infer<typeof creatorUpdateSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignCreatorInput = z.infer<typeof campaignCreatorSchema>;
