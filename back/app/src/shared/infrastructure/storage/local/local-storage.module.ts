import { Module } from '@nestjs/common';
import { LocalMediaController } from './local-media.controller';
import { localStorageFromEnv } from './local-storage.config';
import { LOCAL_FILE_STORE, MEDIA_URL_SIGNER } from './local-storage.tokens';

/** Monté par AppModule seulement quand STORAGE_DRIVER=local. */
@Module({
  controllers: [LocalMediaController],
  providers: [
    {
      provide: LOCAL_FILE_STORE,
      useFactory: () => localStorageFromEnv().store,
    },
    {
      provide: MEDIA_URL_SIGNER,
      useFactory: () => localStorageFromEnv().signer,
    },
  ],
})
export class LocalStorageModule {}
