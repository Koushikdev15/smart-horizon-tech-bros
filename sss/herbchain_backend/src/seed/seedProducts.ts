import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { ProductInventory } from '../models/ProductInventory';
import logger from '../utils/logger';

/**
 * Seeds the catalog from real datasets the user supplied (see src/seed/data/):
 *  - ayurvedic_products.csv   — 30 real Ayurvedic products + ingredient lists
 *  - ayurvedic_plants.csv     — 100 plants (common name -> botanical name),
 *                                used to enrich ingredient scientific names
 *  - ayush_shops.csv          — ~130 real Ayurvedic shops across India, with
 *                                real lat/lng
 *  - tamil_nadu_stores.csv    — 75 real Tamil Nadu stores without lat/lng;
 *                                approximated via TN_DISTRICT_COORDS below
 *
 * The CSVs only supply product names/ingredients and store identity/location
 * — health topics, usage instructions, precautions, contraindications and
 * price are authored below from general Ayurvedic reference knowledge (not a
 * live pricing API), matching the tone of the app's original hand-seeded
 * catalog. Runs only when the Product collection is empty (e.g. a fresh
 * in-memory Mongo on every dev restart, or a first-run real database).
 */

const DATA_DIR = path.join(__dirname, 'data');
const SEED_MARKER_EMAIL = 'seed-manufacturer@ayurtrace.internal';

const PRODUCT_INFO: Record<
  string,
  {
    healthTopics: string[];
    description: string;
    usageInstructions: string;
    precautions: string;
    contraindications: string;
    price: number;
  }
