-- Social Media Crawl - Initial Schema
-- Creates tables for creators, posts, campaigns, and campaign_creators

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creators table
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('xhs', 'instagram', 'tiktok', 'youtube', 'facebook', 'twitter')),
  platform_id TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  bio TEXT,
  location TEXT,
  content_type TEXT,
  has_posted_about_us BOOLEAN NOT NULL DEFAULT FALSE,
  outreach_status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (outreach_status IN ('not_contacted', 'contacted', 'responded', 'agreed', 'posted', 'declined')),
  outreach_notes TEXT,
  contact_info TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, platform_id)
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  is_about_byondwalls BOOLEAN NOT NULL DEFAULT FALSE,
  post_date TIMESTAMPTZ,
  hashtags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  target_keywords TEXT[] DEFAULT '{}',
  target_hashtags TEXT[] DEFAULT '{}',
  budget DECIMAL,
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign-Creators junction table
CREATE TABLE campaign_creators (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'accepted', 'posted', 'paid')),
  payment_amount DECIMAL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  PRIMARY KEY (campaign_id, creator_id)
);

-- Indexes for common queries
CREATE INDEX idx_creators_platform ON creators(platform);
CREATE INDEX idx_creators_location ON creators(location);
CREATE INDEX idx_creators_outreach_status ON creators(outreach_status);
CREATE INDEX idx_creators_has_posted ON creators(has_posted_about_us);
CREATE INDEX idx_creators_name ON creators(name);
CREATE INDEX idx_creators_tags ON creators USING GIN(tags);
CREATE INDEX idx_posts_creator_id ON posts(creator_id);
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_is_about_byondwalls ON posts(is_about_byondwalls);
CREATE INDEX idx_posts_post_date ON posts(post_date);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to creators
CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to campaigns
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (enable but allow all for service role)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

-- Policies for anon access (internal tool, allow all)
CREATE POLICY "Allow all on creators" ON creators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on campaigns" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on campaign_creators" ON campaign_creators FOR ALL USING (true) WITH CHECK (true);
