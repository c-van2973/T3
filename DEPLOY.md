# 🚀 Quick Start Deploy Guide (4-6 Hours at Café)

> **Time estimate**: 4-6 hours on stable internet (internet café or library)

---

## Prerequisites Checklist
Before you start, make sure you have:

```bash
# 1. Clone repo to local machine
git clone <your-repo-url> && cd T3

# 2. Install dependencies (15 min)
npm install

# 3. Create Cloudflare account (5 min)
# → Go to https://dash.cloudflare.com/sign-up
# → Get account ID from Dashboard
# → Create API token (User Profile → API Tokens)

# 4. Prepare affiliate IDs (5 min, gather these before café visit)
# → Amazon: associates.amazon.com (get affiliate tag: yourtag-20)
# → Booking.com: commission.booking.com/partners (get aid)
# → Agoda: affiliates.agoda.com (get aff ID)
# → GetYourGuide: affiliate.getyourguide.com (get partner_id)
# → SafetyWing: safetywing.com/partners
# → Airalo: affiliate.airalo.com (get referral code)
# → Stripe: stripe.com (get secret key)

# 5. Get your South African ID number (for tax/SARS)
```

---

## ☕ At the Internet Café (4-6 Hours)

### Phase 1: Configuration (30 min)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Run interactive installer
node scripts/install.js

# Follow prompts:
# → Choose: "all" (to configure all three sites)
# → Enter: CF_ACCOUNT_ID (from Cloudflare Dashboard)
# → Enter: CF_API_TOKEN (from API Tokens)
# → Enter: D1 database name (e.g., "vaughn-main-db")
# → Enter: Affiliate tags (Amazon, Booking, Agoda, etc.)
# → Enter: OpenAI API key (for content generation, optional)
# → Enter: Stripe secret key
# → Enter: Contact email

# This will:
# - Create .env file with all secrets
# - Generate wrangler.toml for each site
# - Optionally run npm install, seed, builds
```

### Phase 2: Database Setup (15 min)

```bash
# 1. Create D1 database in Cloudflare Dashboard
# → Go to https://dash.cloudflare.com/?to=/:account/databases
# → Click "Create Database"
# → Name: vaughn-main-db (or your chosen name)
# → Note the database ID (UUID)

# 2. Update wrangler.toml with database ID
# Edit wrangler.toml and set:
# [[d1_databases]]
# id = "your-database-id-here"

# 3. Run migrations
npx wrangler d1 execute vaughn-main-db --file=migrations/001_init.sql --env production

# 4. Seed initial data
npm run seed
```

### Phase 3: Build Content (45 min)

```bash
# 1. Build article index
npm run build:index:swanky

# 2. Generate static article pages
npm run build:articles:swanky

# 3. Generate sitemaps
npm run sitemap:swanky

# Repeat for other sites (optional):
# npm run build:index:vaughnsterlingtours
# npm run build:articles:vaughnsterlingtours
# npm run sitemap:vaughnsterlingtours
```

### Phase 4: Deploy Worker (15 min)

```bash
# 1. Authenticate with Cloudflare
npx wrangler login

# 2. Deploy Worker (handles newsletter, affiliates, analytics)
npx wrangler deploy --env production

# Verification:
curl "https://your-worker.dev/api/newsletter" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "site": "swankyboyz"}'
# Expected response: {"ok": true}
```

### Phase 5: Prepare for Pages Deployment (30 min)

```bash
# 1. Build each site (Astro)
cd apps/swankyboyz && npm install && npm run build && cd ../..
cd apps/vaughnsterlingtours && npm install && npm run build && cd ../..
cd apps/vaughnsterling && npm install && npm run build && cd ../..

# 2. Verify builds created dist/ folders
ls apps/swankyboyz/dist/
ls apps/vaughnsterlingtours/dist/
ls apps/vaughnsterling/dist/

# 3. Push to GitHub (if using auto-deploy)
git add .
git commit -m "Pre-deployment: seeds + articles + builds"
git push origin main
```

### Phase 6: Deploy to Cloudflare Pages (60 min)

**Option A: Auto-deploy from GitHub (Recommended)**
```bash
# 1. Go to https://dash.cloudflare.com/?to=/:account/pages
# 2. Click "Create a project"
# 3. Connect GitHub repo
# 4. Create project for each site:

# Project 1: swankyboyz
# - Production branch: main
# - Build command: npm run build
# - Build output directory: apps/swankyboyz/dist/
# - Environment: Add vars from .env (AMAZON_ASSOCIATE_TAG, etc.)

# Project 2: vaughnsterlingtours
# - Build command: npm run build
# - Build output directory: apps/vaughnsterlingtours/dist/

# Project 3: vaughnsterling
# - Build command: npm run build
# - Build output directory: apps/vaughnsterling/dist/

# 5. Wait for builds to complete (2-5 min each)
# 6. Test each site in browser
```

**Option B: Manual deployment (if no GitHub)**
```bash
# Deploy each site using wrangler pages publish
cd apps/swankyboyz/dist
npx wrangler pages publish . --project-name=swankyboyz
cd ../..

cd apps/vaughnsterlingtours/dist
npx wrangler pages publish . --project-name=vaughnsterlingtours
cd ../..

cd apps/vaughnsterling/dist
npx wrangler pages publish . --project-name=vaughnsterling
cd ../..
```

### Phase 7: Add Custom Domains (30 min)

```bash
# In Cloudflare Dashboard for each Pages project:
# 1. Go to Project Settings → Domains
# 2. Click "Add a custom domain"
# 3. Enter domain name
# 4. Follow DNS setup (usually auto-configured)

