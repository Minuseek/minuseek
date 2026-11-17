import { ServiceUnavailableException } from '@nestjs/common';
import type { FingerprintMatcherPort } from '../../application/ports/fingerprint-matcher.port';
import { UnconfiguredFingerprintMatcherAdapter } from './unconfigured-fingerprint-matcher.adapter';

describe('UnconfiguredFingerprintMatcherAdapter', () => {
  it('answers 503 with an explicit message, so the front can tell it from an outage', async () => {
    const matcher: FingerprintMatcherPort =
      new UnconfiguredFingerprintMatcherAdapter();

    const comparison = matcher.compare({
      caseId: 'case-1',
      traceId: 'trace-1',
      referencePrintIds: ['print-1'],
      traceDpi: 500,
      referencePrintDpis: { 'print-1': 500 },
    });

    await expect(comparison).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(comparison).rejects.toThrow(/n’est pas configurée/);
  });
});
