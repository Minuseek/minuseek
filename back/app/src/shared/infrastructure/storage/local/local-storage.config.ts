import { resolve } from 'node:path';
import { LocalFileStore } from './local-file-store';
import { MediaUrlSigner } from './media-url-signer';

const DEFAULT_PUBLIC_URL = '/api/storage';
const DEFAULT_TTL_SECONDS = 900;

export type LocalStorage = {
  root: string;
  store: LocalFileStore;
  signer: MediaUrlSigner;
};

function ttlFrom(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_TTL_SECONDS;
  }
  if (!/^\d+$/.test(raw) || Number(raw) === 0) {
    throw new Error(
      `LOCAL_STORAGE_URL_TTL_SECONDS doit être un entier positif (reçu "${raw}")`,
    );
  }
  return Number(raw);
}

/**
 * Stockage local (STORAGE_DRIVER=local) : fichiers sur disque, lus par URL
 * signée. Les contextes biometrics et reporting partagent la même racine, comme
 * ils partagent le même bucket en GCS.
 */
export function localStorageFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): LocalStorage {
  const secret = env.LOCAL_STORAGE_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      'STORAGE_DRIVER=local requires LOCAL_STORAGE_SIGNING_SECRET to be set',
    );
  }
  const root = resolve(env.LOCAL_STORAGE_DIR ?? 'storage');
  return {
    root,
    store: new LocalFileStore(root),
    signer: new MediaUrlSigner(
      secret,
      ttlFrom(env.LOCAL_STORAGE_URL_TTL_SECONDS),
      env.LOCAL_STORAGE_PUBLIC_URL ?? DEFAULT_PUBLIC_URL,
    ),
  };
}
