// Prüft den tatsächlichen Zustand einer Unternehmenswebsite:
// erreichbar? HTTPS? mobilfreundlich? oder ist es nur eine Social-Media-Seite
// statt einer echten Website? Kein externer Dienst, kein API-Key nötig.

import { lookup } from 'dns/promises';
import { isIP } from 'net';

const SOCIAL_HOSTS = ['facebook.com', 'instagram.com', 'linktr.ee', 'wa.me', 'wordpress.com/wp-admin'];
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

function isSocialOnly(hostname) {
  return SOCIAL_HOSTS.some((host) => hostname.includes(host));
}

function hasViewportMeta(html) {
  return /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);
}

// --- SSRF-Schutz -----------------------------------------------------------
// Diese Funktion nimmt eine vom Client übergebene URL entgegen und ruft sie
// vom Server aus ab. Ohne Prüfung könnte man den Server missbrauchen, um
// interne Adressen (localhost, private Netze, Cloud-Metadata-IPs wie
// 169.254.169.254) abzufragen. Darum werden Hostname *und* die tatsächlich
// aufgelöste(n) IP-Adresse(n) vor jedem Request/Redirect geprüft.

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // "this network", privat, loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // Carrier-grade NAT
  if (a === 169 && b === 254) return true; // Link-local / Cloud-Metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // privat
  if (a === 192 && b === 168) return true; // privat
  if (a === 192 && b === 0) return true; // IETF-Protokoll-Assignments (u.a. 192.0.0.0/24)
  if (a >= 224) return true; // Multicast/reserviert
  return false;
}

function isPrivateIPv6(ip) {
  const norm = ip.toLowerCase();
  if (norm === '::1' || norm === '::') return true; // loopback / unspecified
  if (norm.startsWith('fe80:') || norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb')) return true; // link-local
  if (norm.startsWith('fc') || norm.startsWith('fd')) return true; // unique local (fc00::/7)
  if (norm.startsWith('::ffff:')) return isPrivateIPv4(norm.replace('::ffff:', '')); // IPv4-mapped
  return false;
}

function isPrivateIp(ip) {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // unbekanntes Format lieber sicherheitshalber blockieren
}

async function assertPublicHost(hostname) {
  if (hostname === 'localhost') {
    throw new SsrfBlockedError();
  }
  // Falls schon eine IP direkt angegeben wurde
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new SsrfBlockedError();
    return;
  }
  let addresses;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error('Der Hostname konnte nicht aufgelöst werden.');
  }
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new SsrfBlockedError();
  }
}

class SsrfBlockedError extends Error {
  constructor() {
    super('Diese Adresse zeigt auf ein privates/internes Netzwerk und wird aus Sicherheitsgründen nicht abgerufen.');
  }
}

export async function checkWebsite(rawUrl) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return {
      verdict: 'ungueltig',
      message: 'Das ist keine gültige URL.',
      reachable: false,
    };
  }

  try {
    await assertPublicHost(url.hostname);
  } catch (error) {
    return {
      verdict: 'ungueltig',
      message: error.message || 'Diese Adresse darf nicht abgerufen werden.',
      reachable: false,
    };
  }

  if (isSocialOnly(url.hostname)) {
    return {
      verdict: 'social_media_only',
      message: 'Nur eine Social-Media-Seite, keine eigene Website – starkes Verkaufsargument.',
      reachable: true,
      https: url.protocol === 'https:',
      mobileFriendly: null,
      statusCode: null,
      loadTimeMs: null,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    // redirect: 'manual', damit jede Weiterleitung einzeln geprüft werden kann,
    // bevor sie verfolgt wird (sonst könnte eine anfangs harmlose URL per
    // Redirect auf eine interne Adresse umleiten und den Schutz oben umgehen).
    let currentUrl = url;
    let response;
    for (let redirectCount = 0; ; redirectCount += 1) {
      response = await fetch(currentUrl.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadForge-Check/1.0)' },
      });
      const isRedirect = response.status >= 300 && response.status < 400 && response.headers.get('location');
      if (!isRedirect) break;
      if (redirectCount >= MAX_REDIRECTS) {
        throw new Error('Zu viele Weiterleitungen.');
      }
      const nextUrl = new URL(response.headers.get('location'), currentUrl);
      await assertPublicHost(nextUrl.hostname);
      currentUrl = nextUrl;
    }
    const loadTimeMs = Date.now() - startedAt;
    const finalUrl = currentUrl;

    if (isSocialOnly(finalUrl.hostname)) {
      return {
        verdict: 'social_media_only',
        message: 'Die Domain leitet auf eine Social-Media-Seite weiter.',
        reachable: true,
        https: finalUrl.protocol === 'https:',
        mobileFriendly: null,
        statusCode: response.status,
        loadTimeMs,
      };
    }

    if (!response.ok) {
      return {
        verdict: 'nicht_erreichbar',
        message: `Die Website antwortet mit Fehlercode ${response.status}.`,
        reachable: false,
        https: finalUrl.protocol === 'https:',
        mobileFriendly: null,
        statusCode: response.status,
        loadTimeMs,
      };
    }

    const html = await response.text();
    const mobileFriendly = hasViewportMeta(html);
    const https = finalUrl.protocol === 'https:';
    const modern = mobileFriendly && https && loadTimeMs < 4000;

    return {
      verdict: modern ? 'modern' : 'veraltet',
      message: modern
        ? 'Die Website wirkt modern und mobilfreundlich – geringes Potenzial.'
        : buildOutdatedMessage({ mobileFriendly, https, loadTimeMs }),
      reachable: true,
      https,
      mobileFriendly,
      statusCode: response.status,
      loadTimeMs,
    };
  } catch (error) {
    const loadTimeMs = Date.now() - startedAt;
    const timedOut = error.name === 'AbortError';
    return {
      verdict: 'nicht_erreichbar',
      message: timedOut
        ? 'Die Website hat innerhalb von 8 Sekunden nicht geantwortet.'
        : 'Die Website konnte nicht erreicht werden.',
      reachable: false,
      https: null,
      mobileFriendly: null,
      statusCode: null,
      loadTimeMs,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildOutdatedMessage({ mobileFriendly, https, loadTimeMs }) {
  const issues = [];
  if (!mobileFriendly) issues.push('nicht für Mobilgeräte optimiert');
  if (!https) issues.push('kein HTTPS');
  if (loadTimeMs >= 4000) issues.push('sehr langsam');
  return issues.length ? `Website wirkt veraltet: ${issues.join(', ')}.` : 'Website wirkt ausbaufähig.';
}