# Domains:
# - swankyboyz.com → swankyboyz Pages project
# - vaughnsterlingtours.com → vaughnsterlingtours Pages project
# - vaughnsterling.com → vaughnsterling Pages project

# DNS records (should auto-configure):
# CNAME yourdomain.com → yourdomain.pages.dev
```

### Phase 8: Testing & Verification (30 min)

```bash
# 1. Test affiliate redirects
curl "https://swankyboyz.com/r?site=swankyboyz&id=watch-xyz&href=https%3A%2F%2Famazon.com"
# Should 302 redirect to Amazon with ?tag=yourtag-20

# 2. Test newsletter signup
curl "https://swankyboyz.com/api/newsletter" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "site": "swankyboyz"}'
# Should return: {"ok": true}

# 3. Query D1 analytics
npx wrangler d1 execute vaughn-main-db --command "SELECT COUNT(*) as count FROM analytics LIMIT 10"

# 4. Visit each site in browser
# https://swankyboyz.com
# https://vaughnsterlingtours.com
# https://vaughnsterling.com

# 5. Test article pages
# https://swankyboyz.com/articles/index.html
# Click on article → should load with affiliate links

# 6. Click affiliate link
# Should redirect through /r endpoint
# Check D1: analytics table should have click record
```

---

## Command Cheat Sheet

```bash
# One-command deploy (if everything is set up)
npm run deploy

# Alternative: Build + deploy separately
npm run seed                 # Seed databases
npm run build:index:swanky   # Build article index
npm run build:articles:swanky # Generate static pages
npm run sitemap:swanky       # Generate sitemaps
npx wrangler deploy          # Deploy Worker
npx wrangler pages publish   # Deploy to Pages (manual)

# Verification
npx wrangler tail            # Watch Worker logs live
npm run db:query "SELECT COUNT(*) FROM articles"
npm run analytics:summary    # Get analytics overview
```

---

## Troubleshooting

### "Missing entry-point to Worker script"
**Fix:** Ensure `wrangler.toml` has correct path:
```toml
main = "../../workers/newsletter/index.js"
```

### "D1 database not found"
**Fix:** Create database in Cloudflare Dashboard first:
1. https://dash.cloudflare.com/?to=/:account/databases
2. Click "Create Database"
3. Name: vaughn-main-db
4. Get the ID
5. Update wrangler.toml with `id = "..."`

### "Affiliate links not tracking"
**Fix:** Check D1 analytics table:
```bash
npx wrangler d1 execute vaughn-main-db --command "SELECT * FROM analytics LIMIT 5"
```
If empty, Worker may not be deployed correctly.

### "npm install fails at café"
**Fix:** Use npm ci (faster, better for CI/CD):
```bash
npm ci  # Instead of npm install
```

### "Build takes too long"
**Fix:** Skip dev server, build only:
```bash
npm run build         # Instead of npm run dev
npm run build:swanky  # Build just one site
```

---

## Post-Launch Checklist (After Deployment)

- [ ] All three sites loading in browser (HTTPS enabled)
- [ ] Articles visible with affiliate links
- [ ] Newsletter signup works (test: submit email, check D1)
- [ ] Affiliate redirect works (click link, see redirect in browser console)
- [ ] D1 analytics populated with clicks
- [ ] Custom domains set up (not .pages.dev)
- [ ] Google Analytics tracking (set GA ID in articles)
- [ ] Stripe test transaction (if VaughnSterling.com)
- [ ] Social media links working
- [ ] Contact form submitting (check email/D1)

---

## Time Budget

| Phase | Time | Notes |
|---|---|---|
| Setup & config | 30 min | Installing deps, running installer |
| DB migrations | 15 min | D1 setup, migrations, seeding |
| Content build | 45 min | Building articles, sitemaps |
| Worker deploy | 15 min | Wrangler deploy |
| Pages prepare | 30 min | Building each site's dist/ |
| Pages deploy | 60 min | Creating projects, waiting for builds |
| Domains | 30 min | Adding custom domains |
| Testing | 30 min | Verification + troubleshooting |
| **TOTAL** | **~255 min (4.25 hrs)** | Buffer: 30-60 min for issues |

---

## Next Steps (After Deployment)

### Week 1
- [ ] Monitor analytics (D1 + Cloudflare)
- [ ] Test affiliate payouts (make test purchases)
- [ ] Verify Google Analytics (check traffic)
- [ ] Fine-tune article CTAs based on clicks

### Week 2-4
- [ ] Generate more content (run `node scripts/generate.js`)
- [ ] Set up email automation (ConvertKit / Substack)
- [ ] Social media content calendar
- [ ] Affiliate link A/B testing

### Month 2-3
- [ ] Optimize high-performing articles
- [ ] Double down on best-converting affiliate networks
- [ ] Launch paid services (VaughnSterling.com)
- [ ] Build email list (500+ subscribers)

---

## Revenue Math (Conservative)

If you get 1,000 visitors/day at launch:
- **2% click affiliate links** = 20 clicks/day
- **0.5% convert** = 0.1 conversions/day (3/month)
- **Avg affiliate commission**: R500 per conversion
- **Monthly**: 3 × R500 = **R1,500**
- **Plus freelance**: 1 client × R8,000 = **R9,000**
- **Monthly total: ~R10,500** (growing)

Target Month 3: R20,000-30,000 (with content + marketing push)

---

## Questions?

Keep this guide open while deploying. Reference specific sections as needed. Each section is self-contained and can be debugged independently.

**Good luck! 🚀**
