import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { PublicRoute } from '../../../../auth/infrastructure/http/public-route.decorator';
import { NoCaseScope } from '../../../../access/infrastructure/http/case-scope.decorator';
import { LocalFileStore } from './local-file-store';
import { LOCAL_FILE_STORE, MEDIA_URL_SIGNER } from './local-storage.tokens';
import { MediaUrlSigner } from './media-url-signer';

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  webp: 'image/webp',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

function contentTypeOf(key: string): string {
  const extension = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

/**
 * Sert les fichiers du stockage local derrière une URL signée — monté
 * uniquement avec STORAGE_DRIVER=local. Route publique par nécessité : un
 * `<img src>` n'envoie pas de jeton. L'autorisation est portée par la
 * signature, émise par le back à un appelant déjà autorisé, comme les URL
 * signées GCS (ADR-0002).
 */
@ApiExcludeController()
@PublicRoute()
@NoCaseScope('URL signée émise après contrôle d’accès, hors périmètre affaire')
@Controller('storage')
export class LocalMediaController {
  constructor(
    @Inject(LOCAL_FILE_STORE) private readonly store: LocalFileStore,
    @Inject(MEDIA_URL_SIGNER) private readonly signer: MediaUrlSigner,
  ) {}

  @Get('*key')
  async serve(
    @Param('key') segments: string[] | string,
    @Query('expires') expires: unknown,
    @Query('signature') signature: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const key = Array.isArray(segments) ? segments.join('/') : segments;
    if (
      typeof expires !== 'string' ||
      typeof signature !== 'string' ||
      !this.signer.verify(key, expires, signature)
    ) {
      throw new ForbiddenException();
    }

    let bytes: Buffer;
    try {
      bytes = await this.store.read(key);
    } catch {
      throw new NotFoundException();
    }

    response.set({
      'Content-Type': contentTypeOf(key),
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    });
    return new StreamableFile(bytes);
  }
}
