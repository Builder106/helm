import { describe, expect, test } from 'vitest';
import { computePayout, COMMISSION_RATES, FX_TO_USD, MINIMUM_PAYOUT_USD } from './policy.js';
import type { OrderRow } from './policy.js';
import type { Creator } from '../corpus/creators.js';

function order(over: Partial<OrderRow> = {}): OrderRow {
  return {
    order_id: 'o-test-0001',
    creator_id: 'c-test',
    order_date: '2026-04-15',
    gross_revenue: 100.0,
    refunds: 0.0,
    shipping_cost: 0.0,
    platform_fee: 2.0,
    promo_credit: 0.0,
    currency: 'USD',
    status: 'fulfilled',
    ...over,
  };
}

function creator(over: Partial<Creator> = {}): Creator {
  return {
    id: 'c-test',
    handle: '@test',
    tier: 'standard',
    primaryCategory: 'tech',
    currency: 'USD',
    region: 'NA',
    ...over,
  };
}

describe('computePayout', () => {
  test('applies the correct rate per tier', () => {
    const cStd = creator({ tier: 'standard' });
    const cPlus = creator({ tier: 'plus' });
    const cElite = creator({ tier: 'elite' });

    // gross 100, fee 2 → base 98 → commission depends on tier
    const orders = [order()];

    expect(computePayout(cStd, orders).commission_rate).toBe(COMMISSION_RATES.standard);
    expect(computePayout(cPlus, orders).commission_rate).toBe(COMMISSION_RATES.plus);
    expect(computePayout(cElite, orders).commission_rate).toBe(COMMISSION_RATES.elite);
  });

  test('only fulfilled orders count toward the base', () => {
    const c = creator();
    const orders: OrderRow[] = [
      order({ order_id: 'o-1', status: 'fulfilled', gross_revenue: 100, platform_fee: 2 }),
      order({ order_id: 'o-2', status: 'cancelled', gross_revenue: 999, platform_fee: 20 }),
      order({ order_id: 'o-3', status: 'pending', gross_revenue: 500, platform_fee: 10 }),
    ];
    const result = computePayout(c, orders);
    expect(result.orders_counted).toBe(1);
    expect(result.orders_excluded).toBe(2);
    expect(result.gross_revenue).toBe(100);
  });

  test('elite tier does not deduct promo credits from the base', () => {
    const cStd = creator({ tier: 'standard' });
    const cElite = creator({ tier: 'elite' });
    const orders = [order({ promo_credit: 20.0 })]; // gross 100, fee 2, promo 20

    const std = computePayout(cStd, orders);
    const elite = computePayout(cElite, orders);

    // Standard: base = 100 - 0 - 0 - 2 - 20 = 78. Elite: base = 100 - 0 - 0 - 2 - 0 = 98.
    expect(std.commissionable_base).toBe(78);
    expect(elite.commissionable_base).toBe(98);
  });

  test('refunds + shipping + platform fees all subtract from the base', () => {
    const c = creator({ tier: 'standard' });
    const orders = [
      order({ gross_revenue: 200, refunds: 30, shipping_cost: 15, platform_fee: 4, promo_credit: 0 }),
    ];
    const result = computePayout(c, orders);
    // base = 200 - 30 - 15 - 4 - 0 = 151
    expect(result.commissionable_base).toBe(151);
    // commission = 151 * 0.08 = 12.08
    expect(result.gross_commission).toBeCloseTo(12.08, 2);
  });

  test('commission base is clamped to zero when deductions exceed revenue', () => {
    const c = creator({ tier: 'standard' });
    const orders = [
      // Refund larger than gross — base would be negative without the clamp.
      order({ gross_revenue: 50, refunds: 100, platform_fee: 1 }),
    ];
    const result = computePayout(c, orders);
    expect(result.commissionable_base).toBe(0);
    expect(result.gross_commission).toBe(0);
  });

  test('currency conversion uses the fixed FX table', () => {
    const cEur = creator({ tier: 'standard', currency: 'EUR' });
    const orders = [order({ currency: 'EUR', gross_revenue: 1000, platform_fee: 20 })];
    // base 980, commission 78.4 EUR, USD = 78.4 * 1.09 ≈ 85.46
    const result = computePayout(cEur, orders);
    expect(result.net_payout_native).toBeCloseTo(78.4, 2);
    expect(result.net_payout_usd).toBeCloseTo(78.4 * FX_TO_USD.EUR, 2);
  });

  test('payouts under the minimum carry forward instead of paying', () => {
    const c = creator({ tier: 'standard' });
    // One small order — commission well under $50.
    const orders = [order({ gross_revenue: 30, platform_fee: 0.6 })];
    const result = computePayout(c, orders);
    expect(result.meets_minimum_threshold).toBe(false);
    expect(result.payout_status).toBe('carry_forward');
    expect(result.net_payout_usd).toBeLessThan(MINIMUM_PAYOUT_USD);
  });

  test('payouts at or above the minimum pay out', () => {
    const c = creator({ tier: 'elite' });
    // Elite at 14%, need base ≥ ~357 to clear $50.
    const orders = [
      order({ gross_revenue: 400, platform_fee: 8 }),
      order({ gross_revenue: 400, platform_fee: 8 }),
    ];
    const result = computePayout(c, orders);
    expect(result.meets_minimum_threshold).toBe(true);
    expect(result.payout_status).toBe('paid_out');
    expect(result.net_payout_usd).toBeGreaterThanOrEqual(MINIMUM_PAYOUT_USD);
  });

  test('all monetary fields are rounded to two decimals', () => {
    const c = creator({ tier: 'plus' });
    // 0.11 × 91.333 = 10.04663 — should be rounded to 10.05.
    const orders = [order({ gross_revenue: 95.333, platform_fee: 4.0 })];
    const result = computePayout(c, orders);
    const allCents = [
      result.gross_revenue,
      result.total_refunds,
      result.total_shipping,
      result.total_platform_fees,
      result.total_promo_credits,
      result.commissionable_base,
      result.gross_commission,
      result.net_payout_native,
      result.net_payout_usd,
    ];
    for (const v of allCents) {
      expect(v).toBe(Math.round(v * 100) / 100);
    }
  });
});