> = {
  'Chyawanprash': {
    healthTopics: ['Immunity', 'Energy', 'Respiratory Health'],
    description:
      'A traditional Ayurvedic herbal jam built on an Amla base with Ashwagandha, Giloy, Pippali and warming spices, taken as a daily general-wellness and immunity-support tonic.',
    usageInstructions: '1-2 teaspoons daily with warm milk or water, preferably in the morning.',
    precautions: 'Contains natural sugars — those managing diabetes should consult a doctor before regular use.',
    contraindications: 'Contains honey — avoid in infants under 1 year. Consult a doctor if diabetic.',
    price: 399,
  },
  'Triphala Churna': {
    healthTopics: ['Digestion', 'Detox'],
    description:
      'The classical three-fruit Ayurvedic formulation (Amla, Haritaki, Bibhitaki), traditionally used to support healthy digestion and gentle internal cleansing.',
    usageInstructions: '1/2 to 1 teaspoon with warm water at bedtime, or as directed by a physician.',
    precautions: 'May have a mild laxative effect. Consult a doctor if pregnant or breastfeeding.',
    contraindications: 'Not recommended during pregnancy without medical supervision. Avoid with chronic diarrhea.',
    price: 179,
  },
  'Sitopaladi Churna': {
    healthTopics: ['Respiratory Health', 'Immunity'],
    description:
      'A classical sugar-based churna combining Pippali, Cardamom and Cinnamon, traditionally used to soothe the throat and support respiratory comfort.',
    usageInstructions: '1/2 teaspoon with honey, twice daily, or as directed by a physician.',
    precautions: 'Contains natural sugar (Mishri) — those managing diabetes should consult a doctor before use.',
    contraindications: 'Avoid in known Piper (pepper family) allergy. Diabetic caution due to sugar content.',
    price: 149,
  },
  'Hingvashtak Churna': {
    healthTopics: ['Digestion'],
    description:
      'An eight-ingredient digestive churna built around Asafoetida (Hing) and warming spices, traditionally used before meals to support digestion and relieve bloating.',
    usageInstructions: '1/4 to 1/2 teaspoon with warm water or buttermilk before meals, or as directed by a physician.',
    precautions: 'May increase body heat. Use cautiously if prone to acidity or ulcers.',
    contraindications: 'Avoid in peptic ulcer or hyperacidity without medical advice.',
    price: 129,
  },
  'Dashamoola Kwatha': {
    healthTopics: ['Pain & Inflammation', "Women's Health", 'Digestion'],
    description:
      'A decoction of the classical "ten roots" (Dashamoola), traditionally used to ease pain and inflammation and to support post-natal and digestive wellness.',
    usageInstructions: '15-30ml decoction, twice daily before meals, or as directed by a physician.',
    precautions: 'Consult a physician before prolonged use, especially alongside other prescribed medication.',
    contraindications: 'Avoid during pregnancy without medical supervision.',
    price: 219,
  },
  'Yogaraj Guggulu': {
    healthTopics: ['Joint & Muscle Health', 'Pain & Inflammation'],
    description:
      'A classical Guggulu-based tablet combined with Triphala and warming herbs, traditionally used to support joint comfort and mobility.',
    usageInstructions: '1-2 tablets twice daily after meals with warm water, or as directed by a physician.',
    precautions: 'Consult a doctor before use if on thyroid medication.',
    contraindications: 'Avoid during pregnancy. May interact with thyroid medication.',
    price: 189,
  },
  'Kaishore Guggulu': {
    healthTopics: ['Joint & Muscle Health', 'Skin Health', 'Detox'],
    description:
      'A Guggulu formulation combined with Triphala and Guduchi, traditionally used to support joint comfort together with skin and blood-cleansing wellness.',
    usageInstructions: '1-2 tablets twice daily after meals, or as directed by a physician.',
    precautions: 'Consult a doctor before use if pregnant or on immunosuppressant medication.',
    contraindications: 'Avoid during pregnancy without medical supervision.',
    price: 199,
  },
  'Trikatu Churna': {
    healthTopics: ['Digestion', 'Respiratory Health'],
    description:
      'The classical "three pungents" (Black Pepper, Long Pepper, Dry Ginger), traditionally used to kindle digestive fire and support respiratory comfort.',
    usageInstructions: '1/4 to 1/2 teaspoon with honey before meals, or as directed by a physician.',
    precautions: 'May increase body heat and acidity. Use cautiously if prone to peptic ulcers.',
    contraindications: 'Avoid in hyperacidity, peptic ulcer, or pregnancy without medical guidance.',
    price: 99,
  },
  'Brahmi Ghrita': {
    healthTopics: ['Focus', 'Memory', 'Stress'],
    description:
      'A medicated ghee preparation infused with Brahmi, a classical Medhya Rasayana (brain tonic) formulation traditionally used to support memory and calm focus.',
    usageInstructions: '1/2 to 1 teaspoon with warm milk on an empty stomach, or as directed by a physician.',
    precautions: 'Consult a doctor before regular use if managing cholesterol, due to the ghee base.',
    contraindications: 'Avoid in known dairy/ghee allergy.',
    price: 259,
  },
  'Mahasudarshan Churna': {
    healthTopics: ['Immunity', 'Detox'],
    description:
      'A bitter classical churna combining Neem, Guduchi, Turmeric and Triphala, traditionally used to support the body during seasonal fevers and general detoxification.',
    usageInstructions: '1/2 teaspoon with warm water, twice daily, or as directed by a physician.',
    precautions: 'Very bitter in taste. Consult a doctor for fevers that persist beyond a couple of days.',
    contraindications: 'Not a substitute for medical treatment of fever or infection — consult a doctor if symptoms persist.',
    price: 139,
  },
  'Ashwagandha Tablets': {
    healthTopics: ['Stress', 'Sleep', 'Energy', 'Immunity'],
    description:
      'Withania somnifera (Ashwagandha) root extract tablets, a Rasayana (rejuvenative) herb traditionally used to support the body\'s resilience to stress and promote steady energy.',
    usageInstructions: '1 tablet (500mg) twice daily after meals, or as directed by a physician.',
    precautions: 'Consult a doctor before use if pregnant, breastfeeding, or on sedative/thyroid medication.',
    contraindications: 'Not recommended during pregnancy without medical supervision. May interact with sedatives and thyroid medication.',
    price: 249,
  },
  'Giloy Juice': {
    healthTopics: ['Immunity', 'Detox'],
    description:
      'Tinospora cordifolia (Giloy/Guduchi) stem juice, traditionally known as "Amrita" (nectar of immortality) — used to support immunity and the body\'s natural defenses.',
    usageInstructions: '15-30ml with equal parts water, twice daily before meals, or as directed by a physician.',
    precautions: 'Consult a doctor before use if on immunosuppressant or diabetes medication.',
    contraindications: 'May interact with diabetes and autoimmune-condition medication.',
    price: 179,
  },
  'Tulsi Drops': {
    healthTopics: ['Immunity', 'Respiratory Health', 'Stress'],
    description:
      'Concentrated Holy Basil (Tulsi) leaf extract, known in Ayurveda as the "Queen of Herbs" — traditionally used to support respiratory comfort and general immunity.',
    usageInstructions: '5-10 drops in warm water, twice daily, or as directed by a physician.',
    precautions: 'May lower blood sugar — monitor closely if diabetic. Discontinue two weeks before scheduled surgery.',
    contraindications: 'May interact with blood-thinning and diabetes medication.',
    price: 159,
  },
  'Neem Capsules': {
    healthTopics: ['Skin Health', 'Detox', 'Immunity'],
    description:
      'Azadirachta indica (Neem) leaf extract capsules, traditionally used in Ayurveda to support skin health and the body\'s natural detoxification processes.',
    usageInstructions: '1 capsule twice daily after meals, or as directed by a physician.',
    precautions: 'Not recommended for extended use without medical guidance. Avoid if trying to conceive.',
    contraindications: 'Not recommended during pregnancy or for those trying to conceive. May affect fertility with prolonged use.',
    price: 169,
  },
  'Brahmi Capsules': {
    healthTopics: ['Focus', 'Memory', 'Stress'],
    description:
      'Bacopa monnieri (Brahmi) extract capsules, a traditional Medhya Rasayana (brain tonic) herb used to support mental clarity, memory, and calm focus.',
    usageInstructions: '1 capsule (300mg) once or twice daily with meals, or as directed by a physician.',
    precautions: 'May cause mild digestive upset in some individuals when taken on an empty stomach.',
    contraindications: 'May interact with thyroid medication and sedatives.',
    price: 279,
  },
  'Arjuna Tablets': {
    healthTopics: ['Heart Health'],
    description:
      'Terminalia arjuna bark extract tablets, a classical Ayurvedic herb traditionally used to support cardiovascular health and heart muscle strength.',
    usageInstructions: '1 tablet twice daily after meals, or as directed by a physician.',
    precautions: 'Consult a doctor before use if on heart or blood pressure medication.',
    contraindications: 'May interact with cardiac medications — use only under medical supervision.',
    price: 219,
  },
  'Shatavari Powder': {
    healthTopics: ["Women's Health", 'Digestion', 'Immunity'],
    description:
      "Asparagus racemosus (Shatavari) root powder, a traditional Ayurvedic Rasayana widely used to support women's reproductive wellness and general vitality.",
    usageInstructions: '1/2 to 1 teaspoon with warm milk, once or twice daily, or as directed by a physician.',
    precautions: 'Consult a doctor before use if pregnant, breastfeeding, or on hormonal medication.',
    contraindications: 'May interact with hormonal medications. Avoid in known Asparagus family allergy.',
    price: 189,
  },
  'Amla Juice': {
    healthTopics: ['Digestion', 'Immunity', 'Hair & Skin'],
    description:
      'Phyllanthus emblica (Amla / Indian Gooseberry) fruit juice, one of the richest natural sources of Vitamin C in Ayurvedic tradition — used for digestive wellness and general immunity support.',
    usageInstructions: '20-30ml with equal parts water, once daily in the morning, or as directed by a physician.',
    precautions: 'May increase acidity in sensitive individuals when taken on an empty stomach.',
    contraindications: 'Avoid in known Amla/Phyllanthus allergy.',
    price: 149,
  },
  'Kumaryasava': {
    healthTopics: ["Women's Health", 'Digestion'],
    description:
      'A fermented Ayurvedic tonic (Asava) built on Aloe Vera (Kumari) with Haritaki and Ginger, traditionally used to support women\'s reproductive health and digestion.',
    usageInstructions: '15-30ml with equal parts water after meals, twice daily, or as directed by a physician.',
    precautions: 'Contains self-generated alcohol from fermentation — use caution if avoiding alcohol.',
    contraindications: 'Avoid during pregnancy. Not recommended for children without medical advice.',
    price: 169,
  },
  'Draksharishta': {
    healthTopics: ['Digestion', 'Energy'],
    description:
      'A fermented Ayurvedic tonic (Arishta) made from grapes and warming spices, traditionally used as a digestive and general strength tonic.',
    usageInstructions: '15-30ml with equal parts water after meals, twice daily, or as directed by a physician.',
    precautions: 'Contains self-generated alcohol from fermentation — use caution if avoiding alcohol.',
    contraindications: 'Avoid during pregnancy and in conditions requiring strict alcohol avoidance.',
    price: 179,
  },
  'Saraswatarishta': {
    healthTopics: ['Focus', 'Memory', 'Stress'],
    description:
      'A fermented Ayurvedic tonic (Arishta) combining Brahmi, Ashwagandha and Shatavari, traditionally used to support memory, mental clarity and calm.',
    usageInstructions: '15-30ml with equal parts water after meals, twice daily, or as directed by a physician.',
    precautions: 'Contains self-generated alcohol from fermentation — use caution in children or if avoiding alcohol.',
    contraindications: 'Avoid during pregnancy. Use in children only under medical supervision.',
    price: 199,
  },
  'Lohasava': {
    healthTopics: ['Energy', 'Immunity'],
    description:
      'A classical iron-based fermented tonic (Asava) combined with Triphala and honey, traditionally used to support energy levels and healthy iron status.',
    usageInstructions: '15-30ml with equal parts water after meals, twice daily, or as directed by a physician.',
    precautions: 'Contains iron — do not exceed the recommended dose. Consult a doctor if already on iron supplements.',
    contraindications: 'Avoid in iron-overload conditions (e.g. hemochromatosis) without medical supervision.',
    price: 189,
  },
  'Punarnavadi Kashayam': {
    healthTopics: ['Detox', 'Digestion'],
    description:
      'A classical decoction (Kashayam) built on Punarnava, traditionally used to support healthy fluid balance and gentle detoxification.',
    usageInstructions: '15-30ml decoction, twice daily before meals, or as directed by a physician.',
    precautions: 'Consult a doctor before use if on diuretic medication.',
    contraindications: 'May interact with diuretics and blood pressure medication.',
    price: 159,
  },
  'Amritarishta': {
    healthTopics: ['Immunity'],
    description:
      'A fermented Ayurvedic tonic (Arishta) built on Guduchi (Amrita) and Dashamoola roots, traditionally used to support the body\'s recovery from seasonal illness.',
    usageInstructions: '15-30ml with equal parts water after meals, twice daily, or as directed by a physician.',
    precautions: 'Contains self-generated alcohol from fermentation — use caution if avoiding alcohol.',
    contraindications: 'Avoid during pregnancy. Not a substitute for medical treatment of fever.',
    price: 179,
  },
  'Khadirarishta': {
    healthTopics: ['Skin Health', 'Detox'],
    description:
      'A fermented Ayurvedic tonic (Arishta) built on Khadira (Acacia catechu), traditionally used to support skin health and blood-cleansing wellness.',
    usageInstructions: '15-30ml with equal parts water after meals, twice daily, or as directed by a physician.',
    precautions: 'Contains self-generated alcohol from fermentation — use caution if avoiding alcohol.',
    contraindications: 'Avoid during pregnancy without medical supervision.',
    price: 169,
  },
  'Kanakasava': {
    healthTopics: ['Respiratory Health'],
    description:
      'A classical fermented respiratory tonic (Asava) combining Vasaka and Pippali, traditionally used to soothe cough and support respiratory comfort.',
    usageInstructions: '10-15ml with equal parts water after meals, twice daily, strictly as directed by a physician.',
    precautions: 'Use strictly at the physician-directed dose — not intended for unsupervised self-medication in children.',
    contraindications: 'Avoid during pregnancy and in children without direct medical supervision.',
    price: 199,
  },
  'Vasavaleha': {
    healthTopics: ['Respiratory Health'],
    description:
      'A classical herbal jam (Leha) built on Vasaka (Adhatoda) with honey and Pippali, traditionally used to soothe cough and support respiratory comfort.',
    usageInstructions: '1-2 teaspoons twice daily, or as directed by a physician.',
    precautions: 'Contains honey — not intended for infants under 1 year.',
    contraindications: 'Avoid in infants under 1 year. Diabetic caution due to honey content.',
    price: 179,
  },
  'Talisadi Churna': {
    healthTopics: ['Respiratory Health', 'Digestion'],
    description:
      'A classical warming churna built on Talispatra with Pippali and aromatic spices, traditionally used to support respiratory comfort and digestion.',
    usageInstructions: '1/4 to 1/2 teaspoon with honey, twice daily, or as directed by a physician.',
    precautions: 'May increase body heat. Use cautiously if prone to acidity.',
    contraindications: 'Avoid in hyperacidity without medical guidance.',
    price: 129,
  },
  'Haridra Khanda': {
    healthTopics: ['Immunity', 'Skin Health', 'Respiratory Health'],
    description:
      'A classical Turmeric-based formulation combined with Trikatu, traditionally used to support skin health, immunity, and respiratory comfort.',
    usageInstructions: '1/2 to 1 teaspoon with warm milk or water, twice daily, or as directed by a physician.',
    precautions: 'May increase body heat. Consult a doctor before use if on blood-thinning medication.',
    contraindications: 'May interact with blood-thinning medication (turmeric).',
    price: 139,
  },
  'Chandraprabha Vati': {
    healthTopics: ['Detox', 'Joint & Muscle Health', 'Energy'],
    description:
      'A classical multi-ingredient tablet built on Shilajit and Guggulu, traditionally used to support urinary wellness, joint comfort, and general vitality.',
    usageInstructions: '1-2 tablets twice daily after meals, or as directed by a physician.',
    precautions: 'Consult a doctor before use if diabetic or on blood pressure medication, due to the Shilajit content.',
    contraindications: 'Avoid during pregnancy. Consult a doctor if diabetic or on blood pressure medication.',
    price: 229,
  },
};

