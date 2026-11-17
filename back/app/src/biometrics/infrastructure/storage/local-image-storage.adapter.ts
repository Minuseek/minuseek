import {
  FileAlreadyExistsError,
  LocalFileStore,
} from '../../../shared/infrastructure/storage/local/local-file-store';
import { MediaUrlSigner } from '../../../shared/infrastructure/storage/local/media-url-signer';
import { ImageAlreadyStoredError } from '../../application/ports/image-already-stored.error';
import { ImageStoragePort } from '../../application/ports/image-storage.port';

const MEDIA_PREFIX = 'media/';

/**
 * Adapter de stockage local : fichiers sur disque, lecture via URL signée
 * servie par le back. Même contrat que l'adapter GCS (clé `media/<...>`,
 * original immuable), pour une installation sans cloud.
 */
export class LocalImageStorageAdapter implements ImageStoragePort {
  constructor(
    private readonly store: LocalFileStore,
    private readonly signer: MediaUrlSigner,
  ) {}

  async save(buffer: Buffer, relativePath: string): Promise<string> {
    const key = `${MEDIA_PREFIX}${relativePath.replace(/\\/g, '/')}`;
    try {
      await this.store.write(key, buffer);
    } catch (error) {
      if (error instanceof FileAlreadyExistsError) {
        throw new ImageAlreadyStoredError(key);
      }
      throw error;
    }
    return key;
  }

  async delete(storedPath: string): Promise<void> {
    await this.store.remove(storedPath);
  }

  getUrl(storedPath: string): Promise<string> {
    return Promise.resolve(this.signer.sign(storedPath.replace(/^\/+/, '')));
  }
}
