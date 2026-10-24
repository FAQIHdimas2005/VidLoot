import dns from 'dns';
import net from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'instance-data',
  'metadata.google.internal',
  'metadata.goog',
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.home.arpa',
  '.ip6.arpa',
  '.in-addr.arpa',
];

const DNS_CACHE_TTL_MS = 5 * 60 * 1000;
const DNS_CACHE_MAX = 500;
const dnsCache = new Map<string, { blocked: boolean; expiresAt: number }>();

function rememberDns(host: string, blocked: boolean): void {
  if (dnsCache.size >= DNS_CACHE_MAX) {
    const oldest = dnsCache.keys().next().value;
    if (oldest !== undefined) dnsCache.delete(oldest);
  }
  dnsCache.set(host, { blocked, expiresAt: Date.now() + DNS_CACHE_TTL_MS });
}

function isBlockedIpv4(ip: string): boolean {
  const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return true;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => part > 255)) return true;
  const [a, b, c] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === '::' || h === '::1' || h === '0:0:0:0:0:0:0:1') return true;
  if (/^::(ffff:)?(\d{1,3}\.){3}\d{1,3}$/i.test(h)) {
    const embedded = h.split(':').pop() as string;
    return isBlockedIpv4(embedded);
  }
  if (/^f[cd]/i.test(h)) return true;
  if (/^fe[89ab]/i.test(h)) return true;
  return false;
}

function isBlockedHostLiteral(rawHost: string): boolean {
  const host = rawHost.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  const ipKind = net.isIP(host);
  if (ipKind === 4) return isBlockedIpv4(host);
  if (ipKind === 6) return isBlockedIpv6(host);
  return false;
}

async function hostResolvesToBlockedAddress(host: string): Promise<boolean> {
  const cached = dnsCache.get(host);
  if (cached && cached.expiresAt > Date.now()) return cached.blocked;
  try {
    const addresses = await dns.promises.lookup(host, { all: true, verbatim: true });
    if (!addresses || addresses.length === 0) {
      rememberDns(host, true);
      return true;
    }
    let blocked = false;
    for (const record of addresses) {
      if (record.family === 4 && isBlockedIpv4(record.address)) {
        blocked = true;
        break;
      }
      if (record.family === 6 && isBlockedIpv6(record.address)) {
        blocked = true;
        break;
      }
    }
    rememberDns(host, blocked);
    return blocked;
  } catch {
    rememberDns(host, true);
    return true;
  }
}

export async function isSafeExternalUrl(rawUrl: unknown): Promise<boolean> {
  if (typeof rawUrl !== 'string') return false;
  const candidate = rawUrl.trim();
  if (!candidate || candidate.length > 2048) return false;
  if (/[\s\r\n\t]/.test(candidate)) return false;
  if (candidate.startsWith('-')) return false;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;

  const port = parsed.port
    ? parseInt(parsed.port, 10)
    : parsed.protocol === 'https:'
      ? 443
      : 80;
  if (!Number.isFinite(port) || (port !== 80 && port !== 443)) return false;

  const host = parsed.hostname;
  if (isBlockedHostLiteral(host)) return false;

  if (net.isIP(host) === 0) {
    const blocked = await hostResolvesToBlockedAddress(host);
    if (blocked) return false;
  }
  return true;
}

export function isSafeCliTargetUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false;
  const candidate = rawUrl.trim();
  if (!candidate || candidate.length > 2048) return false;
  if (!/^https?:\/\//i.test(candidate)) return false;
  if (/[\s\r\n\t]/.test(candidate)) return false;
  return true;
}

const ALLOWED_PLATFORMS = new Set(['youtube', 'facebook', 'tiktok', 'instagram', 'twitter', 'deviantart']);

export function normalizePlatformParam(raw: unknown): string {
  if (typeof raw !== 'string') return 'media';
  const candidate = raw.trim().toLowerCase();
  return ALLOWED_PLATFORMS.has(candidate) ? candidate : 'media';
}

export function sanitizeCacheKeyPart(raw: unknown, maxLength: number = 64): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, maxLength);
}
