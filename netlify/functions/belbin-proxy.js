// netlify/functions/belbin-proxy.js

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzKJr003Ws5vzFTHjCXZaU5j0DNpcRCpmiYN-4nTlr7T8e9LatBhrxfTVpIN93DWPCC/exec';

// Netlify pakai Node 18+, fetch sudah global
exports.handler = async (event, context) => {
  const origin = event.headers.origin || '';

  // Handle preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': origin || 'https://belbin3100.netlify.app',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': origin || 'https://belbin3100.netlify.app',
      },
      body: 'Method Not Allowed',
    };
  }

  try {
    // Teruskan body JSON apa adanya ke Apps Script
    const resp = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
    });

    const text = await resp.text();

    return {
      statusCode: resp.status,
      headers: {
        'Access-Control-Allow-Origin': origin || 'https://belbin3100.netlify.app',
        'Content-Type': resp.headers.get('content-type') || 'application/json',
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': origin || 'https://belbin3100.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
