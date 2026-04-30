// Lightweight client-side hash for the unlock code.
// Code is short (4 digits) so we salt with the txn id to make rainbow-table attacks pointless.
// Real production should use server-side bcrypt — this is a prototype.

export async function hashCode(code: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}::${code}::lockpay-v1`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyCode(code: string, salt: string, hash: string): Promise<boolean> {
  const computed = await hashCode(code, salt);
  return computed === hash;
}

export function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
