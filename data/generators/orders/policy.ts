// Programmatic mirror of orders/policy.md. The reconciler under
// data/measurements/ uses this to produce ground-truth payouts that
// Claude's policy-reasoned output is scored against. If you change
// the prose policy, update this file in the same commit — they are a
// pair, not two sources of truth.

import type { Creator, CreatorTier } from '../corpus/creators.js';

export type OrderRow = {
  order_id: string;
  creator_id: string;
  order_date: string;
  gross_revenue: number;
  refunds: number;
  shipping_cost: number;
  platform_fee: number;
  promo_credit: number;
  currency: Creator['currency'];
  status: 'fulfilled' | 'cancelled' | 'pending';
};

export type PayoutResult = {
  creator_id: string;
  handle: string;
  tier: CreatorTier;
  currency: Creator['currency'];
  orders_counted: number;
  orders_excluded: number;
  gross_revenue: number;
  total_refunds: number;
  total_shipping: number;
  total_platform_fees: number;
  total_promo_credits: number;
  commissionable_base: number;
  commission_rate: number;
  gross_commission: number;
  net_payout_native: number;
  net_payout_usd: number;
  meets_minimum_threshold: boolean;
  payout_status: 'paid_out' | 'carry_forward';
};

export const COMMISSION_RATES: Record<CreatorTier, number> = {
  standard: 0.08,
  plus: 0.11,
  elite: 0.14,
};

// Fixed FX for the fixture — Claude must use exactly these.
export const FX_TO_USD: Record<Creator['currency'], number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.28,
  CAD: 0.74,
};

export const MINIMUM_PAYOUT_USD = 50.0;

export function computePayout(creator: Creator, orders: readonly OrderRow[]): PayoutResult {
  const eligible = orders.filter((o) => o.status === 'fulfilled');
  const excluded = orders.length - eligible.length;

  let grossRevenue = 0;
  let totalRefunds = 0;
  let totalShipping = 0;
  let totalPlatformFees = 0;
  let totalPromoCredits = 0;

  for (const order of eligible) {
    grossRevenue += order.gross_revenue;
    totalRefunds += order.refunds;
    totalShipping += order.shipping_cost;
    totalPlatformFees += order.platform_fee;
    totalPromoCredits += order.promo_credit;
  }

  // Elite-tier perk: promo credits do not reduce the commissionable base.
  const promoCreditDeduction = creator.tier === 'elite' ? 0 : totalPromoCredits;

  const commissionableBase = Math.max(
    0,
    grossRevenue - totalRefunds - totalShipping - totalPlatformFees - promoCreditDeduction,
  );
  const commissionRate = COMMISSION_RATES[creator.tier];
  const grossCommission = commissionableBase * commissionRate;
  const netPayoutNative = grossCommission;
  const netPayoutUsd = netPayoutNative * FX_TO_USD[creator.currency];

  const meetsThreshold = netPayoutUsd >= MINIMUM_PAYOUT_USD;

  return {
    creator_id: creator.id,
    handle: creator.handle,
    tier: creator.tier,
    currency: creator.currency,
    orders_counted: eligible.length,
    orders_excluded: excluded,
    gross_revenue: round2(grossRevenue),
    total_refunds: round2(totalRefunds),
    total_shipping: round2(totalShipping),
    total_platform_fees: round2(totalPlatformFees),
    total_promo_credits: round2(totalPromoCredits),
    commissionable_base: round2(commissionableBase),
    commission_rate: commissionRate,
    gross_commission: round2(grossCommission),
    net_payout_native: round2(netPayoutNative),
    net_payout_usd: round2(netPayoutUsd),
    meets_minimum_threshold: meetsThreshold,
    payout_status: meetsThreshold ? 'paid_out' : 'carry_forward',
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
