# Creator Payout Policy — April 2026

This is the policy the Helm reconciler applies to monthly creator orders. The platform pays creators based on the rules below.

## Eligibility

Only orders with status `fulfilled` count toward the monthly payout. Orders that are `cancelled` or `pending` are excluded entirely — they do not contribute to gross revenue, refunds, shipping, fees, or promo credits.

## Commission tiers

Creators are placed in one of three tiers based on their contract:

- **Standard** — 8% commission on commissionable base.
- **Plus** — 11% commission on commissionable base.
- **Elite** — 14% commission on commissionable base.

## Commissionable base

The commissionable base is computed per creator across all eligible orders for the period:

```
commissionable_base =
    sum(gross_revenue)
  - sum(refunds)
  - sum(shipping_cost)
  - sum(platform_fee)
  - promo_credit_deduction
```

The `promo_credit_deduction` depends on tier:

- **Standard and Plus**: `promo_credit_deduction = sum(promo_credit)`.
- **Elite**: `promo_credit_deduction = 0` (Elite-tier perk — promo credits do not reduce their base).

If the commissionable base would be negative, it is clamped to zero.

## Gross commission and net payout

`gross_commission = commissionable_base × commission_rate`. `net_payout_native` equals `gross_commission` (no further deductions apply in the current policy).

## Currency conversion

Net payout is also reported in USD using these fixed FX rates for the period:

| Currency | USD per 1 unit |
| --- | --- |
| USD | 1.00 |
| EUR | 1.09 |
| GBP | 1.28 |
| CAD | 0.74 |

`net_payout_usd = net_payout_native × fx_to_usd[currency]`.

## Minimum payout threshold

If `net_payout_usd < $50.00`, the creator's balance is **not paid out this period** — it carries forward to next month. The payout status is `carry_forward`. Otherwise the status is `paid_out`.

## Rounding

All monetary values are rounded to the nearest cent (two decimal places) at each step.
