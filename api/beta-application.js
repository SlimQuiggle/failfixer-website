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

function renderHtml(body) {
  const fields = [
    ['Full name', body.full_name],
    ['Email', body.email],
    ['Country / region', body.country],
    ['Claimed timezone', body.timezone_claimed],
    ['Printer model', body.printer_model],
    ['Firmware', body.firmware],
    ['Slicer', body.slicer],
    ['Print frequency', body.print_frequency],
    ['Why beta', body.why_beta],
    ['Test commitment', body.test_commitment],
    ['Accepted terms', body.beta_terms_accept],
    ['Risk acknowledged', body.beta_risk_ack],
    ['Submitted at (UTC)', body.submitted_at_utc],
    ['Form seconds elapsed', body.beta_form_seconds_elapsed],
    ['Source page', body.source_page],
    ['Referrer', body.meta_referrer],
    ['Timezone (browser)', body.meta_timezone],
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
    ['Client fingerprint (SHA-256)', body.meta_client_fingerprint_sha256]
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

  if (body.company_name) {
    return json(200, { ok: true });
  }

  const required = [
    'full_name',
    'email',
    'country',
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

  const resendPayload = {
    from: fromAddress,
    to: [toAddress],
    reply_to: replyToAddress,
    subject,
    html: renderHtml(body),
    text: [
      'New FailFixer beta application',
      '',
      `Name: ${body.full_name}`,
      `Email: ${email}`,
      `Country/Region: ${body.country}`,
      `Printer: ${body.printer_model}`,
      `Firmware: ${body.firmware}`,
      `Slicer: ${body.slicer}`,
      `Frequency: ${body.print_frequency}`,
      '',
      `Why beta: ${body.why_beta}`,
      '',
      `Test commitment: ${body.test_commitment}`
    ].join('\n')
  };

  const resendRes = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resendPayload)
  });

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
