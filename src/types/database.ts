export type Platform = 'xhs' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter';

export type Brand = 'songhwa' | 'byondwalls' | 'hwc_coffee' | 'decore';

export type OutreachStatus =
  | 'not_contacted'
  | 'contacted'
  | 'responded'
  | 'agreed'
  | 'posted'
  | 'declined';

export type EngagementStatus =
  | 'prospect'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'visited'
  | 'posted'
  | 'paid'
  | 'skipped';

export interface BrandEngagement {
  readonly id: string;
  readonly creator_id: string;
  readonly brand: Brand;
  readonly status: EngagementStatus;
  readonly pic: string | null;
  readonly rate_rm: number | null;
  readonly payout_rm: number | null;
  readonly food_credit_rm: number | null;
  readonly proceed_date: string | null;
  readonly month: string | null;
  readonly contact_number: string | null;
  readonly posted_link: string | null;
  readonly likes: number | null;
  readonly collects: number | null;
  readonly paid_status: string | null;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type CampaignStatus = 'planning' | 'active' | 'completed';

export type CampaignCreatorStatus = 'invited' | 'accepted' | 'posted' | 'paid';

export interface Creator {
  readonly id: string;
  readonly platform: Platform;
  readonly platform_id: string;
  readonly name: string;
  readonly username: string;
  readonly profile_url: string;
  readonly follower_count: number | null;
  readonly following_count: number | null;
  readonly post_count: number | null;
  readonly bio: string | null;
  readonly location: string | null;
  readonly content_type: string | null;
  readonly has_posted_about_us: boolean;
  readonly outreach_status: OutreachStatus;
  readonly outreach_notes: string | null;
  readonly contact_info: string | null;
  readonly tags: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Post {
  readonly id: string;
  readonly creator_id: string;
  readonly platform: Platform;
  readonly post_url: string;
  readonly title: string | null;
  readonly content: string | null;
  readonly likes: number;
  readonly comments: number;
  readonly saves: number;
  readonly views: number;
  readonly is_about_byondwalls: boolean;
  readonly post_date: string | null;
  readonly hashtags: readonly string[];
  readonly keywords: readonly string[];
  readonly thumbnail_url: string | null;
  readonly created_at: string;
}

export interface PostWithCreator extends Post {
  readonly creators: Pick<Creator, 'name' | 'username' | 'platform'> | null;
}

export interface Campaign {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly target_keywords: readonly string[];
  readonly target_hashtags: readonly string[];
  readonly budget: number | null;
  readonly status: CampaignStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CampaignCreator {
  readonly campaign_id: string;
  readonly creator_id: string;
  readonly status: CampaignCreatorStatus;
  readonly payment_amount: number | null;
  readonly post_id: string | null;
}

export interface CampaignWithCreators extends Campaign {
  readonly campaign_creators: ReadonlyArray<
    CampaignCreator & {
      readonly creators: Pick<Creator, 'id' | 'name' | 'username' | 'platform'>;
    }
  >;
}

export interface DashboardStats {
  readonly totalCreators: number;
  readonly byPlatform: ReadonlyArray<{ readonly platform: string; readonly count: number }>;
  readonly byOutreachStatus: ReadonlyArray<{ readonly status: string; readonly count: number }>;
  readonly byBrand?: ReadonlyArray<{ readonly brand: string; readonly creatorCount: number }>;
  readonly picBreakdown?: ReadonlyArray<{ readonly pic: string; readonly count: number }>;
  readonly totalSpent?: number;
  readonly engagementPipeline?: ReadonlyArray<{ readonly status: string; readonly count: number }>;
  readonly recentPosts: readonly PostWithCreator[];
  readonly totalPosts: number;
  readonly postsAboutUs: number;
  readonly tierBreakdown?: ReadonlyArray<{ readonly tier: string; readonly count: number }>;
  readonly topCreators?: ReadonlyArray<{
    readonly name: string;
    readonly follower_count: number;
    readonly likes_count?: number;
    readonly outreach_status: string;
    readonly profile_url: string;
  }>;
  readonly outreachFunnel?: ReadonlyArray<{
    readonly status: string;
    readonly label: string;
    readonly color: string;
    readonly count: number;
    readonly percentage: number;
  }>;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password_hash: string;
  readonly role: UserRole;
  readonly assigned_brands: readonly Brand[];
  readonly assigned_creators: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CreatorFilters {
  readonly platform?: Platform;
  readonly location?: string;
  readonly outreach_status?: OutreachStatus;
  readonly has_posted_about_us?: boolean;
  readonly follower_min?: number;
  readonly follower_max?: number;
  readonly search?: string;
  readonly sort_by?: string;
  readonly sort_order?: 'asc' | 'desc';
  readonly page?: number;
  readonly per_page?: number;
}

export interface PostFilters {
  readonly platform?: Platform;
  readonly is_about_byondwalls?: boolean;
  readonly date_from?: string;
  readonly date_to?: string;
  readonly likes_min?: number;
  readonly likes_max?: number;
  readonly sort_by?: string;
  readonly sort_order?: 'asc' | 'desc';
  readonly page?: number;
  readonly per_page?: number;
}
