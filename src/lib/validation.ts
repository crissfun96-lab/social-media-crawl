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

const USER_ROLES = ['admin', 'staff'] as const;
const BRANDS = ['songhwa', 'byondwalls', 'hwc_coffee', 'decore'] as const;

export const userRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Must be a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(USER_ROLES).optional(),
  assigned_brands: z.array(z.enum(BRANDS)).optional(),
  assigned_creators: z.array(z.string()).optional(),
});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const bulkCreatorsSchema = z.array(creatorSchema).min(1, 'At least one creator required');
export const bulkPostsSchema = z.array(postSchema).min(1, 'At least one post required');

const ENGAGEMENT_STATUSES = ['prospect', 'contacted', 'negotiating', 'confirmed', 'visited', 'posted', 'paid', 'skipped'] as const;

export const engagementSchema = z.object({
  creator_id: z.string().min(1, 'Creator ID is required'),
  brand: z.enum(BRANDS),
  status: z.enum(ENGAGEMENT_STATUSES).optional(),
  pic: z.string().nullable().optional(),
  rate_rm: z.number().nonnegative().nullable().optional(),
  payout_rm: z.number().nonnegative().nullable().optional(),
  food_credit_rm: z.number().nonnegative().nullable().optional(),
  proceed_date: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  contact_number: z.string().nullable().optional(),
  posted_link: z.string().nullable().optional(),
  likes: z.number().int().nonnegative().nullable().optional(),
  collects: z.number().int().nonnegative().nullable().optional(),
  paid_status: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const engagementUpdateSchema = engagementSchema.partial();

export const bulkEngagementsSchema = z.array(engagementSchema).min(1, 'At least one engagement required');

export type CreatorInput = z.infer<typeof creatorSchema>;
export type CreatorUpdateInput = z.infer<typeof creatorUpdateSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignCreatorInput = z.infer<typeof campaignCreatorSchema>;
export type EngagementInput = z.infer<typeof engagementSchema>;
export type EngagementUpdateInput = z.infer<typeof engagementUpdateSchema>;
