import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileAlreadyExistsError, LocalFileStore } from './local-file-store';

describe('LocalFileStore', () => {
  let root: string;
  let store: LocalFileStore;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'minuseek-store-'));
    store = new LocalFileStore(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes a file under the root, creating intermediate folders', async () => {
    await store.write('media/traces/abc.png', Buffer.from('octets'));

    expect(
      (await readFile(join(root, 'media/traces/abc.png'))).toString(),
    ).toBe('octets');
  });

  it('reads back what was written', async () => {
    await store.write('media/reports/r.pdf', Buffer.from('%PDF'));

    expect((await store.read('media/reports/r.pdf')).toString()).toBe('%PDF');
  });

  it('refuses to overwrite an existing file and keeps the original', async () => {
    await store.write('media/traces/abc.png', Buffer.from('original'));

    await expect(
      store.write('media/traces/abc.png', Buffer.from('tampered')),
    ).rejects.toBeInstanceOf(FileAlreadyExistsError);
    expect((await store.read('media/traces/abc.png')).toString()).toBe(
      'original',
    );
  });

  it('removes a file, and removing a missing file is not an error', async () => {
    await store.write('media/traces/abc.png', Buffer.from('x'));

    await store.remove('media/traces/abc.png');
    await store.remove('media/traces/abc.png');

    await expect(store.read('media/traces/abc.png')).rejects.toThrow();
  });

  it('frees the key once the file is removed', async () => {
    await store.write('media/traces/abc.png', Buffer.from('first'));
    await store.remove('media/traces/abc.png');

    await store.write('media/traces/abc.png', Buffer.from('second'));

    expect((await store.read('media/traces/abc.png')).toString()).toBe(
      'second',
    );
  });

  it('tells whether a key exists', async () => {
    await store.write('media/traces/abc.png', Buffer.from('x'));

    expect(await store.exists('media/traces/abc.png')).toBe(true);
    expect(await store.exists('media/traces/missing.png')).toBe(false);
  });

  it.each([
    '../outside.png',
    'media/../../outside.png',
    '/etc/passwd',
    'media/traces/../../../outside.png',
    'media\\..\\..\\outside.png',
    '',
  ])('rejects a key that escapes the root (%p)', async (key) => {
    await expect(store.read(key)).rejects.toThrow(/clé de stockage invalide/i);
    await expect(store.write(key, Buffer.from('x'))).rejects.toThrow(
      /clé de stockage invalide/i,
    );
    await expect(store.remove(key)).rejects.toThrow(
      /clé de stockage invalide/i,
    );
  });

  it('rejects a key containing a NUL byte', async () => {
    await expect(store.read('media/a\0.png')).rejects.toThrow(
      /clé de stockage invalide/i,
    );
  });
});