/** Approximate district-headquarters coordinates [lat, lng] for the Tamil Nadu
 * districts present in tamil_nadu_stores.csv, which has no per-store lat/lng.
 * A small deterministic jitter is applied per-store in buildTnStores() so
 * stores in the same district don't stack on one exact map point — these
 * remain district-level approximations, not verified store addresses. */
const TN_DISTRICT_COORDS: Record<string, [number, number]> = {
  Chennai: [13.0827, 80.2707],
  Coimbatore: [11.0168, 76.9558],
  Madurai: [9.9252, 78.1198],
  Salem: [11.6643, 78.146],
  Erode: [11.341, 77.7172],
  Cuddalore: [11.748, 79.7714],
  Thanjavur: [10.787, 79.1378],
  Karur: [10.9601, 78.0766],
  Ranipet: [12.9249, 79.3308],
  Kallakurichi: [11.7401, 78.9597],
  Namakkal: [11.2189, 78.1677],
  Kanchipuram: [12.8342, 79.7036],
  Pudukkottai: [10.3833, 78.8001],
  Ariyalur: [11.1401, 79.0782],
  Perambalur: [11.2342, 78.8807],
};

const INGREDIENT_SYNONYMS: Record<string, string> = {
  'dry ginger': 'ginger',
  'kiratatikta': 'chirayata',
};

