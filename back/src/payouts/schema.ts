import { z } from 'zod';

// Schema for a single creator's payout breakdown as produced by the
// policy-reasoning step. Mirrors the ground-truth shape in
// data/generators/orders/policy.ts (PayoutResult) — the LLM is asked
// to compute the same fields by reading policy.md + the orders. We
// then compare its output to the deterministic ground truth.

export const PayoutBreakdownSchema = z.object({
  creator_id: z.string().min(1),
  orders_counted: z.number().int().nonnegative(),
  orders_excluded: z.number().int().nonnegative(),
  gross_revenue: z.number().nonnegative(),
  total_refunds: z.number().nonnegative(),
  total_shipping: z.number().nonnegative(),
  total_platform_fees: z.number().nonnegative(),
  total_promo_credits: z.number().nonnegative(),
  commissionable_base: z.number().nonnegative(),
  commission_rate: z.number().min(0).max(1),
  gross_commission: z.number().nonnegative(),
  net_payout_native: z.number().nonnegative(),
  net_payout_usd: z.number().nonnegative(),
  meets_minimum_threshold: z.boolean(),
  payout_status: z.enum(['paid_out', 'carry_forward']),
});

export type PayoutBreakdown = z.infer<typeof PayoutBreakdownSchema>;
