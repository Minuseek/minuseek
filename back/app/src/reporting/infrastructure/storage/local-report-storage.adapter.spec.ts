import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalFileStore } from '../../../shared/infrastructure/storage/local/local-file-store';
import { MediaUrlSigner } from '../../../shared/infrastructure/storage/local/media-url-signer';
import { LocalReportStorageAdapter } from './local-report-storage.adapter';

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hmac';

describe('LocalReportStorageAdapter', () => {
  let root: string;
  let store: LocalFileStore;
  let signer: MediaUrlSigner;
  let storage: LocalReportStorageAdapter;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'minuseek-reports-'));
    store = new LocalFileStore(root);
    signer = new MediaUrlSigner(SECRET, 900, '/api/storage');
    storage = new LocalReportStorageAdapter(store, signer);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('stores the PDF under the media/ prefix', async () => {
    const key = await storage.save(Buffer.from('%PDF'), 'reports/case/r.pdf');

    expect(key).toBe('media/reports/case/r.pdf');
    expect((await store.read(key)).toString()).toBe('%PDF');
  });

  it('never overwrites a sealed report', async () => {
    await storage.save(Buffer.from('%PDF original'), 'reports/case/r.pdf');

    await expect(
      storage.save(Buffer.from('%PDF tampered'), 'reports/case/r.pdf'),
    ).rejects.toThrow();
    expect((await store.read('media/reports/case/r.pdf')).toString()).toBe(
      '%PDF original',
    );
  });

  it('reads the bytes of a piece stored by the biometrics context', async () => {
    await store.write('media/traces/t.png', Buffer.from('png'));

    expect((await storage.read('media/traces/t.png')).toString()).toBe('png');
  });

  it('gives a signed download URL for the report', async () => {
    const key = await storage.save(Buffer.from('%PDF'), 'reports/case/r.pdf');

    const url = new URL(await storage.getUrl(key), 'http://localhost');

    expect(url.pathname).toBe('/api/storage/media/reports/case/r.pdf');
    expect(
      signer.verify(
        key,
        url.searchParams.get('expires') ?? '',
        url.searchParams.get('signature') ?? '',
      ),
    ).toBe(true);
  });
});
