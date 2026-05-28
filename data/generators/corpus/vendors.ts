// Vendor corpus: plausible SMB suppliers across categories Helm's mock
// company would actually buy from. Curated, not generated — the point is
// for invoices to "feel" right when a human flips through them.

export type Vendor = {
  name: string;
  category:
    | 'office-supplies'
    | 'shipping'
    | 'saas'
    | 'inventory'
    | 'professional-services'
    | 'utilities'
    | 'marketing';
  address: { street: string; city: string; state: string; zip: string };
  taxRate: number;
  paymentTermsDays: number;
};

export const VENDORS: readonly Vendor[] = [
  {
    name: 'Westside Paper & Pack Co.',
    category: 'office-supplies',
    address: { street: '418 Linden Ave', city: 'Portland', state: 'OR', zip: '97214' },
    taxRate: 0.0,
    paymentTermsDays: 30,
  },
  {
    name: 'Cardinal Logistics Group',
    category: 'shipping',
    address: { street: '2200 Industrial Pkwy', city: 'Memphis', state: 'TN', zip: '38116' },
    taxRate: 0.0,
    paymentTermsDays: 15,
  },
  {
    name: 'BrightLayer Cloud',
    category: 'saas',
    address: { street: '1 Market St, Suite 3600', city: 'San Francisco', state: 'CA', zip: '94105' },
    taxRate: 0.0,
    paymentTermsDays: 30,
  },
  {
    name: 'Harbor Components LLC',
    category: 'inventory',
    address: { street: '744 Dockside Rd', city: 'Long Beach', state: 'CA', zip: '90802' },
    taxRate: 0.0975,
    paymentTermsDays: 45,
  },
  {
    name: 'Sage Counsel PLLC',
    category: 'professional-services',
    address: { street: '110 N LaSalle St', city: 'Chicago', state: 'IL', zip: '60602' },
    taxRate: 0.0,
    paymentTermsDays: 30,
  },
  {
    name: 'Pacific Power & Light',
    category: 'utilities',
    address: { street: '700 NW Wall St', city: 'Bend', state: 'OR', zip: '97703' },
    taxRate: 0.0,
    paymentTermsDays: 21,
  },
  {
    name: 'Northshore Media Buying',
    category: 'marketing',
    address: { street: '215 Park Ave S, Fl 6', city: 'New York', state: 'NY', zip: '10003' },
    taxRate: 0.08875,
    paymentTermsDays: 30,
  },
  {
    name: 'Foundry Office Furniture',
    category: 'office-supplies',
    address: { street: '4012 Riverside Dr', city: 'Austin', state: 'TX', zip: '78741' },
    taxRate: 0.0825,
    paymentTermsDays: 30,
  },
  {
    name: 'Atlas Freight Solutions',
    category: 'shipping',
    address: { street: '1200 Logistics Way', city: 'Atlanta', state: 'GA', zip: '30336' },
    taxRate: 0.0,
    paymentTermsDays: 30,
  },
  {
    name: 'Stratum DevTools',
    category: 'saas',
    address: { street: '500 Boylston St', city: 'Boston', state: 'MA', zip: '02116' },
    taxRate: 0.0625,
    paymentTermsDays: 30,
  },
  {
    name: 'Greylock Packaging Supply',
    category: 'inventory',
    address: { street: '88 Industrial Loop', city: 'Reno', state: 'NV', zip: '89506' },
    taxRate: 0.0825,
    paymentTermsDays: 30,
  },
  {
    name: 'Hartfield Accounting Partners',
    category: 'professional-services',
    address: { street: '3 Riverway, Suite 1500', city: 'Houston', state: 'TX', zip: '77056' },
    taxRate: 0.0825,
    paymentTermsDays: 30,
  },
  {
    name: 'Lakefront Water Authority',
    category: 'utilities',
    address: { street: '901 Lake Dr', city: 'Milwaukee', state: 'WI', zip: '53202' },
    taxRate: 0.0,
    paymentTermsDays: 21,
  },
  {
    name: 'Beacon Creative Studio',
    category: 'marketing',
    address: { street: '2424 N Federal Hwy', city: 'Fort Lauderdale', state: 'FL', zip: '33305' },
    taxRate: 0.07,
    paymentTermsDays: 45,
  },
  {
    name: 'Ironwood Office Mart',
    category: 'office-supplies',
    address: { street: '15 Industrial Park Rd', city: 'Manchester', state: 'NH', zip: '03109' },
    taxRate: 0.0,
    paymentTermsDays: 30,
  },
];
