# 🚀 Vaughn's Trio: Production-Ready Deploy Guide

> **Your ticket to R15,000+/month from South Africa to anywhere in the world.** 
> Three domains, three revenue streams, one deployment. 4-6 hours at an internet café.

---

## 📌 What You Have

Three fully-built Astro sites with Cloudflare Pages + Workers:

1. **SwankyBoyz.com** — Men's lifestyle affiliate site (Amazon, watches, grooming)
2. **VaughnSterlingTours.com** — Your journey SA → SE Asia (Booking, travel affiliates)
3. **VaughnSterling.com** — Personal brand + freelance services (R5k-15k per project)

**Status**: ✅ Production-ready. Deploy in 4-6 hours. No additional coding needed.

---

## 🎯 What's Included

### ✅ Three Complete Astro Sites
- Pre-built with TailwindCSS
- Mobile-responsive design
- SEO-optimized (meta tags, sitemaps, Open Graph)
- 30+ seed articles across all sites

### ✅ Unified Cloudflare Worker
- Newsletter signup (`/api/newsletter`)
- Affiliate redirect tracking (`/r`)
- Contact form (`/api/contact`)
- Analytics dashboard (`/api/analytics`)

### ✅ D1 Database (SQLite)
- 9 tables (articles, subscribers, analytics, affiliates, services, bookings, etc.)
- Ready-to-run migrations (`001_init.sql`)
- Seed data included

### ✅ Affiliate Integration (6 Networks)
- Amazon Associates (3-10% commission)
- Booking.com Partners (25% commission)
- Agoda (4-7% commission)
- GetYourGuide (8% commission)
- SafetyWing (10% commission)
- Airalo (10% commission)

### ✅ Compliance Built-In
- FTC affiliate disclosures (every article)
- POPIA privacy compliance (South Africa)
- GDPR-ready (EU visitors)
- Stripe for payments

### ✅ Automation Scripts
- One-command deployment (`npm run deploy`)
- Interactive setup wizard (`node scripts/install.js`)
- Article generator (Markdown → HTML)
- Sitemap generator
- Database seeding

---

## 📋 Pre-Deployment Checklist (Do at Home)

- [ ] **Cloudflare Account**: Sign up at https://dash.cloudflare.com
- [ ] **Get Account ID**: Dashboard → Copy Account ID (32-char hex)
- [ ] **Create API Token**: User Profile → API Tokens → Create Token (minimum: "Edit Cloudflare Workers" scope)
- [ ] **Affiliate IDs** (gather these):
  - [ ] Amazon Associates: https://associates.amazon.com (get tag like `yourtag-20`)
  - [ ] Booking.com: https://commission.booking.com/partners (get `aid=...`)
  - [ ] Agoda: https://affiliates.agoda.com (get `aff=...`)
  - [ ] GetYourGuide: https://affiliate.getyourguide.com (get `partner_id`)
  - [ ] SafetyWing: https://safetywing.com/partners (get code)
  - [ ] Airalo: https://affiliate.airalo.com (get referral code)
- [ ] **Stripe Account**: https://stripe.com (for VaughnSterling.com services)
- [ ] **South African ID Number**: You'll need this for tax/SARS
- [ ] **Git repo pushed**: All code committed and on GitHub/GitLab
- [ ] **Clone locally**: `git clone <repo> && cd T3`

---

## ⏱️ 4-6 Hour Internet Café Deployment

### Step 1: Install & Configure (30 min)

```bash
# Install dependencies
npm install

# Run interactive setup wizard
node scripts/install.js

# Follow prompts:
# → Site to deploy: "all" (or choose one)
# → CF_ACCOUNT_ID: <paste from Cloudflare>
# → CF_API_TOKEN: <paste your API token>
# → D1 database name: "vaughn-main-db" (or your choice)
# → Affiliate tags: <paste from each network>
# → Stripe secret: <if using payments>
# → Contact email: your@email.com
#
# → Install dependencies? y
# → Run npm seed? y
# → Build all sites? y
# → Deploy worker? y (optional, can skip if timing tight)
```

**Output**: `.env` file created + `wrangler.toml` generated

### Step 2: Create D1 Database (10 min)

```bash
# Go to Cloudflare Dashboard
# https://dash.cloudflare.com/?to=/:account/databases

# Click: Create Database
# Name: vaughn-main-db
# Wait for creation
# Copy the Database ID (UUID)

# Edit wrangler.toml and add the ID:
# [[d1_databases]]
# binding = "DB"
# id = "12345678-1234-1234-1234-123456789012"
```

### Step 3: Run Migrations & Seed (10 min)

```bash
# Run D1 migrations
npx wrangler d1 execute vaughn-main-db --file=migrations/001_init.sql --env production

# Verify tables created
npx wrangler d1 execute vaughn-main-db --command "SELECT name FROM sqlite_master WHERE type='table'" --env production

# Seed initial data
npm run seed

# Verify data loaded
npx wrangler d1 execute vaughn-main-db --command "SELECT COUNT(*) as article_count FROM articles" --env production
```

