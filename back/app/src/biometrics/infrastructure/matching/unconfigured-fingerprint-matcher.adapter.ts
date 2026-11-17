import { ServiceUnavailableException } from '@nestjs/common';
import {
  FingerprintComparison,
  FingerprintMatcherPort,
} from '../../application/ports/fingerprint-matcher.port';

/**
 * Moteur de comparaison absent (DATA_API_URL vide) : la comparaison
 * automatique est un service externe optionnel. Le reste de l'application
 * fonctionne ; seule l'analyse automatique répond 503.
 */
export class UnconfiguredFingerprintMatcherAdapter implements FingerprintMatcherPort {
  compare(): Promise<FingerprintComparison> {
    return Promise.reject(
      new ServiceUnavailableException(
        'La comparaison automatique n’est pas configurée sur cette installation',
      ),
    );
  }
}
