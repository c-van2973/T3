-- D1 (SQLite-compatible) migration: initial schema

-- Products table for SwankyBoyz affiliate catalog
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  site TEXT,
  title TEXT,
  description TEXT,
  price REAL,
  currency TEXT,
  image TEXT,
  rating REAL,
  reviews INTEGER,
  category TEXT,
  affiliate_url TEXT,
  source TEXT,
  source_product_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Articles across all sites
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  site TEXT,
  slug TEXT,
  title TEXT,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  published_at TEXT,
  status TEXT,
  category TEXT,
  tags TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Newsletter & email subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  site TEXT,
  name TEXT,
  source TEXT,
  subscribed_at TEXT DEFAULT (datetime('now')),
  unsubscribed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Enhanced analytics with affiliate click tracking
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  site TEXT,
  path TEXT,
  event TEXT,
  affiliate_network TEXT,
  product_id TEXT,
  article_slug TEXT,
  destination_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  meta TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Affiliate network definitions and credentials
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,
  network TEXT,
  param_template TEXT,
  priority INTEGER,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Service offerings for VaughnSterling.com
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  price REAL,
  currency TEXT,
  description TEXT,
  features TEXT,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Bookings / Orders from services
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  email TEXT,
  name TEXT,
  status TEXT,
  payment_status TEXT,
  stripe_transaction_id TEXT,
  meta TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Content generation logs (OpenAI API usage)
CREATE TABLE IF NOT EXISTS content_logs (
  id TEXT PRIMARY KEY,
  site TEXT,
  article_id TEXT,
  prompt TEXT,
  output_summary TEXT,
  model TEXT,
  tokens_used INTEGER,
  cost REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_articles_site ON articles(site);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_analytics_site ON analytics(site);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event);
CREATE INDEX IF NOT EXISTS idx_analytics_affiliate ON analytics(affiliate_network);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_site ON subscribers(site);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
