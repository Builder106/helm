export type MessageIntent =
  | 'order_status'
  | 'return_request'
  | 'refund_status'
  | 'shipping_change'
  | 'product_question'
  | 'cancellation'
  | 'complaint'
  | 'account_help'
  | 'needs_human';

export type ExpectedAction = 'auto_send' | 'review' | 'escalate';

export type CustomerMessage = {
  message_id: string;
  channel: 'email' | 'chat';
  received_at: string;
  customer_name: string;
  customer_email: string;
  order_id: string | null;
  subject: string | null;
  body: string;
};

export type MessageLabel = {
  message_id: string;
  intent: MessageIntent;
  canonical_kb_id: string | null;
  expected_action: ExpectedAction;
  needs_human_reason: string | null;
};
