import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { LocalFileStore } from './local-file-store';
import { LocalMediaController } from './local-media.controller';
import { LOCAL_FILE_STORE, MEDIA_URL_SIGNER } from './local-storage.tokens';
import { MediaUrlSigner } from './media-url-signer';

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hmac';
const NOW_MS = Date.UTC(2026, 10, 16, 12, 0, 0);

describe('LocalMediaController', () => {
  let root: string;
  let store: LocalFileStore;
  let clockMs: number;
  let signer: MediaUrlSigner;
  let app: INestApplication;
  let server: Server;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'minuseek-media-'));
    store = new LocalFileStore(root);
    clockMs = NOW_MS;
    signer = new MediaUrlSigner(SECRET, 900, '/api/storage', () => clockMs);

    const moduleRef = await Test.createTestingModule({
      controllers: [LocalMediaController],
      providers: [
        { provide: LOCAL_FILE_STORE, useValue: store },
        { provide: MEDIA_URL_SIGNER, useValue: signer },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });

  it('serves the file behind a valid signed URL with its content type', async () => {
    await store.write('media/traces/abc.png', Buffer.from('png-bytes'));

    const response = await request(server).get(
      signer.sign('media/traces/abc.png'),
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(Buffer.from(response.body as Buffer).toString()).toBe('png-bytes');
  });

  it('keeps the file out of shared caches and blocks content sniffing', async () => {
    await store.write('media/traces/abc.png', Buffer.from('png-bytes'));

    const response = await request(server).get(
      signer.sign('media/traces/abc.png'),
    );

    expect(response.headers['cache-control']).toMatch(/^private/);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBe(
      "default-src 'none'",
    );
  });

  it.each([
    ['media/reports/r.pdf', 'application/pdf'],
    ['media/videos/v.webm', 'video/webm'],
    ['media/videos/v.mp4', 'video/mp4'],
    ['media/traces/t.tif', 'image/tiff'],
    ['media/traces/t.jpeg', 'image/jpeg'],
    ['media/other/blob.bin', 'application/octet-stream'],
  ])('serves %s as %s', async (key, contentType) => {
    await store.write(key, Buffer.from('x'));

    const response = await request(server).get(signer.sign(key));

    expect(response.headers['content-type']).toBe(contentType);
  });

  it('serves a key whose segments needed URL encoding', async () => {
    await store.write('media/traces/scène 1.png', Buffer.from('x'));

    const response = await request(server).get(
      signer.sign('media/traces/scène 1.png'),
    );

    expect(response.status).toBe(200);
  });

  it('refuses an expired URL', async () => {
    await store.write('media/traces/abc.png', Buffer.from('x'));
    const url = signer.sign('media/traces/abc.png');
    clockMs += 901_000;

    const response = await request(server).get(url);

    expect(response.status).toBe(403);
  });

  it('refuses a URL whose signature does not match the key', async () => {
    await store.write('media/traces/secret.png', Buffer.from('x'));
    const url = signer
      .sign('media/traces/abc.png')
      .replace('abc.png', 'secret.png');

    const response = await request(server).get(url);

    expect(response.status).toBe(403);
  });

  it('refuses a request without signature', async () => {
    await store.write('media/traces/abc.png', Buffer.from('x'));

    const response = await request(server).get(
      '/api/storage/media/traces/abc.png',
    );

    expect(response.status).toBe(403);
  });

  it('answers 404 when the signed key has no file', async () => {
    const response = await request(server).get(
      signer.sign('media/traces/missing.png'),
    );

    expect(response.status).toBe(404);
  });

  it('refuses a signed key that escapes the storage root', async () => {
    const response = await request(server).get(
      signer.sign('media/../../etc/passwd'),
    );

    expect(response.status).toBe(404);
  });
});
