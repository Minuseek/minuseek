import { createHmac, timingSafeEqual } from 'node:crypto';

const MIN_SECRET_LENGTH = 32;
const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;
const EXPIRES_PATTERN = /^\d+$/;

/**
 * URL de lecture signée pour le stockage local : l'équivalent des URL signées
 * V4 de GCS (ADR-0002). La signature HMAC-SHA256 couvre la clé ET l'expiration,
 * donc ni l'une ni l'autre ne peut être modifiée sans invalider l'URL.
 */
export class MediaUrlSigner {
  private readonly baseUrl: string;

  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number,
    baseUrl: string,
    private readonly nowMs: () => number = Date.now,
  ) {
    if (secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `LOCAL_STORAGE_SIGNING_SECRET doit faire au moins ${MIN_SECRET_LENGTH} caractères`,
      );
    }
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  sign(key: string): string {
    const expires = String(Math.floor(this.nowMs() / 1000) + this.ttlSeconds);
    const path = key.split('/').map(encodeURIComponent).join('/');
    return `${this.baseUrl}/${path}?expires=${expires}&signature=${this.signatureOf(key, expires)}`;
  }

  verify(key: string, expires: string, signature: string): boolean {
    if (!EXPIRES_PATTERN.test(expires) || !SIGNATURE_PATTERN.test(signature)) {
      return false;
    }
    if (Number(expires) * 1000 < this.nowMs()) {
      return false;
    }
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(this.signatureOf(key, expires), 'hex'),
    );
  }

  private signatureOf(key: string, expires: string): string {
    return createHmac('sha256', this.secret)
      .update(`${key}\n${expires}`)
      .digest('hex');
  }
}
