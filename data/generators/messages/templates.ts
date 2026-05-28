// Curated message templates. Each template carries its intent, the KB
// article the canonical answer lives in, and the expected action. {{slots}}
// are filled by the generator from the customer/order corpora.

import type { ExpectedAction, MessageIntent } from './types.js';

export type MessageTemplate = {
  intent: MessageIntent;
  canonical_kb_id: string | null;
  expected_action: ExpectedAction;
  channel: 'email' | 'chat';
  needs_order_id: boolean;
  subject: string | null;
  body: string;
  needs_human_reason?: string;
};

export const TEMPLATES: readonly MessageTemplate[] = [
  // order_status — auto_send
  {
    intent: 'order_status',
    canonical_kb_id: 'shipping',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: true,
    subject: 'Where is my order {{order_id}}?',
    body: 'Hi, I placed order {{order_id}} on {{order_date}} and I have not seen any updates. Can you let me know when it will ship?\n\nThanks,\n{{customer_first}}',
  },
  {
    intent: 'order_status',
    canonical_kb_id: 'shipping',
    expected_action: 'auto_send',
    channel: 'chat',
    needs_order_id: true,
    subject: null,
    body: 'hey order {{order_id}} — still pending? been a few days',
  },
  {
    intent: 'order_status',
    canonical_kb_id: 'shipping',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: true,
    subject: 'Tracking number for {{order_id}}',
    body: 'Hello, could you please send me the tracking number for order {{order_id}}? I want to confirm the expected delivery date.\n\nBest,\n{{customer_first}}',
  },
  {
    intent: 'order_status',
    canonical_kb_id: 'shipping',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: true,
    subject: 'Order shipped?',
    body: 'Hi — has order {{order_id}} shipped yet? Trying to plan around delivery.\n\n{{customer_first}}',
  },

  // return_request — review (most returns are simple but want a human glance)
  {
    intent: 'return_request',
    canonical_kb_id: 'returns',
    expected_action: 'review',
    channel: 'email',
    needs_order_id: true,
    subject: 'Return request for {{order_id}}',
    body: 'Hi, I would like to return an item from order {{order_id}}. Could you start the return process for me?\n\nThanks,\n{{customer_first}}',
  },
  {
    intent: 'return_request',
    canonical_kb_id: 'returns',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: true,
    subject: 'Return policy question',
    body: 'Hi, what is your return window? I might want to send back something from order {{order_id}}.\n\n{{customer_first}}',
  },
  {
    intent: 'return_request',
    canonical_kb_id: 'returns',
    expected_action: 'review',
    channel: 'chat',
    needs_order_id: true,
    subject: null,
    body: 'need to return order {{order_id}}, doesnt fit',
  },

  // refund_status — review
  {
    intent: 'refund_status',
    canonical_kb_id: 'refunds',
    expected_action: 'review',
    channel: 'email',
    needs_order_id: true,
    subject: 'Refund status for {{order_id}}',
    body: 'Hi, I returned the items from order {{order_id}} about a week ago but I still have not seen the refund on my card. Can you check?\n\nThanks,\n{{customer_first}}',
  },
  {
    intent: 'refund_status',
    canonical_kb_id: 'refunds',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: false,
    subject: 'How long do refunds take?',
    body: 'Hi, just curious how long refunds typically take to post back to a card?\n\n{{customer_first}}',
  },

  // shipping_change — review (could affect order in flight)
  {
    intent: 'shipping_change',
    canonical_kb_id: 'shipping',
    expected_action: 'review',
    channel: 'email',
    needs_order_id: true,
    subject: 'Address change for {{order_id}}',
    body: 'Hi, I need to change the shipping address on order {{order_id}}. New address: 14 Riverbend Rd, Madison, WI 53704. Please update before it ships.\n\n{{customer_first}}',
  },
  {
    intent: 'shipping_change',
    canonical_kb_id: 'shipping',
    expected_action: 'review',
    channel: 'chat',
    needs_order_id: true,
    subject: null,
    body: 'can you change shipping address for {{order_id}}? moved last week',
  },

  // product_question — auto_send (KB answers most of these)
  {
    intent: 'product_question',
    canonical_kb_id: 'sizing',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: false,
    subject: 'Sizing question',
    body: 'Hi, I am between sizes — do your tees run small, true to size, or large?\n\n{{customer_first}}',
  },
  {
    intent: 'product_question',
    canonical_kb_id: 'international',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: false,
    subject: 'Ship to Canada?',
    body: 'Do you ship to Canada? Looking at a few items but want to know the shipping situation first.\n\nThanks,\n{{customer_first}}',
  },
  {
    intent: 'product_question',
    canonical_kb_id: 'warranty',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: false,
    subject: 'Warranty?',
    body: 'Hi, is there a warranty on your gear? I work in a kitchen and my tools take a beating.\n\n{{customer_first}}',
  },
  {
    intent: 'product_question',
    canonical_kb_id: 'sizing',
    expected_action: 'auto_send',
    channel: 'chat',
    needs_order_id: false,
    subject: null,
    body: 'do you have a size chart anywhere?',
  },

  // cancellation — review (timing dependent)
  {
    intent: 'cancellation',
    canonical_kb_id: 'cancellations',
    expected_action: 'review',
    channel: 'email',
    needs_order_id: true,
    subject: 'Cancel order {{order_id}}',
    body: 'Hi, can you please cancel order {{order_id}}? I placed it by mistake.\n\nThanks,\n{{customer_first}}',
  },
  {
    intent: 'cancellation',
    canonical_kb_id: 'cancellations',
    expected_action: 'review',
    channel: 'chat',
    needs_order_id: true,
    subject: null,
    body: 'cancel {{order_id}} pls',
  },

  // complaint — review (most are recoverable, some escalate)
  {
    intent: 'complaint',
    canonical_kb_id: 'returns',
    expected_action: 'review',
    channel: 'email',
    needs_order_id: true,
    subject: 'Damaged item in {{order_id}}',
    body: 'Hi, one of the items in order {{order_id}} arrived broken. The box was fine but the contents shifted. Photo attached. Can you send a replacement?\n\nThanks,\n{{customer_first}}',
  },
  {
    intent: 'complaint',
    canonical_kb_id: 'returns',
    expected_action: 'review',
    channel: 'email',
    needs_order_id: true,
    subject: 'Wrong item shipped',
    body: 'Hi, order {{order_id}} arrived but it is the wrong color. I ordered the navy and got the cream. Could you send the right one?\n\n{{customer_first}}',
  },

  // account_help — auto_send for password resets, review for billing-tied account issues
  {
    intent: 'account_help',
    canonical_kb_id: 'account',
    expected_action: 'auto_send',
    channel: 'email',
    needs_order_id: false,
    subject: 'Password reset',
    body: 'Hi, the password reset link in your email is not working for me — it says expired even though I just clicked it. Can you send a fresh one?\n\n{{customer_first}}',
  },
  {
    intent: 'account_help',
    canonical_kb_id: 'account',
    expected_action: 'auto_send',
    channel: 'chat',
    needs_order_id: false,
    subject: null,
    body: 'cant log in. password reset broken',
  },

  // needs_human — escalate (legal threats, fraud claims, multi-issue, dispute language)
  {
    intent: 'needs_human',
    canonical_kb_id: null,
    expected_action: 'escalate',
    channel: 'email',
    needs_order_id: true,
    subject: 'CHARGEBACK INCOMING for {{order_id}}',
    body: 'Order {{order_id}} never arrived. I have been emailing for two weeks and nobody responds. I am filing a chargeback with my bank tomorrow if I do not hear back today.\n\n{{customer_first}}',
    needs_human_reason: 'chargeback threat',
  },
  {
    intent: 'needs_human',
    canonical_kb_id: null,
    expected_action: 'escalate',
    channel: 'email',
    needs_order_id: false,
    subject: 'Fraudulent charge',
    body: 'I did not order anything from you. There is a charge on my card from your company. I want to know how you got my card number and I want the charge reversed today.\n\n{{customer_first}}',
    needs_human_reason: 'fraud claim',
  },
  {
    intent: 'needs_human',
    canonical_kb_id: null,
    expected_action: 'escalate',
    channel: 'email',
    needs_order_id: true,
    subject: 'Multiple issues with {{order_id}}',
    body: 'Order {{order_id}}: half the items are missing, the one that arrived is damaged, the box was clearly opened in transit, and the shipping label has the wrong name on it. I want a full refund and a call about how this happened.\n\n{{customer_first}}',
    needs_human_reason: 'multi-issue complaint',
  },
  {
    intent: 'needs_human',
    canonical_kb_id: null,
    expected_action: 'escalate',
    channel: 'email',
    needs_order_id: false,
    subject: 'Allergy / safety concern',
    body: 'I had a reaction to one of your products and the ingredients list on the box does not match what is on your website. I would like to speak to someone about this before it happens to someone else.\n\n{{customer_first}}',
    needs_human_reason: 'safety / liability',
  },
  {
    intent: 'needs_human',
    canonical_kb_id: null,
    expected_action: 'escalate',
    channel: 'email',
    needs_order_id: true,
    subject: 'Legal',
    body: 'Order {{order_id}} contained an item that was patented by my client. Please remove this product from your store and contact our office immediately.\n\nRegards,\n{{customer_first}}',
    needs_human_reason: 'legal / IP threat',
  },
];

export const FIRST_NAMES: readonly string[] = [
  'Avery', 'Bao', 'Cara', 'Diego', 'Esi', 'Felix', 'Gita', 'Harlan',
  'Imani', 'Jorge', 'Kira', 'Lin', 'Maya', 'Niko', 'Omar', 'Priya',
  'Quinn', 'Rosa', 'Sam', 'Tomas', 'Una', 'Viv', 'Wren', 'Xan',
  'Yusuf', 'Zoe', 'Amara', 'Bryn', 'Cole', 'Dani',
];

export const LAST_NAMES: readonly string[] = [
  'Ahmed', 'Beck', 'Cho', 'Diaz', 'Espinoza', 'Forrest', 'Goldberg', 'Hayes',
  'Ibarra', 'Jensen', 'Kapoor', 'Liang', 'Mboya', 'Nguyen', 'Okoro', 'Patel',
  'Quinones', 'Riley', 'Sato', 'Tanaka', 'Underwood', 'Vargas', 'Walsh', 'Xu',
  'Young', 'Zeller',
];

export const ORDER_ID_PREFIXES: readonly string[] = ['ORD', 'WO', 'INV'];
