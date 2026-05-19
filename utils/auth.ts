// Frontend-only validation helpers for the auth flow.
// Format validation here is NOT a substitute for backend verification —
// ownership is proven by the Supabase email OTP.

// RFC 5322-ish practical regex. Rejects "@", "a@", "@b.com" etc.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export function validateEmail(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim().toLowerCase();
  if (!v) return { ok: false, error: 'Email tidak boleh kosong.' };
  if (v.length > 254) return { ok: false, error: 'Email terlalu panjang.' };
  if (!EMAIL_RE.test(v)) return { ok: false, error: 'Format email tidak valid.' };
  return { ok: true, value: v };
}

// Normalise Indonesian numbers to E.164 (+62...).
// Accepts: 08xxxxxxxxx, 8xxxxxxxxx, 628xxxxxxxxx, +628xxxxxxxxx
// (Also accepts already-E.164 international numbers like +1xxxxxxxxxx.)
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('08')) return '+62' + cleaned.slice(1);
  if (cleaned.startsWith('62')) return '+' + cleaned;
  if (cleaned.startsWith('8')) return '+62' + cleaned;
  return cleaned; // unknown shape — let validatePhone reject it
}

// Validate after normalisation. Requires +country prefix, sane length,
// rejects obvious junk like 000000 / 111111.
export function validatePhone(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = normalizePhone(raw);
  if (!v) return { ok: false, error: 'Nomor telepon tidak boleh kosong.' };
  if (!/^\+\d{8,15}$/.test(v)) return { ok: false, error: 'Format nomor telepon tidak valid.' };

  const digits = v.slice(1);
  // All-same-digit or all-zero numbers are obviously bogus.
  if (/^(\d)\1+$/.test(digits)) return { ok: false, error: 'Nomor telepon tidak valid.' };

  // For +62 (Indonesia), mobile numbers must start with 8 after the country code
  // and have a reasonable subscriber length (typically 9-12 digits after +62).
  if (v.startsWith('+62')) {
    const local = v.slice(3);
    if (!local.startsWith('8')) return { ok: false, error: 'Nomor Indonesia harus diawali 8 (mis. 08xx atau +62 8xx).' };
    if (local.length < 9 || local.length > 12) return { ok: false, error: 'Panjang nomor Indonesia tidak valid.' };
  }

  return { ok: true, value: v };
}

export function validateName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = raw.trim();
  if (!v) return { ok: false, error: 'Nama tidak boleh kosong.' };
  if (v.length < 2) return { ok: false, error: 'Nama terlalu pendek.' };
  if (v.length > 80) return { ok: false, error: 'Nama terlalu panjang.' };
  return { ok: true, value: v };
}

export function validatePassword(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  if (!raw) return { ok: false, error: 'Kata sandi tidak boleh kosong.' };
  if (raw.length < 6) return { ok: false, error: 'Kata sandi minimal 6 karakter.' };
  if (raw.length > 72) return { ok: false, error: 'Kata sandi terlalu panjang.' };
  return { ok: true, value: raw };
}

export const OTP_LENGTH = 6;
export const OTP_RE = /^\d{6}$/;
export function isValidOtp(token: string): boolean {
  return OTP_RE.test(token);
}
