import Fastify from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import ejs from 'ejs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const server = Fastify({
  logger: true
});

server.register(fastifyView, {
  engine: {
    ejs: ejs
  },
  root: path.join(rootDir, 'views'),
  viewExt: 'ejs',
  options: {
    filename: path.resolve('views')
  }
});

server.register(fastifyStatic, {
  root: path.join(rootDir, 'public'),
  prefix: '/public/', // optional: default '/'
});

// Assuming report.json is located in the data directory two levels up
const reportPath = path.resolve(rootDir, '../data/measurements/output/seed-1/invoice-ocr/report.json');

async function getReportData() {
  try {
    const raw = await fs.readFile(reportPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    server.log.error(err, 'Failed to read report.json');
    return null;
  }
}

server.get('/', async (request, reply) => {
  const reportData = await getReportData();
  
  if (!reportData) {
    return reply.status(500).send('Failed to load report data');
  }

  // Define helpers similar to report.ts
  const helpers = {
    isMock: reportData.extractor === 'mock',
    formatPercent: (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`,
    formatUsd: (v: number, digits = 6) => {
      const small = Math.abs(v) < 0.01;
      return small
        ? `$${v.toFixed(digits)}`
        : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    },
    formatMs: (v: number) => {
      if (v < 1000) return `${Math.round(v)} ms`;
      return `${(v / 1000).toFixed(2)} s`;
    }
  };

  return reply.view('index.ejs', { report: reportData, ...helpers });
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is listening on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
