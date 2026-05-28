// Creator corpus for the payout reconciler fixture. Names are plausible
// handles in the SMB-creator-commerce space. Tier assignment lives here
// so the generator's order rows reflect a real creator population.

export type CreatorTier = 'standard' | 'plus' | 'elite';

export type Creator = {
  id: string;
  handle: string;
  tier: CreatorTier;
  primaryCategory: 'beauty' | 'fashion' | 'fitness' | 'home' | 'tech' | 'food';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  region: 'NA' | 'EU' | 'UK' | 'APAC';
};

export const CREATORS: readonly Creator[] = [
  { id: 'c-001', handle: '@laurelandsage', tier: 'elite', primaryCategory: 'beauty', currency: 'USD', region: 'NA' },
  { id: 'c-002', handle: '@morningbarrow', tier: 'plus', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-003', handle: '@runnerstype', tier: 'standard', primaryCategory: 'fitness', currency: 'USD', region: 'NA' },
  { id: 'c-004', handle: '@theatticedits', tier: 'plus', primaryCategory: 'fashion', currency: 'EUR', region: 'EU' },
  { id: 'c-005', handle: '@batchnotbought', tier: 'standard', primaryCategory: 'food', currency: 'USD', region: 'NA' },
  { id: 'c-006', handle: '@chiplabsbeauty', tier: 'elite', primaryCategory: 'beauty', currency: 'GBP', region: 'UK' },
  { id: 'c-007', handle: '@kindredkit', tier: 'plus', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-008', handle: '@protocolfit', tier: 'standard', primaryCategory: 'fitness', currency: 'CAD', region: 'NA' },
  { id: 'c-009', handle: '@oakfacedstudio', tier: 'plus', primaryCategory: 'fashion', currency: 'USD', region: 'NA' },
  { id: 'c-010', handle: '@northfacelab', tier: 'elite', primaryCategory: 'fitness', currency: 'USD', region: 'NA' },
  { id: 'c-011', handle: '@quietmonth', tier: 'standard', primaryCategory: 'home', currency: 'EUR', region: 'EU' },
  { id: 'c-012', handle: '@wandercoded', tier: 'plus', primaryCategory: 'tech', currency: 'USD', region: 'NA' },
  { id: 'c-013', handle: '@halflightcollection', tier: 'standard', primaryCategory: 'beauty', currency: 'USD', region: 'NA' },
  { id: 'c-014', handle: '@everydaybatch', tier: 'standard', primaryCategory: 'food', currency: 'USD', region: 'NA' },
  { id: 'c-015', handle: '@cedarmeasure', tier: 'plus', primaryCategory: 'home', currency: 'CAD', region: 'NA' },
  { id: 'c-016', handle: '@nightowltype', tier: 'standard', primaryCategory: 'tech', currency: 'USD', region: 'NA' },
  { id: 'c-017', handle: '@parlourgrade', tier: 'elite', primaryCategory: 'beauty', currency: 'USD', region: 'NA' },
  { id: 'c-018', handle: '@flatlandstyle', tier: 'plus', primaryCategory: 'fashion', currency: 'USD', region: 'NA' },
  { id: 'c-019', handle: '@formandfilament', tier: 'standard', primaryCategory: 'tech', currency: 'EUR', region: 'EU' },
  { id: 'c-020', handle: '@deependsupply', tier: 'plus', primaryCategory: 'fitness', currency: 'USD', region: 'NA' },
  { id: 'c-021', handle: '@homemakeover.diy', tier: 'standard', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-022', handle: '@brightnotebook', tier: 'plus', primaryCategory: 'tech', currency: 'GBP', region: 'UK' },
  { id: 'c-023', handle: '@longshelfstaples', tier: 'standard', primaryCategory: 'food', currency: 'USD', region: 'NA' },
  { id: 'c-024', handle: '@formulanorth', tier: 'elite', primaryCategory: 'beauty', currency: 'CAD', region: 'NA' },
  { id: 'c-025', handle: '@kitthesound', tier: 'plus', primaryCategory: 'tech', currency: 'USD', region: 'NA' },
  { id: 'c-026', handle: '@dailyrepetition', tier: 'standard', primaryCategory: 'fitness', currency: 'USD', region: 'NA' },
  { id: 'c-027', handle: '@littleroomfinds', tier: 'plus', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-028', handle: '@porchlight.market', tier: 'standard', primaryCategory: 'food', currency: 'USD', region: 'NA' },
  { id: 'c-029', handle: '@firstprinciples.fit', tier: 'plus', primaryCategory: 'fitness', currency: 'EUR', region: 'EU' },
  { id: 'c-030', handle: '@onthewall.studio', tier: 'standard', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-031', handle: '@laundryandlight', tier: 'plus', primaryCategory: 'beauty', currency: 'USD', region: 'NA' },
  { id: 'c-032', handle: '@archivedfit', tier: 'standard', primaryCategory: 'fashion', currency: 'GBP', region: 'UK' },
  { id: 'c-033', handle: '@curatingdaily', tier: 'elite', primaryCategory: 'fashion', currency: 'USD', region: 'NA' },
  { id: 'c-034', handle: '@northcoastpantry', tier: 'plus', primaryCategory: 'food', currency: 'CAD', region: 'NA' },
  { id: 'c-035', handle: '@theslowlist', tier: 'standard', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-036', handle: '@workinggreen', tier: 'plus', primaryCategory: 'tech', currency: 'USD', region: 'NA' },
  { id: 'c-037', handle: '@kelpfarm.creative', tier: 'standard', primaryCategory: 'beauty', currency: 'USD', region: 'NA' },
  { id: 'c-038', handle: '@theglassdesk', tier: 'plus', primaryCategory: 'tech', currency: 'USD', region: 'NA' },
  { id: 'c-039', handle: '@longerlight.studio', tier: 'standard', primaryCategory: 'fashion', currency: 'USD', region: 'NA' },
  { id: 'c-040', handle: '@bakeryorderform', tier: 'plus', primaryCategory: 'food', currency: 'USD', region: 'NA' },
  { id: 'c-041', handle: '@trailheadsundries', tier: 'standard', primaryCategory: 'fitness', currency: 'USD', region: 'NA' },
  { id: 'c-042', handle: '@thirdsundayhome', tier: 'plus', primaryCategory: 'home', currency: 'EUR', region: 'EU' },
  { id: 'c-043', handle: '@swatchscience', tier: 'elite', primaryCategory: 'beauty', currency: 'USD', region: 'NA' },
  { id: 'c-044', handle: '@modestmodern.fit', tier: 'standard', primaryCategory: 'fitness', currency: 'USD', region: 'NA' },
  { id: 'c-045', handle: '@runonsentence.tech', tier: 'plus', primaryCategory: 'tech', currency: 'USD', region: 'NA' },
  { id: 'c-046', handle: '@palettework', tier: 'standard', primaryCategory: 'fashion', currency: 'USD', region: 'NA' },
  { id: 'c-047', handle: '@hourstack', tier: 'plus', primaryCategory: 'tech', currency: 'GBP', region: 'UK' },
  { id: 'c-048', handle: '@evenkettle', tier: 'standard', primaryCategory: 'food', currency: 'USD', region: 'NA' },
  { id: 'c-049', handle: '@porchtide', tier: 'plus', primaryCategory: 'home', currency: 'USD', region: 'NA' },
  { id: 'c-050', handle: '@goldhourgrocer', tier: 'elite', primaryCategory: 'food', currency: 'USD', region: 'NA' },
];
