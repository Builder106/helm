// Plausible line-item catalogs per vendor category. Sticker prices are
// inside-the-ballpark for SMB purchasing — not deeply researched, just
// realistic enough that a human flipping through an invoice won't blink.

import type { Vendor } from './vendors.js';

export type LineItem = {
  description: string;
  unitPrice: number;
};

export const LINE_ITEMS: Record<Vendor['category'], readonly LineItem[]> = {
  'office-supplies': [
    { description: 'Letter-size copy paper, case (10 reams)', unitPrice: 48.5 },
    { description: 'Black gel pens, box of 24', unitPrice: 18.0 },
    { description: 'Manila file folders, box of 100', unitPrice: 22.5 },
    { description: 'Heavy-duty stapler', unitPrice: 32.0 },
    { description: 'Letter-size envelopes, box of 500', unitPrice: 41.25 },
    { description: 'Mid-back ergonomic task chair', unitPrice: 289.0 },
    { description: '4-drawer lateral filing cabinet', unitPrice: 645.0 },
    { description: 'Standing-desk converter, 32"', unitPrice: 199.0 },
    { description: 'Whiteboard markers, pack of 12 (assorted)', unitPrice: 14.75 },
    { description: 'Wireless USB receipt printer', unitPrice: 165.0 },
  ],
  shipping: [
    { description: 'Ground freight, palletized — Zone 4', unitPrice: 142.5 },
    { description: 'Ground freight, palletized — Zone 7', unitPrice: 268.0 },
    { description: 'LTL surcharge — residential delivery', unitPrice: 35.0 },
    { description: 'Fuel surcharge (current period)', unitPrice: 28.75 },
    { description: 'Expedited 2-day, 25 lb parcel', unitPrice: 47.0 },
    { description: 'Bonded warehouse storage, weekly', unitPrice: 95.0 },
  ],
  saas: [
    { description: 'Team plan — monthly per seat', unitPrice: 24.0 },
    { description: 'Premium add-on — analytics dashboard', unitPrice: 99.0 },
    { description: 'Premium add-on — single sign-on', unitPrice: 250.0 },
    { description: 'Annual support contract, gold tier', unitPrice: 4800.0 },
    { description: 'API overage, per 100k requests', unitPrice: 12.5 },
    { description: 'Data egress, per GB', unitPrice: 0.09 },
  ],
  inventory: [
    { description: 'Stainless connector, M8 × 30mm, bag of 50', unitPrice: 18.25 },
    { description: 'High-density foam insert, 12" × 18"', unitPrice: 7.4 },
    { description: 'Reinforced cardboard mailer, case of 200', unitPrice: 92.0 },
    { description: 'Bubble wrap, 12" × 100 ft roll', unitPrice: 28.5 },
    { description: 'Pallet wrap, 18" × 1500 ft', unitPrice: 41.0 },
    { description: 'Plain craft label, 4" × 6", roll of 500', unitPrice: 17.25 },
    { description: 'Branded poly mailer, large, case of 300', unitPrice: 138.0 },
  ],
  'professional-services': [
    { description: 'Partner consultation — hourly', unitPrice: 425.0 },
    { description: 'Senior associate work — hourly', unitPrice: 285.0 },
    { description: 'Associate work — hourly', unitPrice: 195.0 },
    { description: 'Paralegal / staff accountant work — hourly', unitPrice: 95.0 },
    { description: 'Document filing fee, state of incorporation', unitPrice: 350.0 },
    { description: 'Monthly bookkeeping retainer', unitPrice: 1850.0 },
  ],
  utilities: [
    { description: 'Electric service — base charge', unitPrice: 35.0 },
    { description: 'Electric usage — per kWh × 4,210 kWh', unitPrice: 0.142 },
    { description: 'Demand charge — peak kW', unitPrice: 18.5 },
    { description: 'Water service — base charge', unitPrice: 22.0 },
    { description: 'Water usage — per CCF × 68 CCF', unitPrice: 4.85 },
    { description: 'Sewer service — per CCF × 68 CCF', unitPrice: 6.2 },
  ],
  marketing: [
    { description: 'Meta paid social — managed ad spend', unitPrice: 4500.0 },
    { description: 'Google Ads — managed search spend', unitPrice: 6200.0 },
    { description: 'Agency retainer — monthly', unitPrice: 8500.0 },
    { description: 'Creative production — :30 video asset', unitPrice: 2400.0 },
    { description: 'Influencer placement — mid-tier', unitPrice: 3500.0 },
    { description: 'Email marketing platform, monthly', unitPrice: 320.0 },
  ],
};
