import { describe, expect, it } from 'vitest';
import { PayoutBreakdownSchema } from './schema.js';

describe('PayoutBreakdownSchema', () => {
  const validPayout = {
    creator_id: 'c-001',
    orders_counted: 12,
    orders_excluded: 2,
    gross_revenue: 1200.5,
    total_refunds: 50.0,
    total_shipping: 30.0,
    total_platform_fees: 60.0,
    total_promo_credits: 20.0,
    commissionable_base: 1040.5,
    commission_rate: 0.15,
    gross_commission: 156.08,
    net_payout_native: 156.08,
    net_payout_usd: 156.08,
    meets_minimum_threshold: true,
    payout_status: 'paid_out' as const,
  };

  it('validates a correct payout breakdown record', () => {
    const parsed = PayoutBreakdownSchema.parse(validPayout);
    expect(parsed).toEqual(validPayout);
  });

  it('accepts carry_forward payout status', () => {
    const carryForward = {
      ...validPayout,
      meets_minimum_threshold: false,
      payout_status: 'carry_forward' as const,
    };
    const parsed = PayoutBreakdownSchema.parse(carryForward);
    expect(parsed.payout_status).toBe('carry_forward');
  });

  it('rejects invalid commission rates or negative values', () => {
    expect(() =>
      PayoutBreakdownSchema.parse({
        ...validPayout,
        commission_rate: 1.25,
      })
    ).toThrow();

    expect(() =>
      PayoutBreakdownSchema.parse({
        ...validPayout,
        commission_rate: -0.1,
      })
    ).toThrow();

    expect(() =>
      PayoutBreakdownSchema.parse({
        ...validPayout,
        gross_revenue: -100,
      })
    ).toThrow();

    expect(() =>
      PayoutBreakdownSchema.parse({
        ...validPayout,
        orders_counted: -1,
      })
    ).toThrow();
  });

  it('rejects unrecognized payout status enum values', () => {
    expect(() =>
      PayoutBreakdownSchema.parse({
        ...validPayout,
        payout_status: 'pending' as never,
      })
    ).toThrow();
  });
});
