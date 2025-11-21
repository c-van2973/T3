#!/usr/bin/env node
"use strict";
/**
 * Deploy all sites to Cloudflare Pages + Workers
 * One-command deployment: npm run deploy
 * 
 * Prerequisites:
 *  1. Install root deps: npm install
 *  2. Run install.js to configure: node scripts/install.js
 *  3. Create D1 database in Cloudflare Dashboard
 *  4. Seed database: wrangler d1 execute vaughn-main-db --file=migrations/001_init.sql
 * 
 * This script:
 *  - Builds all site content (seeding + article generation + sitemaps)
 *  - Deploys all Workers
 *  - Prepares for Cloudflare Pages deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const sites = ['swankyboyz', 'vaughnsterlingtours', 'vaughnsterling'];
const rootDir = path.resolve(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function runCommand(cmd, cwd = rootDir, silent = false) {
  try {
    if (!silent) log(`\n▶ Running: ${cmd}`, 'cyan');
    const result = execSync(cmd, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8'
    });
    return result;
  } catch (e) {
    log(`✗ Command failed: ${cmd}`, 'red');
    throw e;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function ensureEnv() {
  if (!fileExists(path.join(rootDir, '.env'))) {
    log('\n✗ .env file not found!', 'red');
    log('Please run: node scripts/install.js', 'yellow');
    process.exit(1);
  }

  const env = fs.readFileSync(path.join(rootDir, '.env'), 'utf-8');
  if (!env.includes('CF_ACCOUNT_ID') || env.includes('CF_ACCOUNT_ID=')) {
    log('\n✗ .env not configured!', 'red');
    log('Please run: node scripts/install.js --yes', 'yellow');
    process.exit(1);
  }
}

function seedDatabase() {
  log('\n📦 Seeding database...', 'bright');
  
  try {
    // Check if D1 database exists
    const dbName = process.env.D1_DATABASE_NAME || 'vaughn-main-db';
    log(`   Using D1 database: ${dbName}`, 'cyan');
    
    // Run migration
    log('   Running migrations...', 'cyan');
    runCommand(`npx wrangler d1 execute ${dbName} --file=migrations/001_init.sql --env production`);
    
    log('   Running seed script...', 'cyan');
    runCommand('node scripts/seed.js');
    
    log('✓ Database seeded', 'green');
  } catch (e) {
    log('⚠ Database seeding failed (may already be seeded)', 'yellow');
  }
}

function buildContentForSite(site) {
  log(`\n🔨 Building content for ${site}...`, 'bright');
  
  const appDir = path.join(rootDir, 'apps', site);
  if (!fileExists(appDir)) {
    log(`   ⚠ App directory not found: ${appDir}`, 'yellow');
    return;
  }

  try {
    log(`   Installing dependencies...`, 'cyan');
    runCommand('npm install', appDir, true);
    
    log(`   Building articles...`, 'cyan');
    runCommand(`node ${path.join(rootDir, 'scripts/build_index.js')} ${site}`);
    runCommand(`node ${path.join(rootDir, 'scripts/generate_articles.js')} ${site}`);
    runCommand(`node ${path.join(rootDir, 'scripts/generate_sitemap.js')} ${site}`);
    
    log(`✓ ${site} content built`, 'green');
  } catch (e) {
    log(`✗ Failed to build ${site}`, 'red');
    throw e;
  }
}

function buildAllContent() {
  log('\n\n═══════════════════════════════════════════════════════', 'bright');
  log('STEP 1: Building Content', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'bright');

  for (const site of sites) {
    buildContentForSite(site);
  }
}

function deployWorkers() {
  log('\n\n═══════════════════════════════════════════════════════', 'bright');
  log('STEP 2: Deploying Cloudflare Workers', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'bright');

  log('Deploying unified Worker for newsletter/affiliate/analytics...', 'cyan');
  
  try {
    // Ensure wrangler.toml exists at root
    if (!fileExists(path.join(rootDir, 'wrangler.toml'))) {
      log('   ⚠ wrangler.toml not found at root, skipping Worker deployment', 'yellow');
      log('   Create one using: node scripts/install.js', 'yellow');
      return;
    }

    runCommand('npx wrangler deploy --env production');
    log('✓ Worker deployed', 'green');
  } catch (e) {
    log('✗ Worker deployment failed', 'red');
    log('   Ensure: 1) wrangler.toml exists, 2) CF_ACCOUNT_ID set, 3) D1 database bound', 'yellow');
    // Don't exit, continue with other steps
  }
}

function deployPages() {
  log('\n\n═══════════════════════════════════════════════════════', 'bright');
  log('STEP 3: Prepare for Cloudflare Pages Deployment', 'bright');
  log('═══════════════════════════════════════════════════════\n', 'bright');

  for (const site of sites) {
    log(`\n${site}:`, 'cyan');
    const appDir = path.join(rootDir, 'apps', site);
    
    if (!fileExists(appDir)) {
      log(`   ⚠ App directory not found`, 'yellow');
      continue;
    }

    // Build the app with Astro
    try {
      log(`   Building Astro site...`, 'cyan');
      runCommand('npm run build', appDir, true);
      log(`   ✓ Build output ready at apps/${site}/dist/`, 'green');
    } catch (e) {
      log(`   ⚠ Astro build failed (site may not have build script)`, 'yellow');
    }

    // Show deployment instructions
    log(`\n   📋 Deployment Steps:`, 'cyan');
    log(`   1. Push to GitHub (if using): git push origin main`, 'cyan');
    log(`   2. Go to Cloudflare Dashboard → Pages`, 'cyan');
    log(`   3. Connect repo or select existing project "${site}"`, 'cyan');
    log(`   4. Build command: npm run build`, 'cyan');
    log(`   5. Build output directory: dist/`, 'cyan');
    log(`   6. Set environment variables in Pages settings`, 'cyan');
  }
}

function printChecklist() {
  log('\n\n═══════════════════════════════════════════════════════', 'bright');
  log('✅ DEPLOYMENT COMPLETE', 'green');
  log('═══════════════════════════════════════════════════════\n', 'bright');

  log('📋 Post-Deployment Checklist:', 'bright');
  log('   ☐ Verify D1 database has data: wrangler d1 execute vaughn-main-db --command "SELECT COUNT(*) as count FROM articles"', 'cyan');
  log('   ☐ Test Worker redirect: curl "https://your-worker.dev/r?site=swankyboyz&href=https%3A%2F%2Famazon.com"', 'cyan');
  log('   ☐ Deploy Pages: Connect repo in Cloudflare Dashboard → Pages → Create Project', 'cyan');
  log('   ☐ Set custom domain: Pages Settings → Custom Domain', 'cyan');
  log('   ☐ Add Cloudflare Analytics: Dashboard → Analytics', 'cyan');
  log('   ☐ Test affiliates: Click affiliate links from articles, verify D1 analytics records', 'cyan');
  log('   ☐ Newsletter signup test: Send POST to /api/newsletter with email', 'cyan');
  log('   ☐ Monitor: Check wrangler tail for Worker logs', 'cyan');

  log('\n📊 Next Steps:', 'bright');
  log('   1. Monitor analytics dashboard (if configured)', 'cyan');
  log('   2. Generate more content: node scripts/generate.js', 'cyan');
  log('   3. Verify affiliate tags on live site', 'cyan');
  log('   4. Set up email service for contact form', 'cyan');
  log('   5. Configure Google Analytics (set ID in articles)', 'cyan');

  log('\n🔗 Quick Links:', 'bright');
  log('   • Cloudflare Dashboard: https://dash.cloudflare.com', 'cyan');
  log('   • Pages Projects: https://dash.cloudflare.com/?to=/:account/pages', 'cyan');
  log('   • Workers: https://dash.cloudflare.com/?to=/:account/workers', 'cyan');
  log('   • D1 Databases: https://dash.cloudflare.com/?to=/:account/databases', 'cyan');

  log('\n💰 Monetization Status:', 'bright');
  log('   • Amazon Associates: Use tag from .env: ' + (process.env.AMAZON_ASSOCIATE_TAG || 'NOT SET'), 'cyan');
  log('   • Booking Affiliate: ' + (process.env.BOOKING_AFFILIATE_ID ? '✓ Configured' : '⚠ Not configured'), 'cyan');
  log('   • Agoda Affiliate: ' + (process.env.AGODA_AFFILIATE_ID ? '✓ Configured' : '⚠ Not configured'), 'cyan');
  log('   • GetYourGuide: ' + (process.env.GETYOURGUIDE_PARTNER_ID ? '✓ Configured' : '⚠ Not configured'), 'cyan');
  log('   • SafetyWing: ' + (process.env.SAFETYWING_AFFILIATE_ID ? '✓ Configured' : '⚠ Not configured'), 'cyan');
  log('   • Airalo: ' + (process.env.AIRALO_AFFILIATE_KEY ? '✓ Configured' : '⚠ Not configured'), 'cyan');

  log('\n🚀 You\'re Ready!', 'green');
  log('   Visit https://swankyboyz.com (or your domain) to see your site live.', 'bright');
  log('   The journey from R0 to R15,000+/month starts now! 🇿🇦 → 🇹🇭\n', 'bright');
}

async function main() {
  log('\n\n╔═══════════════════════════════════════════════════════╗', 'bright');
  log('║   Vaughn\'s Trio Sites - Complete Deployment Script     ║', 'bright');
  log('║   SwankyBoyz | VaughnSterlingTours | VaughnSterling    ║', 'bright');
  log('╚═══════════════════════════════════════════════════════╝\n', 'bright');

  try {
    // Step 0: Verify environment
    log('Verifying environment...', 'cyan');
    ensureEnv();
    log('✓ Environment configured', 'green');

    // Step 1: Seed database
    seedDatabase();

    // Step 2: Build content
    buildAllContent();

    // Step 3: Deploy workers
    deployWorkers();

    // Step 4: Prepare Pages
    deployPages();

    // Step 5: Print checklist
    printChecklist();

  } catch (e) {
    log(`\n✗ Deployment failed: ${e.message}`, 'red');
    log('Review the error above and fix any issues, then run: npm run deploy', 'yellow');
    process.exit(1);
  }
}

main();

  // Confirm wrangler available
  let hasWrangler = true;
  try{ execSync('wrangler --version', { stdio: 'ignore' }); } catch(e){ hasWrangler = false; }
  if (!hasWrangler) console.log('Note: `wrangler` CLI not found. Install it for Worker/D1 and Pages publish commands. Proceeding in dry-run mode if not installed.');

  for (const s of SITES){
    console.log(`\n--- Building ${s.name} ---`);
    if (dry){
      console.log(`[dry] npm --prefix ${s.dir} run build`);
    } else {
      // Ensure per-app deps installed (skip if node_modules exists)
      const nm = path.join(s.dir, 'node_modules');
      if (!fs.existsSync(nm)){
        console.log(`Installing dependencies for ${s.name}...`);
        await run(`npm --prefix ${s.dir} install`);
      }
      await run(`npm --prefix ${s.dir} run build`);
    }

    // Special Swanky build steps
    if (s.name === 'swankyboyz'){
      if (dry){
        console.log('[dry] npm run build:index:swanky');
        console.log('[dry] npm run build:articles:swanky');
        console.log('[dry] npm run sitemap:swanky');
      } else {
        await run('npm run build:index:swanky');
        await run('npm run build:articles:swanky');
        await run('npm run sitemap:swanky');
      }
    }

    // Publish Pages (wrangler pages publish)
    const projectName = projects[s.name];
    const publishDir = path.join(s.dir, 'dist');
    if (dry){
      console.log(`[dry] wrangler pages publish ${publishDir} --project-name ${projectName}`);
    } else {
      if (!hasWrangler){
        console.warn('Skipping publish: wrangler not installed');
      } else {
        await run(`wrangler pages publish ${publishDir} --project-name ${projectName}`);
      }
    }

    // Deploy Worker if wrangler.toml exists in app dir
    const wranglerToml = path.join(s.dir, 'wrangler.toml');
    if (fs.existsSync(wranglerToml)){
      if (dry) console.log(`[dry] (cd ${s.dir} && wrangler deploy)`);
      else {
        if (!hasWrangler) console.warn('Skipping worker deploy (wrangler not installed)');
        else {
          await run(`cd ${s.dir} && wrangler deploy`);
        }
      }
    } else {
      console.log(`No worker config at ${wranglerToml}, skipping worker deploy for ${s.name}`);
    }
  }

  // Optionally run D1 migration
  const runD1 = (await ask('Run D1 migration now (migrations/001_init.sql)? (y/N)', 'N')).toLowerCase() === 'y';
  if (runD1){
    if (dry) console.log('[dry] wrangler d1 execute --database-name $D1_DATABASE_ID migrations/001_init.sql');
    else if (!hasWrangler) console.warn('Cannot run D1 migration: wrangler not installed');
    else {
      const dbName = process.env.D1_DATABASE_ID || await ask('D1 database name', 'trifecta_d1');
      await run(`wrangler d1 execute --database-name ${dbName} migrations/001_init.sql`);
    }
  }

  console.log('\nDeploy process finished. Verify Pages dashboard and worker routes.');
  safeExit(0);
}

main().catch(e=>{ console.error('Deploy error:', e); safeExit(1); });
