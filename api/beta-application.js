const RESEND_API_URL = 'https://api.resend.com/emails';

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function collect(data) {
  const out = {};
  for (const [key, value] of Object.entries(data || {})) {
    out[key] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

function getRequestMeta(req) {
  const forwardedFor = req.headers.get('x-forwarded-for') || '';
  const realIp = req.headers.get('x-real-ip') || '';
  const cfConnectingIp = req.headers.get('cf-connecting-ip') || '';
  const ip = (forwardedFor.split(',')[0] || realIp || cfConnectingIp || '').trim() || 'unknown';

  return {
    ip,
    forwardedFor: forwardedFor || 'unknown',
    realIp: realIp || 'unknown',
    cfConnectingIp: cfConnectingIp || 'unknown',
    requestId: req.headers.get('x-vercel-id') || req.headers.get('x-request-id') || 'unknown',
    vercelUrl: req.headers.get('x-forwarded-host') || process.env.VERCEL_URL || 'unknown',
    serverTimeIso: new Date().toISOString()
  };
}

function renderHtml(body, meta) {
  const fields = [
    ['Full name', body.full_name],
    ['Email', body.email],
    ['Printer model', body.printer_model],
    ['Firmware', body.firmware],
    ['Slicer', body.slicer],
    ['Print frequency', body.print_frequency],
    ['Why beta', body.why_beta],
    ['Test commitment', body.test_commitment],
    ['Accepted terms', body.beta_terms_accept],
    ['Risk acknowledged', body.beta_risk_ack],
    ['Submitted at (client UTC)', body.submitted_at_utc],
    ['Submitted at (server UTC)', meta.serverTimeIso],
    ['Form seconds elapsed', body.beta_form_seconds_elapsed],
    ['Source page', body.source_page],
    ['Referrer', body.meta_referrer],
    ['Platform', body.meta_platform],
    ['Language', body.meta_language],
    ['Languages', body.meta_languages],
    ['User agent', body.meta_user_agent],
    ['Screen', body.meta_screen],
    ['Viewport', body.meta_viewport],
    ['Color depth', body.meta_color_depth],
    ['Hardware concurrency', body.meta_hardware_concurrency],
    ['Device memory', body.meta_device_memory],
    ['Touch points', body.meta_touch_points],
    ['Cookie enabled', body.meta_cookie_enabled],
    ['Do Not Track', body.meta_do_not_track],
    ['Page URL', body.meta_page_url],
    ['Client fingerprint (SHA-256)', body.meta_client_fingerprint_sha256],
    ['IP (best effort)', meta.ip],
    ['Forwarded For', meta.forwardedFor],
    ['Real IP', meta.realIp],
    ['CF Connecting IP', meta.cfConnectingIp],
    ['Request ID', meta.requestId],
    ['Vercel Deployment URL', meta.vercelUrl]
  ];

  const rows = fields
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:600;vertical-align:top;">${esc(label)}</td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap;">${esc(value)}</td></tr>`)
    .join('');

  return `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#111;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New FailFixer beta application</h2>
      <p style="margin:0 0 14px;">A new beta tester form submission was received.</p>
      <table style="border-collapse:collapse;width:100%;max-width:900px;">${rows}</table>
    </div>
  `;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toAddress = process.env.BETA_TO_EMAIL || 'betatester@failfixer.com';
  const fromAddress = process.env.BETA_FROM_EMAIL || 'betatester@failfixer.com';
  const replyToAddress = process.env.BETA_REPLY_TO_EMAIL || 'betatester@failfixer.com';

  if (!apiKey) {
    return json(500, { ok: false, error: 'Email service not configured' });
  }

  let raw;
  try {
    raw = await req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON payload' });
  }

  const body = collect(raw);
  const meta = getRequestMeta(req);

  if (body.company_name) {
    return json(200, { ok: true });
  }

  const required = [
    'full_name',
    'email',
    'printer_model',
    'firmware',
    'slicer',
    'print_frequency',
    'why_beta',
    'test_commitment',
    'beta_terms_accept',
    'beta_risk_ack'
  ];

  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === '') {
      return json(400, { ok: false, error: `Missing required field: ${key}` });
    }
  }

  const email = String(body.email || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return json(400, { ok: false, error: 'Invalid email address' });
  }

  const subject = `FailFixer Beta Application: ${body.full_name} <${email}>`;

  const auditRecord = {
    server_received_at_utc: meta.serverTimeIso,
    ip_best_effort: meta.ip,
    forwarded_for: meta.forwardedFor,
    real_ip: meta.realIp,
    cf_connecting_ip: meta.cfConnectingIp,
    request_id: meta.requestId,
    vercel_url: meta.vercelUrl,
    payload: body
  };

  const auditJson = JSON.stringify(auditRecord, null, 2);
  const fileSafeName = String(body.full_name || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'unknown';
  const attachmentName = `beta-application-${fileSafeName}-${Date.now()}.json`;

  const resendPayload = {
    from: fromAddress,
    to: [toAddress],
    reply_to: replyToAddress,
    subject,
    html: renderHtml(body, meta),
    text: [
      'New FailFixer beta application',
      '',
      `Name: ${body.full_name}`,
      `Email: ${email}`,
      `Printer: ${body.printer_model}`,
      `Firmware: ${body.firmware}`,
      `Slicer: ${body.slicer}`,
      `Frequency: ${body.print_frequency}`,
      `IP (best effort): ${meta.ip}`,
      `Server Time (UTC): ${meta.serverTimeIso}`,
      '',
      `Why beta: ${body.why_beta}`,
      '',
      `Test commitment: ${body.test_commitment}`
    ].join('\n'),
    attachments: [
      {
        filename: attachmentName,
        content: Buffer.from(auditJson).toString('base64')
      }
    ]
  };

  let resendRes;
  try {
    const resendTimeout = AbortSignal.timeout(15000);
    resendRes = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload),
      signal: resendTimeout
    });
  } catch (err) {
    const isTimeout = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return json(504, {
      ok: false,
      error: isTimeout ? 'Email service timed out' : 'Email service request failed'
    });
  }

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    return json(502, {
      ok: false,
      error: 'Failed to send email',
      detail: errText.slice(0, 600)
    });
  }

  return json(200, { ok: true });
}
