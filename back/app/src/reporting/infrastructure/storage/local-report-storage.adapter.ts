import { LocalFileStore } from '../../../shared/infrastructure/storage/local/local-file-store';
import { MediaUrlSigner } from '../../../shared/infrastructure/storage/local/media-url-signer';
import type { ReportStoragePort } from '../../application/ports/report-storage.port';

const MEDIA_PREFIX = 'media/';

/** Même racine que les pièces (stockage local), URL signée en lecture. */
export class LocalReportStorageAdapter implements ReportStoragePort {
  constructor(
    private readonly store: LocalFileStore,
    private readonly signer: MediaUrlSigner,
  ) {}

  async save(pdf: Buffer, relativePath: string): Promise<string> {
    const storedPath = `${MEDIA_PREFIX}${relativePath}`;
    await this.store.write(storedPath, pdf);
    return storedPath;
  }

  getUrl(storedPath: string): Promise<string> {
    return Promise.resolve(this.signer.sign(storedPath));
  }

  read(storedPath: string): Promise<Buffer> {
    return this.store.read(storedPath);
  }
}
