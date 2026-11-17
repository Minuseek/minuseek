import { MediaUrlSigner } from './media-url-signer';

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hmac';
const NOW_MS = Date.UTC(2026, 10, 16, 12, 0, 0);
const TTL_SECONDS = 900;

function signerAt(nowMs: number, baseUrl = '/api/storage'): MediaUrlSigner {
  return new MediaUrlSigner(SECRET, TTL_SECONDS, baseUrl, () => nowMs);
}

function parse(url: string): {
  key: string;
  expires: string;
  signature: string;
} {
  const parsed = new URL(url, 'http://localhost');
  return {
    key: parsed.pathname.replace(/^\/api\/storage\//, ''),
    expires: parsed.searchParams.get('expires') ?? '',
    signature: parsed.searchParams.get('signature') ?? '',
  };
}

describe('MediaUrlSigner', () => {
  it('builds a URL under the base path that carries the key, an expiry and a signature', () => {
    const url = signerAt(NOW_MS).sign('media/traces/abc.png');

    const { key, expires, signature } = parse(url);
    expect(url.startsWith('/api/storage/media/traces/abc.png?')).toBe(true);
    expect(key).toBe('media/traces/abc.png');
    expect(Number(expires)).toBe(NOW_MS / 1000 + TTL_SECONDS);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it('accepts its own signature before expiry', () => {
    const { key, expires, signature } = parse(
      signerAt(NOW_MS).sign('media/traces/abc.png'),
    );

    expect(signerAt(NOW_MS + 899_000).verify(key, expires, signature)).toBe(
      true,
    );
  });

  it('rejects a URL once expired', () => {
    const { key, expires, signature } = parse(
      signerAt(NOW_MS).sign('media/traces/abc.png'),
    );

    expect(signerAt(NOW_MS + 901_000).verify(key, expires, signature)).toBe(
      false,
    );
  });

  it('rejects a signature reused for another key', () => {
    const { expires, signature } = parse(
      signerAt(NOW_MS).sign('media/traces/abc.png'),
    );

    expect(
      signerAt(NOW_MS).verify('media/traces/other.png', expires, signature),
    ).toBe(false);
  });

  it('rejects a pushed-back expiry', () => {
    const { key, expires, signature } = parse(
      signerAt(NOW_MS).sign('media/traces/abc.png'),
    );

    expect(
      signerAt(NOW_MS).verify(key, String(Number(expires) + 3600), signature),
    ).toBe(false);
  });

  it('rejects a signature made with another secret', () => {
    const forged = new MediaUrlSigner(
      'un-autre-secret-tout-aussi-long-que-le-vrai',
      TTL_SECONDS,
      '/api/storage',
      () => NOW_MS,
    );
    const { key, expires, signature } = parse(
      forged.sign('media/traces/abc.png'),
    );

    expect(signerAt(NOW_MS).verify(key, expires, signature)).toBe(false);
  });

  it.each([
    ['empty signature', ''],
    ['truncated signature', 'abc123'],
    ['non-hex signature', 'z'.repeat(64)],
  ])(
    'rejects a malformed signature (%s) without throwing',
    (_label, signature) => {
      const { key, expires } = parse(
        signerAt(NOW_MS).sign('media/traces/abc.png'),
      );

      expect(signerAt(NOW_MS).verify(key, expires, signature)).toBe(false);
    },
  );

  it.each(['', 'demain', '1.5', '-1'])(
    'rejects a malformed expiry (%p)',
    (expires) => {
      const { key, signature } = parse(
        signerAt(NOW_MS).sign('media/traces/abc.png'),
      );

      expect(signerAt(NOW_MS).verify(key, expires, signature)).toBe(false);
    },
  );

  it('encodes each path segment so the URL stays valid', () => {
    const url = signerAt(NOW_MS).sign('media/traces/scène 1.png');

    expect(
      url.startsWith('/api/storage/media/traces/sc%C3%A8ne%201.png?'),
    ).toBe(true);
  });

  it('accepts an absolute base URL and drops its trailing slash', () => {
    const url = signerAt(NOW_MS, 'https://api.example.org/api/storage/').sign(
      'media/a.png',
    );

    expect(
      url.startsWith('https://api.example.org/api/storage/media/a.png?'),
    ).toBe(true);
  });

  it('refuses to start with a secret too short to be safe', () => {
    expect(
      () => new MediaUrlSigner('court', TTL_SECONDS, '/api/storage'),
    ).toThrow(/32/);
  });
});