### Step 4: Build Content (30 min)

```bash
# Build article indices and static pages for all sites
npm run build:index:swanky
npm run build:articles:swanky
npm run sitemap:swanky

npm run build:index:tours
npm run build:articles:tours
npm run sitemap:tours

npm run build:index:brand
npm run build:articles:brand
npm run sitemap:brand
```

### Step 5: Deploy Worker (10 min)

```bash
# Authenticate with Cloudflare
npx wrangler login

# Deploy Worker (handles newsletter, affiliates, analytics)
npx wrangler deploy --env production

# Test it
curl "https://your-worker.dev/api/newsletter" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "site": "swankyboyz"}'
# Should return: {"ok": true}
```

### Step 6: Build & Deploy to Cloudflare Pages (60 min)

```bash
# Build each Astro site
npm --prefix apps/swankyboyz install && npm --prefix apps/swankyboyz run build
npm --prefix apps/vaughnsterlingtours install && npm --prefix apps/vaughnsterlingtours run build
npm --prefix apps/vaughnsterling install && npm --prefix apps/vaughnsterling run build

# Push to GitHub
git add .
git commit -m "Deploy: all sites ready for Pages"
git push origin main

# Go to Cloudflare Dashboard
# https://dash.cloudflare.com/?to=/:account/pages

# Create 3 projects:
# 1. swankyboyz
#    - Connect GitHub repo
#    - Build command: npm run build
#    - Build output: apps/swankyboyz/dist/
#
# 2. vaughnsterlingtours
#    - Build command: npm run build
#    - Build output: apps/vaughnsterlingtours/dist/
#
# 3. vaughnsterling
#    - Build command: npm run build
#    - Build output: apps/vaughnsterling/dist/

# Wait for builds (~2-5 min each)
```

### Step 7: Add Custom Domains (20 min)

```bash
# For each project in Cloudflare Pages:
# 1. Settings → Domains
# 2. Add custom domain
# 3. Enter: swankyboyz.com (or vaughnsterlingtours.com, etc.)
# 4. DNS auto-configures

# Verify DNS propagation (5 min)
# Go to: https://swankyboyz.com (should load)
```

### Step 8: Test Everything (30 min)

```bash
# 1. Site loads
https://swankyboyz.com
https://vaughnsterlingtours.com
https://vaughnsterling.com

# 2. Articles load
https://swankyboyz.com/articles/

# 3. Affiliate links work (click one, check redirect)
https://swankyboyz.com/articles/luxury-watches-under-500.html

# 4. Newsletter signup works
curl "https://swankyboyz.com/api/newsletter" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "yourtest@email.com", "site": "swankyboyz"}'

# 5. Check D1 data
npx wrangler d1 execute vaughn-main-db \
  --command "SELECT * FROM subscribers WHERE email='yourtest@email.com'"
# Should return: {email: "yourtest@email.com", site: "swankyboyz"}

# 6. Test affiliate redirect
curl "https://swankyboyz.com/r?site=swankyboyz&id=watch-xyz&href=https%3A%2F%2Famazon.com" \
  -L -v
# Should 302 redirect with ?tag=yourtag-20 appended
```

---

## 🎯 Post-Deployment (Next 48 Hours)

- [ ] Verify all three sites loading HTTPS
- [ ] Test each article page loads correctly
- [ ] Click affiliate link → verify redirect works
- [ ] Check D1: `SELECT COUNT(*) FROM analytics WHERE event='affiliate_click'`
- [ ] Sign up for newsletter → check D1 subscriber table
- [ ] Set up Google Analytics (get ID, add to articles)
- [ ] Add to domain DNS: MX records for email (if using)
- [ ] Test Stripe payment (if VaughnSterling.com)

---

## 📊 Key Commands

```bash
# Setup & Deploy
npm install                   # Install all deps
node scripts/install.js       # Interactive setup
npm run deploy               # One-command deploy (all steps)

# Build
npm run seed                 # Seed databases
npm run build:articles:swanky # Generate articles
npm run sitemap:swanky       # Generate sitemaps
npm run build:all            # Build all Astro sites

# Database
npm run db:migrate          # Run migrations
npm run db:query "SELECT * FROM articles LIMIT 1"
npm run analytics:summary    # Analytics overview

# Deployment
npm run worker:deploy       # Deploy Worker only
npx wrangler tail          # Watch Worker logs
npm run deploy:dry-run     # Preview deployment
```

---

## 🔧 Troubleshooting

### "wrangler: command not found"
```bash
npm install -g wrangler
```

### "CF_ACCOUNT_ID is not valid"
```bash
# Get correct ID from:
# https://dash.cloudflare.com/
# Look for "Account ID" in sidebar
```

### "D1 database not found"
```bash
# Create it first:
# https://dash.cloudflare.com/?to=/:account/databases
# Then update wrangler.toml with the ID
```

### "npm install fails at café"
```bash
# Use npm ci (faster, better for slow connections)
npm ci
```

