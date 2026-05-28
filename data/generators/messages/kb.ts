// Knowledge-base corpus the responder retrieves against. Kept as inline
// strings here so the generator can write per-fixture copies into
// data/fixtures/<seed>/messages/kb/ — that way each fixture is a
// self-contained snapshot of the KB the responder evaluated against.

export type KbArticle = {
  id: string;
  title: string;
  content: string;
};

export const KB_ARTICLES: readonly KbArticle[] = [
  {
    id: 'shipping',
    title: 'Shipping & order status',
    content: `# Shipping & order status

Orders typically ship within **2 business days** of being placed. Once an order ships, you will receive a tracking number by email.

## Standard delivery windows

- **US (lower 48):** 3–7 business days after shipping.
- **Alaska / Hawaii:** 7–14 business days after shipping.
- **Canada:** 5–10 business days after shipping (see [International](#international)).

## Order status without a tracking number

If your order has not shipped yet, the most common reasons are:

1. It is still within the 2-business-day pre-ship window.
2. One of the items is on backorder. We will email you separately when this happens.
3. The address on the order needs verification (we will reach out by email).

To check the status of a specific order, reply to your order confirmation email with the order number.

## Tracking number not updating

UPS and USPS tracking sometimes lags 24 hours behind actual movement. If your tracking has not updated in three business days, contact us and we will investigate.
`,
  },
  {
    id: 'returns',
    title: 'Returns',
    content: `# Returns

You can return any unworn item in original condition within **30 days** of delivery for a full refund of the item price.

## How to start a return

1. Reply to your order confirmation email with the order number and the item(s) you want to return.
2. We will email you a prepaid return label.
3. Drop the package at any USPS or UPS location.
4. Refunds post within 5–10 business days of us receiving the return.

## Exceptions

- **Final-sale items** (marked at checkout) cannot be returned.
- **Custom or personalized items** cannot be returned unless they arrived defective.
- **Bundles** must be returned in full — we cannot accept partial bundle returns.

## Damaged or wrong items

If an item arrived damaged or we shipped the wrong item, **do not start a return** — instead, email us with a photo. We will send a replacement and arrange the return on our end at no cost to you.
`,
  },
  {
    id: 'refunds',
    title: 'Refunds',
    content: `# Refunds

Once we receive a returned item, refunds are processed within **5–10 business days**. The refund posts to the original payment method.

## Where to see your refund

- **Credit cards:** The refund will appear as a credit on your statement. Banks vary in how quickly this surfaces — some show same-day, others take a full statement cycle.
- **Apple Pay / Google Pay:** The refund posts to the underlying card you used.
- **Gift cards / store credit:** The refund posts back to the store-credit balance immediately upon processing.

## Refund hasn't arrived

If it has been more than 10 business days since you received our refund confirmation email and you do not see the refund, contact us with the order number. We will pull the transaction record and follow up.

## Partial refunds

If only some items in your order are being returned, the refund equals the sum of those items' prices. **Shipping fees on the original order are not refunded** unless the return was due to our error.
`,
  },
  {
    id: 'sizing',
    title: 'Sizing',
    content: `# Sizing

Our items generally run **true to size**. If you are between sizes, we recommend sizing up for tops and outerwear, and sizing down for bottoms.

## Size chart

Full size charts by category are available on each product page under the "Sizing" tab. The chart includes measurements in both inches and centimeters.

## Common questions

- **Tees:** True to size. Relaxed fit through the body.
- **Outerwear:** True to size. Designed to layer over a tee or light sweater.
- **Bottoms:** Run slightly large in the waist. Size down if you are between sizes.

## What if it doesn't fit

Returns are free within 30 days — see [Returns](returns). If you exchange for a different size, we cover return shipping but not outbound shipping on the replacement.
`,
  },
  {
    id: 'international',
    title: 'International shipping',
    content: `# International shipping

We currently ship to the following countries: **United States, Canada, United Kingdom, and EU member states**.

## Delivery times

- **Canada:** 5–10 business days after shipping.
- **United Kingdom:** 7–14 business days after shipping.
- **EU:** 7–14 business days after shipping.

## Duties and taxes

International orders may be subject to customs duties and import taxes determined by the destination country. **These charges are not included in the order total** and are the responsibility of the recipient.

## Returns from outside the US

International returns are accepted within the same 30-day window, but the customer is responsible for return shipping costs. Email us before sending a return so we can flag it for customs processing.
`,
  },
  {
    id: 'warranty',
    title: 'Warranty',
    content: `# Warranty

Our products carry a **one-year limited warranty** against manufacturing defects. The warranty does not cover normal wear, cosmetic damage from use, or damage caused by accident or misuse.

## How to file a claim

Email us with:

1. The order number (or proof of purchase if purchased through a retailer).
2. A photo or short video showing the defect.
3. A description of how the issue appeared.

Most claims are decided within 3 business days. If approved, we will either send a replacement or refund the item, at our discretion.

## What is covered

- Stitching failure within normal use.
- Hardware failure (zippers, buttons, snaps).
- Fabric defects present from manufacturing.

## What is not covered

- Normal wear and tear over time.
- Damage from improper care (e.g. machine-washing items marked dry-clean only).
- Cosmetic damage from accidents (rips, snags, stains).
`,
  },
  {
    id: 'cancellations',
    title: 'Cancellations',
    content: `# Cancellations

You can cancel an order **before it ships**. Once an order has shipped, it cannot be cancelled — you can return it for a refund under our [Returns](returns) policy.

## How to cancel

Reply to your order confirmation email with the word "cancel" and the order number. If the order has not yet entered the fulfillment queue, we will cancel it and issue a full refund within 1–2 business days.

## Cancellation timing

- **Within 1 hour of placing:** Almost always cancellable.
- **Same day:** Usually cancellable.
- **After fulfillment has started:** May not be cancellable. We will try and let you know.
- **After shipment:** Not cancellable. Return for refund once delivered.

## Partial cancellations

We cannot cancel individual items from a multi-item order once it enters fulfillment. If you need to drop an item, the cleanest path is to receive the order and return that item.
`,
  },
  {
    id: 'account',
    title: 'Account help',
    content: `# Account help

## Password reset

To reset your password:

1. Go to the sign-in page and click "Forgot password."
2. Enter the email address on your account.
3. Check your inbox (and spam folder) for the reset email — it typically arrives within 2 minutes.
4. Click the link in the email; it stays valid for 1 hour.

If the link says it has expired, request a new one. Reset emails are single-use — if you clicked the link once already, you need a fresh one.

## Updating your email or shipping address

Sign in, go to **Account → Settings**. You can change your email, shipping address, and notification preferences there. Changes to a shipping address only affect future orders — to change shipping on an in-flight order, contact us.

## Deleting your account

Email us and we will delete your account and associated data within 30 days. You will receive a confirmation email when the deletion is complete.
`,
  },
  {
    id: 'contact',
    title: 'Contacting us',
    content: `# Contacting us

The fastest way to reach us is by replying to any order confirmation email — that gets routed directly to our support queue.

## Response times

- **Email:** Typically within 1 business day.
- **Chat (business hours):** Typically within 15 minutes.

## For urgent issues

If you have a safety concern, a fraud claim, or a damaged-on-arrival item, write **URGENT** in the subject line. Our team triages those first.
`,
  },
  {
    id: 'payments',
    title: 'Payments & billing',
    content: `# Payments & billing

We accept Visa, Mastercard, American Express, Discover, Apple Pay, Google Pay, and store credit.

## When your card is charged

Your card is **authorized** when you place the order and **charged** when the order ships. If you see two transactions on your statement during the gap, only the charge (not the authorization) reflects an actual debit.

## Duplicate charges

If you see two identical charges from us, the most likely cause is a card auth that did not drop off before the final charge posted. Banks usually release the auth within 5–7 business days. If both charges have cleared and posted (rather than one being pending), contact us with the order number and we will investigate.

## Tax

Sales tax is calculated at checkout based on the shipping address.
`,
  },
];
