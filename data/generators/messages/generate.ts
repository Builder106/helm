import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRng } from '../rng.js';
import {
  FIRST_NAMES,
  LAST_NAMES,
  ORDER_ID_PREFIXES,
  TEMPLATES,
  type MessageTemplate,
} from './templates.js';
import { KB_ARTICLES } from './kb.js';
import type { CustomerMessage, MessageLabel } from './types.js';

export type GenerateMessagesOptions = {
  seed: number | string;
  count: number;
  outputDir: string;
};

export type GenerateMessagesResult = {
  count: number;
  intentCounts: Record<string, number>;
  outputDir: string;
};

export async function generateMessages(options: GenerateMessagesOptions): Promise<GenerateMessagesResult> {
  const rng = createRng(options.seed);
  await mkdir(options.outputDir, { recursive: true });
  await mkdir(join(options.outputDir, 'kb'), { recursive: true });

  const messages: CustomerMessage[] = [];
  const labels: MessageLabel[] = [];
  const intentCounts: Record<string, number> = {};

  for (let i = 0; i < options.count; i++) {
    const msgRng = rng.fork(`msg:${i}`);
    const template = msgRng.pick(TEMPLATES);
    const { message, label } = buildMessage(msgRng, template, i);
    messages.push(message);
    labels.push(label);
    intentCounts[label.intent] = (intentCounts[label.intent] ?? 0) + 1;
  }

  await writeFile(
    join(options.outputDir, 'messages.jsonl'),
    messages.map((m) => JSON.stringify(m)).join('\n') + '\n',
    'utf8',
  );
  await writeFile(
    join(options.outputDir, 'labels.json'),
    JSON.stringify(labels, null, 2),
    'utf8',
  );

  for (const article of KB_ARTICLES) {
    await writeFile(join(options.outputDir, 'kb', `${article.id}.md`), article.content, 'utf8');
  }

  await writeFile(
    join(options.outputDir, 'manifest.json'),
    JSON.stringify(
      {
        seed: options.seed,
        count: messages.length,
        intentCounts,
        kbArticleCount: KB_ARTICLES.length,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  return {
    count: messages.length,
    intentCounts,
    outputDir: options.outputDir,
  };
}

function buildMessage(
  rng: ReturnType<typeof createRng>,
  template: MessageTemplate,
  index: number,
): { message: CustomerMessage; label: MessageLabel } {
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  const customerName = `${firstName} ${lastName}`;
  const customerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const orderId = template.needs_order_id ? randomOrderId(rng) : null;
  const orderDate = randomDateInRange(rng, '2026-04-01', '2026-05-25');

  const slots: Record<string, string> = {
    order_id: orderId ?? 'unknown',
    order_date: orderDate,
    customer_first: firstName,
    customer_full: customerName,
  };

  const subject = template.subject ? fillSlots(template.subject, slots) : null;
  const body = fillSlots(template.body, slots);

  const messageId = `msg-${String(index + 1).padStart(5, '0')}`;
  const receivedAt = randomDateInRange(rng, '2026-04-15', '2026-05-25');

  return {
    message: {
      message_id: messageId,
      channel: template.channel,
      received_at: `${receivedAt}T${randomTimeOfDay(rng)}Z`,
      customer_name: customerName,
      customer_email: customerEmail,
      order_id: orderId,
      subject,
      body,
    },
    label: {
      message_id: messageId,
      intent: template.intent,
      canonical_kb_id: template.canonical_kb_id,
      expected_action: template.expected_action,
      needs_human_reason: template.needs_human_reason ?? null,
    },
  };
}

function fillSlots(template: string, slots: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => slots[key] ?? `{{${key}}}`);
}

function randomOrderId(rng: ReturnType<typeof createRng>): string {
  const prefix = rng.pick(ORDER_ID_PREFIXES);
  const n = rng.range(10000, 999999);
  return `${prefix}-${n}`;
}

function randomDateInRange(rng: ReturnType<typeof createRng>, startIso: string, endIso: string): string {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const t = start + Math.floor(rng.next() * (end - start));
  return new Date(t).toISOString().slice(0, 10);
}

function randomTimeOfDay(rng: ReturnType<typeof createRng>): string {
  const h = String(rng.range(0, 24)).padStart(2, '0');
  const m = String(rng.range(0, 60)).padStart(2, '0');
  const s = String(rng.range(0, 60)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
