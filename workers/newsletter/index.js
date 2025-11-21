// Cloudflare Worker: Unified handler for newsletter, affiliate redirects, contact forms
// Handles:
//  - POST /api/newsletter → D1 subscriber insert + analytics
//  - GET /r?site=X&id=Y&href=Z → affiliate redirect with tag injection + click tracking
//  - POST /api/contact → contact form submission
//  - GET /api/analytics → (private, needs auth) analytics dashboard data
//
// Expects binding `DB` (Cloudflare D1) configured in wrangler.toml

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Route: /r - Affiliate redirect with tracking
    if (url.pathname === '/r' && request.method === 'GET') {
      return handleAffiliateRedirect(url, env, ctx);
    }

    // Route: /api/newsletter - Newsletter signup
    if ((url.pathname === '/.netlify/functions/newsletter' || url.pathname === '/api/newsletter') && request.method === 'POST') {
      return handleNewsletterSignup(request, env, ctx);
    }

    // Route: /api/contact - Contact form
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContactForm(request, env, ctx);
    }

    // Route: /api/analytics - Private analytics dashboard
    if (url.pathname === '/api/analytics' && request.method === 'GET') {
      return handleAnalyticsDashboard(url, env, ctx);
    }

    // Default: not found
    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Handle affiliate redirect: /r?site=swankyboyz&id=watch-xyz&href=https%3A%2F%2F...
 * Logs click to D1, injects affiliate tags, and redirects
 */
async function handleAffiliateRedirect(url, env, ctx) {
  try {
    const site = url.searchParams.get('site') || 'unknown';
    const productId = url.searchParams.get('id') || '';
    const encodedHref = url.searchParams.get('href') || '';
    const articleSlug = url.searchParams.get('article') || '';

    if (!encodedHref) {
      return new Response(JSON.stringify({ error: 'missing_href' }), { status: 400 });
    }

    const destUrl = decodeURIComponent(encodedHref);
    const destUrlObj = new URL(destUrl);
    const network = detectAffiliateNetwork(destUrl);

    // Inject affiliate tag based on network
    const taggedUrl = injectAffiliateTag(destUrl, network, env);

    // Add UTM parameters
    const utmUrl = new URL(taggedUrl);
    utmUrl.searchParams.set('utm_source', 'vaughn-' + site);
    utmUrl.searchParams.set('utm_medium', 'affiliate');
    utmUrl.searchParams.set('utm_campaign', productId || 'general');

    // Log analytics async (don't wait, just fire and forget)
    ctx.waitUntil(
      logAnalyticsEvent(env, {
        site,
        event: 'affiliate_click',
        affiliate_network: network,
        product_id: productId,
        article_slug: articleSlug,
        destination_url: destUrl,
        utm_source: 'vaughn-' + site,
        utm_medium: 'affiliate',
        utm_campaign: productId || 'general'
      })
    );

    // Redirect with affiliate-tagged URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': utmUrl.toString(),
        ...corsHeaders()
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders() });
  }
}

/**
 * Handle newsletter signup
 */