interface StoreSeed {
  name: string;
  storeType: 'Pharmacy' | 'Ayurvedic Store' | 'Other';
  address: string;
  region: string;
  state: string;
  phone?: string;
  latitude: number;
  longitude: number;
}

function readCsv<T = Record<string, string>>(filename: string): T[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as T[];
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function classifyStoreType(text: string): 'Pharmacy' | 'Ayurvedic Store' | 'Other' {
  const t = text.toLowerCase();
  if (t.includes('pharmacy') || t.includes('dawakhana') || t.includes('dawasaz') || t.includes('dawasaaz')) return 'Pharmacy';
  if (t.includes('hospital') || t.includes('clinic')) return 'Other';
  return 'Ayurvedic Store';
}

/** Builds a common-name -> botanical-name lookup from ayurvedic_plants.csv.
 * Handles "Base (Alt Name)" and "Base (Component - X)" / "Name - alt" row
 * shapes so both the primary and alternate Sanskrit/English names resolve. */
function buildPlantLookup(): Map<string, string> {
  const rows = readCsv<{ 'Common Name': string; 'Botanical Name': string }>('ayurvedic_plants.csv');
  const lookup = new Map<string, string>();
  for (const row of rows) {
    const commonName = row['Common Name'];
    const botanicalName = row['Botanical Name'];
    if (!commonName || !botanicalName) continue;

    const cleaned = commonName.replace(/\s*-\s*alt\.?$/i, '').trim();
    const componentMatch = cleaned.match(/^(.*?)\s*\(Component\s*-\s*(.+?)\)\s*$/i);
    let keys: string[];
    if (componentMatch) {
      keys = [componentMatch[2].trim()];
    } else {
      const parenMatch = cleaned.match(/^(.*?)\s*\((.+?)\)\s*$/);
      keys = parenMatch ? [parenMatch[1].trim(), parenMatch[2].trim()] : [cleaned];
    }
    for (const key of keys) {
      const norm = normalize(key);
      if (norm && !lookup.has(norm)) lookup.set(norm, botanicalName);
    }
  }
  return lookup;
}

function lookupScientificName(ingredient: string, plantLookup: Map<string, string>): string | undefined {
  const norm = normalize(ingredient);
  return plantLookup.get(norm) ?? plantLookup.get(INGREDIENT_SYNONYMS[norm] ?? '');
}

function buildProducts(plantLookup: Map<string, string>) {
  const rows = readCsv<{ 'Ayurvedic Product': string; 'Major Components': string }>('ayurvedic_products.csv');
  return rows.map((row) => {
    const productName = row['Ayurvedic Product'];
    const ingredientNames = row['Major Components'].split(',').map((s) => s.trim()).filter(Boolean);
    const info = PRODUCT_INFO[productName];
    if (!info) {
      throw new Error(
        `seedProducts: missing curated PRODUCT_INFO for "${productName}" — add an entry to PRODUCT_INFO in seedProducts.ts`
      );
    }
    return {
      productName,
      ingredients: ingredientNames.map((name) => {
        const scientificName = lookupScientificName(name, plantLookup);
        return scientificName ? { name, scientificName } : { name };
      }),
      ...info,
    };
  });
}

function buildAyushShopStores(): StoreSeed[] {
  const rows = readCsv<{
    shop_name: string;
    city: string;
    state: string;
    latitude: string;
    longitude: string;
    address: string;
    phone_number: string;
  }>('ayush_shops.csv');

  return rows
    .filter((r) => r.shop_name && r.latitude && r.longitude)
    .map((r) => ({
      name: r.shop_name,
      storeType: classifyStoreType(r.shop_name),
      address: r.address || `${r.city}, ${r.state}`,
      region: r.city,
      state: r.state,
      phone: r.phone_number || undefined,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
    }));
}

function buildTnStores(): StoreSeed[] {
  const rows = readCsv<{
    Store_Name: string;
    Store_Type: string;
    District: string;
    'City/Town': string;
    Address: string;
    Phone: string;
  }>('tamil_nadu_stores.csv');

  const districtCounters = new Map<string, number>();

  return rows
    .filter((r) => r.Store_Name && r.District)
    .map((r) => {
      const district = r.District.trim();
      const base = TN_DISTRICT_COORDS[district];
      if (!base) {
        throw new Error(
          `seedProducts: no coordinate approximation for TN district "${district}" — add it to TN_DISTRICT_COORDS`
        );
      }
      const n = districtCounters.get(district) ?? 0;
      districtCounters.set(district, n + 1);

      const angle = ((n * 47) % 360) * (Math.PI / 180);
      const radius = 0.01 + (n % 4) * 0.006;

      return {
        name: r.Store_Name,
        storeType: classifyStoreType(r.Store_Type || r.Store_Name),
        address: r.Address || `${r['City/Town'] || district}, Tamil Nadu`,
        region: r['City/Town'] || district,
        state: 'Tamil Nadu',
        phone: r.Phone || undefined,
        latitude: base[0] + Math.sin(angle) * radius,
        longitude: base[1] + Math.cos(angle) * radius,
      };
    });
}

export async function seedIfEmpty(): Promise<void> {
  const existing = await Product.countDocuments();
  if (existing > 0) return;

  logger.info('No products found — seeding Ayurvedic product catalog from real datasets...');

  const passwordHash = await bcrypt.hash('SeedData@123', 10);

  let manufacturer = await User.findOne({ email: SEED_MARKER_EMAIL });
  if (!manufacturer) {
    manufacturer = await User.create({
      name: 'AyurTrace Demo Herbal Labs',
      email: SEED_MARKER_EMAIL,
      mobile: '9000000000',
      passwordHash,
      role: 'Manufacturer',
    });
  }

  const plantLookup = buildPlantLookup();
  const seedProducts = buildProducts(plantLookup);

  const products = await Product.insertMany(
    seedProducts.map((p, i) => ({
      productName: p.productName,
      manufacturerId: manufacturer!._id,
      batchIds: [],
      qrCode: `QR-SEED-${String(i + 1).padStart(3, '0')}`,
      ingredients: p.ingredients,
      healthTopics: p.healthTopics,
      description: p.description,
      usageInstructions: p.usageInstructions,
      precautions: p.precautions,
      contraindications: p.contraindications,
    }))
  );

  const storeSeeds: StoreSeed[] = [...buildAyushShopStores(), ...buildTnStores()];

  let inventoryCount = 0;
  for (let s = 0; s < storeSeeds.length; s++) {
    const storeSeed = storeSeeds[s];
    const email = `seed-store-${s + 1}@ayurtrace.internal`;
    const mobile = `90000${String(s + 1).padStart(5, '0')}`;

    let owner = await User.findOne({ email });
    if (!owner) {
      owner = await User.create({
        name: `${storeSeed.name} Owner`,
        email,
        mobile,
        passwordHash,
        role: 'Pharmacy',
      });
    }

    const store = await Store.create({
      ownerId: owner._id,
      name: storeSeed.name,
      storeType: storeSeed.storeType,
      address: storeSeed.address,
      region: storeSeed.region,
      state: storeSeed.state,
      country: 'India',
      location: { type: 'Point', coordinates: [storeSeed.longitude, storeSeed.latitude] },
      phone: storeSeed.phone,
      is24Hours: false,
      openTime: '09:00',
      closeTime: '21:00',
    });

    // Not every store carries every product — more realistic, and gives the
    // region-availability sort something meaningful to differentiate.
    // (s * 5) is used rather than a multiple of 3 so the store index actually
    // shifts which products get excluded — a multiple-of-3 coefficient here
    // previously vanished under "% 3", silently giving every idx % 3 === 2
    // product zero stores across the entire catalog.
    const carried = seedProducts.filter((_, idx) => (idx * 7 + s * 5) % 3 !== 2);
    const inventoryDocs = carried.map((seedProduct) => {
      const idx = seedProducts.indexOf(seedProduct);
      const product = products[idx];
      const priceVariance = 0.9 + ((idx + s) % 5) * 0.05;
      return {
        storeId: store._id,
        productId: product._id,
        available: true,
        quantity: 10 + ((idx + s) % 6) * 5,
        price: Math.round((seedProduct.price * priceVariance) / 5) * 5,
      };
    });

    if (inventoryDocs.length) {
      await ProductInventory.insertMany(inventoryDocs);
      inventoryCount += inventoryDocs.length;
    }
  }

  logger.info(`Seeded ${products.length} products across ${storeSeeds.length} stores (${inventoryCount} inventory listings).`);
}
