import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(payload: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

export function verifyPayload(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signPayload(payload, secret);
  const expectedDigest = expected.slice("sha256=".length);
  const suppliedDigest = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : "";

  if (!/^[\da-f]{64}$/i.test(suppliedDigest)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expectedDigest, "hex"),
    Buffer.from(suppliedDigest, "hex")
  );
}
