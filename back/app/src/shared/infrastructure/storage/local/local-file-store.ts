import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

export class FileAlreadyExistsError extends Error {
  constructor(key: string) {
    super(`Un fichier existe déjà sous la clé ${key}`);
  }
}

export class InvalidStorageKeyError extends Error {
  constructor(key: string) {
    super(`Clé de stockage invalide : ${JSON.stringify(key)}`);
  }
}

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}

/**
 * Fichiers rangés sous un dossier racine, adressés par une clé relative
 * (`media/traces/<id>.png`). Toute clé qui sortirait de la racine est refusée
 * avant de toucher au disque : la clé peut venir d'une URL.
 */
export class LocalFileStore {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  /** Écriture exclusive : un original n'est jamais écrasé (ADR-0009, point 6). */
  async write(key: string, bytes: Buffer): Promise<void> {
    const path = this.pathOf(key);
    await mkdir(dirname(path), { recursive: true });
    try {
      await writeFile(path, bytes, { flag: 'wx' });
    } catch (error) {
      if (hasCode(error, 'EEXIST')) {
        throw new FileAlreadyExistsError(key);
      }
      throw error;
    }
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.pathOf(key));
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.pathOf(key));
    } catch (error) {
      if (!hasCode(error, 'ENOENT')) {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.pathOf(key));
      return true;
    } catch {
      return false;
    }
  }

  private pathOf(key: string): string {
    const segments = key.split('/');
    const unsafe =
      key.includes('\0') ||
      key.includes('\\') ||
      segments.some(
        (segment) => segment === '' || segment === '.' || segment === '..',
      );
    const path = resolve(this.root, key);
    if (unsafe || !path.startsWith(this.root + sep)) {
      throw new InvalidStorageKeyError(key);
    }
    return path;
  }
}
