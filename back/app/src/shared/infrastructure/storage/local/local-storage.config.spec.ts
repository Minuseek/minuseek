import { resolve } from 'node:path';
import { localStorageFromEnv } from './local-storage.config';

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hmac';

describe('localStorageFromEnv', () => {
  it('requires a signing secret', () => {
    expect(() => localStorageFromEnv({})).toThrow(
      /LOCAL_STORAGE_SIGNING_SECRET/,
    );
  });

  it('signs URLs under /api/storage by default, valid for 15 minutes', () => {
    const before = Math.floor(Date.now() / 1000);

    const { signer } = localStorageFromEnv({
      LOCAL_STORAGE_SIGNING_SECRET: SECRET,
    });

    const url = new URL(signer.sign('media/a.png'), 'http://localhost');
    expect(url.pathname).toBe('/api/storage/media/a.png');
    expect(Number(url.searchParams.get('expires'))).toBeGreaterThanOrEqual(
      before + 900,
    );
    expect(Number(url.searchParams.get('expires'))).toBeLessThanOrEqual(
      before + 901,
    );
  });

  it('uses the configured public URL and lifetime', () => {
    const before = Math.floor(Date.now() / 1000);

    const { signer } = localStorageFromEnv({
      LOCAL_STORAGE_SIGNING_SECRET: SECRET,
      LOCAL_STORAGE_PUBLIC_URL: 'https://api.example.org/api/storage',
      LOCAL_STORAGE_URL_TTL_SECONDS: '60',
    });

    const url = new URL(signer.sign('media/a.png'));
    expect(url.origin).toBe('https://api.example.org');
    expect(Number(url.searchParams.get('expires'))).toBeLessThanOrEqual(
      before + 61,
    );
  });

  it.each(['0', '-5', 'quinze', '1.5'])(
    'rejects an invalid URL lifetime (%p)',
    (ttl) => {
      expect(() =>
        localStorageFromEnv({
          LOCAL_STORAGE_SIGNING_SECRET: SECRET,
          LOCAL_STORAGE_URL_TTL_SECONDS: ttl,
        }),
      ).toThrow(/LOCAL_STORAGE_URL_TTL_SECONDS/);
    },
  );

  it('stores files under ./storage by default, or under LOCAL_STORAGE_DIR', () => {
    expect(
      localStorageFromEnv({ LOCAL_STORAGE_SIGNING_SECRET: SECRET }).root,
    ).toBe(resolve('storage'));
    expect(
      localStorageFromEnv({
        LOCAL_STORAGE_SIGNING_SECRET: SECRET,
        LOCAL_STORAGE_DIR: '/var/lib/minuseek',
      }).root,
    ).toBe('/var/lib/minuseek');
  });
});
