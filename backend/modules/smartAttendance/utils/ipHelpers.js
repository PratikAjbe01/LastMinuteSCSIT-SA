// modules/smartAttendance/utils/ipHelpers.js
/**
 * Reliably extract the real client IP.
 *
 * Priority order:
 * 1. CF-Connecting-IP  (Cloudflare)
 * 2. X-Real-IP         (Nginx proxy)
 * 3. X-Forwarded-For   (Standard proxy chain — take FIRST)
 * 4. socket remoteAddress
 * 5. req.ip (Express)
 */
export const getClientIP = (req) => {
  const cf = req.headers['cf-connecting-ip'];
  if (cf) return cf.trim();

  const realIP = req.headers['x-real-ip'];
  if (realIP) return realIP.trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // May be comma-separated list — first is the original client
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const remote = req.socket?.remoteAddress;
  if (remote) return normalizeIP(remote);

  return req.ip || '';
};

/**
 * Normalize IPv6-mapped IPv4 addresses.
 * "::ffff:192.168.1.5" → "192.168.1.5"
 * "::1"                → "127.0.0.1"
 */
export const normalizeIP = (ip) => {
  if (!ip) return '';
  if (ip === '::1') return '127.0.0.1';
  return ip.replace(/^::ffff:/, '');
};

/**
 * Extract /24 subnet from IPv4.
 * "192.168.1.55" → "192.168.1"
 * Returns null for pure IPv6 (no validation possible).
 */
export const getSubnet = (ip) => {
  if (!ip) return null;
  const clean = normalizeIP(ip);
  const parts = clean.split('.');
  if (parts.length === 4) return parts.slice(0, 3).join('.');
  return null; // pure IPv6
};

/**
 * Check if a student IP is within the faculty's allowed subnet.
 * If no subnet is configured → allow all (open mode).
 */
export const isIPAllowed = (studentIP, allowedSubnet) => {
  if (!allowedSubnet) return true; // no restriction
  const studentSubnet = getSubnet(normalizeIP(studentIP));
  if (!studentSubnet) return false;
  return studentSubnet === allowedSubnet;
};