import { Injectable } from '@nestjs/common';

/**
 * Result of a GSM acceptance check.
 */
export interface GsmCheckResult {
  /** Absolute variance percent (always positive) */
  variance: number;
  /** Signed variance (can be negative if actual < standard) */
  signedVariance: number;
  /** Whether the measurement is within the tolerance */
  accepted: boolean;
  /** Severity classification for UI color coding */
  severity: 'OK' | 'WARN' | 'REJECT';
}

/**
 * Service for validating GSM (grams per square metre) measurements.
 *
 * Used at goods receive time to decide whether a roll should be accepted,
 * warned about, or quarantined. Tolerance is normally defined per
 * ProductVariant (`standardGSM` / `gsmTolerance`) but can be overridden.
 */
@Injectable()
export class GsmCheckService {
  /**
   * Compare a measured GSM against the standard and tolerance.
   *
   * @param standardGSM target grams per square metre
   * @param actualGSM measured grams per square metre
   * @param tolerance allowed variance percent (defaults to 5)
   */
  check(
    standardGSM: number,
    actualGSM: number,
    tolerance: number = 5,
  ): GsmCheckResult {
    if (standardGSM <= 0) {
      // No reference — cannot compute, treat as OK with zero variance
      return {
        variance: 0,
        signedVariance: 0,
        accepted: true,
        severity: 'OK',
      };
    }

    const signed = ((actualGSM - standardGSM) / standardGSM) * 100;
    const variance = Math.abs(signed);
    const accepted = variance <= tolerance;

    let severity: GsmCheckResult['severity'];
    if (variance <= tolerance * 0.6) severity = 'OK';
    else if (variance <= tolerance) severity = 'WARN';
    else severity = 'REJECT';

    return {
      variance: Number(variance.toFixed(2)),
      signedVariance: Number(signed.toFixed(2)),
      accepted,
      severity,
    };
  }
}