### "Affiliate links not redirecting"
```bash
# Check Worker is deployed:
npx wrangler tail

# Check D1 analytics table has records:
npx wrangler d1 execute vaughn-main-db --command "SELECT * FROM analytics LIMIT 5"
```

### "Pages build failing"
```bash
# Check build logs in Pages UI
# Common causes:
# - npm install failed (node_modules missing)
# - Build command wrong
# - Output directory doesn't exist
```

---

## 💰 Revenue Tracking

All affiliate clicks and conversions are logged in D1. Query anytime:

```bash
# All affiliate clicks
npx wrangler d1 execute vaughn-main-db \
  --command "SELECT affiliate_network, COUNT(*) FROM analytics WHERE event='affiliate_click' GROUP BY affiliate_network"

# Clicks per article
npx wrangler d1 execute vaughn-main-db \
  --command "SELECT article_slug, COUNT(*) FROM analytics WHERE event='affiliate_click' GROUP BY article_slug ORDER BY COUNT(*) DESC"

# Newsletter signups
npx wrangler d1 execute vaughn-main-db \
  --command "SELECT COUNT(*) as subscribers FROM subscribers"

# Revenue estimate (manual, based on network rates)
# - Amazon clicks × 2% conversion × R500 avg = estimate
# - Booking clicks × 0.5% conversion × R1,500 avg = estimate
```

---

## 📝 Documentation

- **DEPLOY.md** — Step-by-step deployment guide (this file, detailed)
- **COMPLIANCE.md** — Tax, POPIA, affiliate compliance (South African focus)
- **PROJECT_SUMMARY.md** — What's built, features, architecture
- **WRANGLER_FIX.md** — How the Wrangler error was fixed
- **README.md** — Original project README

---

## 🚨 Important: Before Going Live

1. **Tax Registration** (SARS)
   - Register as self-employed: https://www.sars.gov.za/
   - Use ITR12 form for income tax
   - You have 21 days from first income to register

2. **Affiliate Disclosures**
   - All articles have FTC disclaimers (already done ✅)
   - But verify they're visible on your live site

3. **Data Privacy (POPIA)**
   - Privacy policy on all sites (already drafted ✅)
   - Unsubscribe link on all emails (built into worker ✅)
   - 90-day data retention (auto-cleanup in analytics)

4. **Exchange Control (SARB)**
   - Use Wise for affiliate remittances (1.5% fee vs 4-8% from banks)
   - Document source of funds (keep affiliate statements)

---

## 🎯 Success Metrics (Track These)

### Week 1
- [ ] 100+ visitors across all sites
- [ ] 20+ newsletter signups
- [ ] 10+ affiliate clicks
- [ ] 0 deployment errors

### Week 2-4
- [ ] 500+ total visitors
- [ ] 50+ newsletter subscribers
- [ ] 50+ affiliate clicks
- [ ] First affiliate commission (if lucky)

### Month 1-3
- [ ] 1,000+ visitors
- [ ] 200+ newsletter subscribers
- [ ] 100+ affiliate clicks
- [ ] R500-R5,000 affiliate revenue
- [ ] 1-2 freelance client inquiries

---

## 🚀 Next Steps (After Deployment)

### Days 1-7: Verify & Monitor
- [ ] Check all sites load correctly
- [ ] Monitor D1 analytics for clicks/signups
- [ ] Test affiliate payouts (check each network)
- [ ] Set up Google Analytics

### Week 2: Content & Marketing
- [ ] Add more articles (run `node scripts/generate.js`)
- [ ] Share on social media (Twitter, Reddit, LinkedIn)
- [ ] Email friends + network (personal outreach)
- [ ] Build email sequences (welcome, nurture, conversion)

### Week 3-4: Optimization
- [ ] Analyze which articles get most clicks
- [ ] Double down on high-performing affiliates
- [ ] A/B test CTA buttons (colors, text)
- [ ] Improve CTR (click-through rate)

### Month 2+: Scale
- [ ] Generate 50+ new articles
- [ ] Launch paid services (VaughnSterling.com)
- [ ] Build email list to 500+ subscribers
- [ ] Target niche keywords in each site

---

## 💬 Questions?

See documentation:
- **DEPLOY.md** — Deployment steps
- **COMPLIANCE.md** — Tax & legal
- **PROJECT_SUMMARY.md** — Architecture
- **WRANGLER_FIX.md** — Technical details

---

## ✅ You're Ready!

Everything is built and configured. Follow DEPLOY.md step-by-step (4-6 hours), and you'll be live with:
- ✅ Three production sites
- ✅ Affiliate tracking
- ✅ Newsletter system
- ✅ Analytics
- ✅ HTTPS + custom domains
- ✅ Free tier (Cloudflare Pages + D1 + Workers)

**Your next step**: 

```bash
node scripts/install.js
```

**Then follow DEPLOY.md.**

Good luck! The road from R0 to R15,000+/month starts now. 🇿🇦 → 🇹🇭

---

**Built with ❤️ for your journey. Made in ☕ (internet café compatible).**
