import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalFileStore } from '../../../shared/infrastructure/storage/local/local-file-store';
import { MediaUrlSigner } from '../../../shared/infrastructure/storage/local/media-url-signer';
import { ImageAlreadyStoredError } from '../../application/ports/image-already-stored.error';
import { LocalImageStorageAdapter } from './local-image-storage.adapter';

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hmac';

describe('LocalImageStorageAdapter', () => {
  let root: string;
  let store: LocalFileStore;
  let signer: MediaUrlSigner;
  let storage: LocalImageStorageAdapter;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'minuseek-images-'));
    store = new LocalFileStore(root);
    signer = new MediaUrlSigner(SECRET, 900, '/api/storage');
    storage = new LocalImageStorageAdapter(store, signer);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('stores a buffer under the media/ prefix, like the GCS adapter', async () => {
    const key = await storage.save(Buffer.from('x'), 'traces/abc.png');

    expect(key).toBe('media/traces/abc.png');
    expect((await store.read('media/traces/abc.png')).toString()).toBe('x');
  });

  it('normalises Windows separators in the relative path', async () => {
    const key = await storage.save(Buffer.from('x'), 'traces\\abc.png');

    expect(key).toBe('media/traces/abc.png');
  });

  it('refuses to overwrite an existing key and keeps the original', async () => {
    await storage.save(Buffer.from('original'), 'traces/abc.png');

    await expect(
      storage.save(Buffer.from('tampered'), 'traces/abc.png'),
    ).rejects.toBeInstanceOf(ImageAlreadyStoredError);
    expect((await store.read('media/traces/abc.png')).toString()).toBe(
      'original',
    );
  });

  it('frees the key once the object is deleted', async () => {
    await storage.save(Buffer.from('original'), 'traces/abc.png');
    await storage.delete('media/traces/abc.png');

    await expect(
      storage.save(Buffer.from('second'), 'traces/abc.png'),
    ).resolves.toBe('media/traces/abc.png');
  });

  it('gives a signed URL for the stored key, without re-prefixing', async () => {
    const key = await storage.save(Buffer.from('x'), 'traces/rt.png');

    const url = new URL(await storage.getUrl(key), 'http://localhost');

    expect(url.pathname).toBe('/api/storage/media/traces/rt.png');
    expect(
      signer.verify(
        'media/traces/rt.png',
        url.searchParams.get('expires') ?? '',
        url.searchParams.get('signature') ?? '',
      ),
    ).toBe(true);
  });

  it('tolerates a leading slash on the stored key', async () => {
    const url = await storage.getUrl('/media/z.png');

    expect(url.startsWith('/api/storage/media/z.png?')).toBe(true);
  });
});