async function handleNewsletterSignup(request, env, ctx) {
  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();
    const site = body.site || 'swankyboyz';
    const name = body.name || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'invalid_email' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Insert into D1
    const id = crypto.randomUUID();
    const stmt = env.DB.prepare(
      'INSERT OR IGNORE INTO subscribers (id, email, site, name, source) VALUES (?, ?, ?, ?, ?)'
    );
    await stmt.bind(id, email, site, name, 'newsletter_signup').run();

    // Log analytics
    ctx.waitUntil(
      logAnalyticsEvent(env, {
        site,
        event: 'newsletter_signup',
        meta_email: email,
        meta_name: name
      })
    );

    return new Response(
      JSON.stringify({ ok: true, message: 'Successfully subscribed' }),
      { status: 200, headers: corsHeaders() }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * Handle contact form submission
 */
async function handleContactForm(request, env, ctx) {
  try {
    const body = await request.json();
    const { name, email, message, site } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'missing_fields' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Log contact inquiry to analytics
    ctx.waitUntil(
      logAnalyticsEvent(env, {
        site: site || 'vaughnsterling',
        event: 'contact_inquiry',
        meta_name: name,
        meta_email: email,
        meta_message: message.substring(0, 200)
      })
    );

    // Send email (placeholder - integrate with your email service)
    // For now, just log it and return success
    console.log(`Contact from ${email}: ${message}`);

    return new Response(
      JSON.stringify({ ok: true, message: 'Message received' }),
      { status: 200, headers: corsHeaders() }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * Analytics dashboard (requires auth token in env var)
 */
async function handleAnalyticsDashboard(url, env, ctx) {
  try {
    const authToken = url.searchParams.get('token');
    const expectedToken = env.ANALYTICS_TOKEN || 'your-secret-token';

    if (authToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const site = url.searchParams.get('site') || 'swankyboyz';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    // Query analytics from D1
    const stmt = env.DB.prepare(
      `SELECT COUNT(*) as count, affiliate_network, event FROM analytics 
       WHERE site = ? 
       GROUP BY affiliate_network, event 
       LIMIT ?`
    );
    const result = await stmt.bind(site, limit).all();

    return new Response(
      JSON.stringify({ site, data: result.results }),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * Detect affiliate network from URL
 */
function detectAffiliateNetwork(url) {
  if (url.includes('amazon.com') || url.includes('amazon.co')) return 'amazon';
  if (url.includes('booking.com')) return 'booking';
  if (url.includes('agoda.com')) return 'agoda';
  if (url.includes('getyourguide.com')) return 'getyourguide';
  if (url.includes('safetywing.com')) return 'safetywing';
  if (url.includes('airalo.com')) return 'airalo';
  if (url.includes('stripe.com') || url.includes('paypal.com')) return 'payment';
  return 'unknown';
}

/**
 * Inject affiliate tag into URL based on network
 */
function injectAffiliateTag(url, network, env) {
  const urlObj = new URL(url);

  switch (network) {
    case 'amazon':
      urlObj.searchParams.set('tag', env.AMAZON_ASSOCIATE_TAG || 'yourtag-20');
      break;
    case 'booking':
      // Booking uses aid parameter
      urlObj.searchParams.set('aid', env.BOOKING_AFFILIATE_ID || '');
      break;
    case 'agoda':
      // Agoda uses aff parameter
      urlObj.searchParams.set('aff', env.AGODA_AFFILIATE_ID || '');
      break;
    case 'getyourguide':
      // GetYourGuide uses partner_id in URL
      if (!url.includes('partner_id=')) {
        urlObj.searchParams.set('partner_id', env.GETYOURGUIDE_PARTNER_ID || '');
      }
      break;
    case 'airalo':
      urlObj.searchParams.set('referralCode', env.AIRALO_AFFILIATE_KEY || '');
      break;
    // SafetyWing and others: handled via direct link or no modification needed
  }

  return urlObj.toString();
}

/**
 * Log analytics event to D1
 */
async function logAnalyticsEvent(env, eventData) {
  try {
    const id = crypto.randomUUID();
    const stmt = env.DB.prepare(
      `INSERT INTO analytics (
        id, site, event, affiliate_network, product_id, article_slug, 
        destination_url, utm_source, utm_medium, utm_campaign
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    await stmt.bind(
      id,
      eventData.site || 'unknown',
      eventData.event || 'unknown',
      eventData.affiliate_network || null,
      eventData.product_id || null,
      eventData.article_slug || null,
      eventData.destination_url || null,
      eventData.utm_source || null,
      eventData.utm_medium || null,
      eventData.utm_campaign || null
    ).run();
  } catch (e) {
    console.error('Failed to log analytics:', e);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
