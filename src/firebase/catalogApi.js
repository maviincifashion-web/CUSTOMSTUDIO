import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { fabricGarmentPath, KURTA_FABRIC_LIST_PATH_CANDIDATES, kurtaFabricListPath } from './paths';

// ==========================================
// OPTIMIZATION: In-Memory Cache
// Prevents re-fetching the same layers constantly when scrolling
// ==========================================
const renderBundleCache = new Map();

/** Dev / reload: optional manual clear if you need to force-refresh after Firestore edits. */
export function clearRenderBundleCache() {
  renderBundleCache.clear();
}

/** Same string key for object lookups (fabricID vs website `id` often differ). */
export function normalizeFabricKey(v) {
  if (v == null) return '';
  return String(v).trim();
}

/**
 * @param {import('firebase/firestore').DocumentData} data
 * @returns {string|null}
 */
export function readSrcField(data) {
  if (!data) return null;
  const s = data.src;
  if (typeof s === 'string' && s.length > 0) return s;
  if (Array.isArray(s) && s.length && typeof s[0] === 'string') return s[0];
  if (s && typeof s === 'object' && !Array.isArray(s)) {
    for (const k of ['url', 'href', 'src', 'downloadURL']) {
      const inner = s[k];
      if (typeof inner === 'string' && inner.length > 0) return inner;
    }
  }
  for (const key of [
    'url',
    'imageUrl',
    'imageURL',
    'downloadURL',
    'image',
    'uri',
    'link',
    'fileUrl',
    'publicUrl',
    'storageUrl',
    'photoUrl',
    'path',
  ]) {
    const v = data[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function readFabricPrice(data) {
  if (!data || typeof data !== 'object') return 0;
  const directKeys = [
    'price',
    'Price',
    'fabricPrice',
    'fabric_price',
    'amount',
    'Amount',
    'mrp',
    'MRP',
    'salePrice',
    'sellingPrice',
    'rate',
    'Rate',
    'cost',
    'Cost',
  ];
  for (const key of directKeys) {
    if (data[key] != null) {
      const n = parseMoney(data[key]);
      if (n > 0) return n;
    }
  }
  const nested = [data.pricing, data.priceInfo, data.meta];
  for (const obj of nested) {
    if (!obj || typeof obj !== 'object') continue;
    for (const key of ['price', 'amount', 'mrp', 'salePrice', 'sellingPrice']) {
      if (obj[key] != null) {
        const n = parseMoney(obj[key]);
        if (n > 0) return n;
      }
    }
  }
  return 0;
}

/**
 * Layer doc id → React Native image source `{ uri }`.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string[]} pathToFabricDoc e.g. Fabric/kurta/Kurta_style/FAB_001
 * @param {'display'|'style'} subName
 * @returns {Promise<Record<string, { uri: string }>>}
 */
export async function fetchLayerSubcollection(db, pathToFabricDoc, subName) {
  const colRef = collection(db, ...pathToFabricDoc, subName);
  const snap = await getDocs(colRef);
  /** @type {Record<string, { uri: string }>} */
  const map = {};
  snap.forEach((d) => {
    const url = readSrcField(d.data());
    if (url) map[d.id] = { uri: url };
  });
  if (typeof __DEV__ !== 'undefined' && __DEV__ && snap.size > 0 && Object.keys(map).length === 0) {
    console.warn(
      '[Maviinci] Layer docs found but no readable URL (check `src` / `url` fields):',
      [...pathToFabricDoc, subName].join('/')
    );
  }
  return map;
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {'kurta'|'pajama'|'sadri'|'coat'} garment
 * @param {string} fabricId
 */
function layerCount(bundle) {
  return (
    Object.keys(bundle?.display || {}).length + Object.keys(bundle?.style || {}).length
  );
}

export async function fetchGarmentRenderBundle(db, garment, stylePathId) {
  const base = fabricGarmentPath(garment, stylePathId);
  const [display, style] = await Promise.all([
    fetchLayerSubcollection(db, base, 'display'),
    fetchLayerSubcollection(db, base, 'style'),
  ]);
  return { display, style };
}

/**
 * Some DBs keep garment style docs under `Fabric/Suits/*_style/{id}`.
 * Try this parent when `Fabric/kurta/*_style/{id}` is empty.
 */
async function fetchGarmentRenderBundleWithSuitsFallback(db, garment, stylePathId) {
  const primary = await fetchGarmentRenderBundle(db, garment, stylePathId);
  if (layerCount(primary) > 0) return primary;

  const styleByGarment = {
    kurta: 'Kurta_style',
    pajama: 'Pajama_style',
    sadri: 'Sadri_style',
    coat: 'Coat_style',
  };
  const styleSeg = styleByGarment[garment];
  if (!styleSeg) return primary;

  const altBase = ['Fabric', 'Suits', styleSeg, stylePathId];
  const [display, style] = await Promise.all([
    fetchLayerSubcollection(db, altBase, 'display'),
    fetchLayerSubcollection(db, altBase, 'style'),
  ]);
  const alt = { display, style };
  if (layerCount(alt) > 0 && typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(
      `[Maviinci] ${garment} renders: using Fabric/Suits/${styleSeg}/${stylePathId} (kurta parent was empty)`
    );
  }
  return layerCount(alt) > 0 ? alt : primary;
}

const GARMENT_STYLE_DOC_PREFIX = {
  kurta: 'Kurta',
  pajama: 'Pajama',
  sadri: 'Sadri',
  coat: 'Coat',
};

/**
 * Style layer folders in Firestore are often named `Kurta-1773…` while fabric rows
 * only expose numeric `id` / `fabricID`. Try both raw and prefixed paths to avoid
 * empty lookups and extra latency.
 * @param {'kurta'|'pajama'|'sadri'|'coat'} garment
 * @param {string[]} candidateIds
 */
function expandStylePathCandidates(garment, candidateIds) {
  const prefix = GARMENT_STYLE_DOC_PREFIX[garment];
  const out = [];
  const seen = new Set();
  const push = (v) => {
    const s = v == null ? '' : String(v).trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  for (const raw of candidateIds || []) {
    if (raw == null || String(raw).trim() === '') continue;
    const id = String(raw).trim();
    push(id);
    if (prefix && !id.startsWith(`${prefix}-`)) {
      push(`${prefix}-${id}`);
    }
  }
  return out;
}

/**
 * Tries each candidate id until display/style has at least one layer URL.
 * Master `Suits/fabrics` rows often key `Kurta_style` by Firestore doc id while `fabricID` is a SKU.
 * @param {import('firebase/firestore').Firestore} db
 * @param {'kurta'|'pajama'|'sadri'|'coat'} garment
 * @param {string[]} candidateIds e.g. [stylePathId, fabricID, firestoreDocId]
 */
export async function fetchGarmentRenderBundleWithFallback(db, garment, candidateIds) {
  // OPTIMIZATION 1: Check Cache Before Doing Network Calls
  const uniqueCandidates = [...new Set((candidateIds || []).filter(Boolean).map(String))];
  const cacheKey = `${garment}-${uniqueCandidates.join('-')}`;
  
  if (renderBundleCache.has(cacheKey)) {
    return renderBundleCache.get(cacheKey);
  }

  const ids = expandStylePathCandidates(garment, uniqueCandidates);
  if (ids.length === 0) return { display: {}, style: {} };
  
  /** @type {{ display: Record<string, { uri: string }>, style: Record<string, { uri: string }> }} */
  let last = { display: {}, style: {} };
  
  for (const id of ids) {
    const bundle = await fetchGarmentRenderBundleWithSuitsFallback(db, garment, id);
    const n = Object.keys(bundle.display || {}).length + Object.keys(bundle.style || {}).length;
    last = bundle;

    if (n > 0) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(
          `[Maviinci] ${garment} renders: id="${id}" (${Object.keys(bundle.display).length} display, ${Object.keys(bundle.style).length} style)`
        );
      }
      renderBundleCache.set(cacheKey, bundle);
      return bundle;
    }
  }
  
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(`[Maviinci] No ${garment} renders for tried ids: ${ids.join(', ')}`);
  }
  return last;
}

/**
 * Kurta fabric catalog: documents under Fabric/.../Kurta_style (or alternate admin paths).
 * @param {import('firebase/firestore').Firestore} db
 */
export async function fetchKurtaFabricDocuments(db) {
  // OPTIMIZATION 2: Run all path checks in PARALLEL instead of one-by-one
  const promises = KURTA_FABRIC_LIST_PATH_CANDIDATES.map((segments) => 
    getDocs(collection(db, ...segments)).catch(() => ({ size: 0, docs: [] }))
  );

  const snaps = await Promise.all(promises);

  // Pick the first successful path
  for (let i = 0; i < snaps.length; i++) {
    if (snaps[i].size > 0) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[Maviinci] Firestore fabric list: ${KURTA_FABRIC_LIST_PATH_CANDIDATES[i].join('/')} (${snaps[i].size} docs)`);
      }
      return snaps[i].docs;
    }
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      '[Maviinci] No fabric docs in tried paths:',
      KURTA_FABRIC_LIST_PATH_CANDIDATES.map((s) => s.join('/')).join(', ')
    );
  }
  
  const fallback = await getDocs(collection(db, ...kurtaFabricListPath()));
  return fallback.docs;
}

/**
 * Map Firestore fabric doc → app fabric profile (SUITS_WEBSITE fields).
 * Website `getDocsFromQueryForFabrics` queries `Fabric/Suits/fabrics` with `where("id","in",chunk)` — layer
 * folders under `Fabric/kurta/Kurta_style/{key}` usually match field `id` or `getData`'s `doc` (docSnap.id).
 */
export function mapFabricDocToProfile(docSnap, localFallbackThumb) {
  const d = docSnap.data() || {};
  const fabricID = normalizeFabricKey(d.fabricID != null ? d.fabricID : docSnap.id);
  /** Website `sel.fabric.Kurta.id` — field often named `id`; some exports use `ID` / `doc`. */
  const rawId = d.id ?? d.ID ?? d.Id;
  const websiteId =
    rawId != null && String(rawId).length > 0 ? normalizeFabricKey(rawId) : null;
  /**
   * Path `Fabric/kurta/Kurta_style/{id}` / sibling garment_style docs.
   */
  const stylePathId = normalizeFabricKey(
    d.kurtaStyleId != null && String(d.kurtaStyleId).length > 0
      ? d.kurtaStyleId
      : d.styleDocId != null && String(d.styleDocId).length > 0
        ? d.styleDocId
        : websiteId != null
          ? websiteId
          : d.fabricID != null && String(d.fabricID).length > 0
            ? d.fabricID
            : docSnap.id
  );

  const thumbRaw = d.fabricImg || d.src || d.thumbnail;
  let thumbnail = localFallbackThumb;
  if (typeof thumbRaw === 'string' && thumbRaw.length > 0) {
    thumbnail = { uri: thumbRaw };
  }
  const imageListRaw = [];
  const pushImage = (v) => {
    if (typeof v === 'string' && v.length > 0) imageListRaw.push(v);
  };
  pushImage(d.fabricImg);
  pushImage(d.src);
  pushImage(d.thumbnail);
  if (Array.isArray(d.single)) d.single.forEach(pushImage);
  if (Array.isArray(d.images)) d.images.forEach(pushImage);
  if (Array.isArray(d.otherImages)) d.otherImages.forEach(pushImage);
  if (Array.isArray(d.otherFabricImg)) d.otherFabricImg.forEach(pushImage);
  const seenImages = new Set();
  const imageList = imageListRaw.filter((u) => {
    if (seenImages.has(u)) return false;
    seenImages.add(u);
    return true;
  });

  const hexCodes = Array.isArray(d.hexCodes)
    ? d.hexCodes
    : Array.isArray(d.colorCode)
      ? d.colorCode
      : [];

  const displayName = (d.name || d.fabric || fabricID).toString();

  /** Website getFabricDetails may tag which garments use this row (Kurta, Pajama, …). */
  let garmentSlots = null;
  if (Array.isArray(d.garmentTypes) && d.garmentTypes.length) garmentSlots = d.garmentTypes.map(String);
  else if (Array.isArray(d.types) && d.types.length) garmentSlots = d.types.map(String);
  else if (Array.isArray(d.clothTypes) && d.clothTypes.length) garmentSlots = d.clothTypes.map(String);
  else if (Array.isArray(d.slots) && d.slots.length) garmentSlots = d.slots.map(String);

  return {
    fabricID,
    id: stylePathId,
    doc: normalizeFabricKey(docSnap.id),
    websiteId,
    /** Same as docSnap.id — website `getData` merges `doc`; Kurta_style may key off this */
    firestoreDocId: normalizeFabricKey(docSnap.id),
    stylePathId,
    garmentSlots,
    name: displayName,
    fabric: displayName,
    brand: (d.brand || '').toString(),
    brandImg: d.brandImg || d.brandLogo || d.brandImage || '',
    link: d.link || d.videoLink || '',
    des: d.des || d.description || '',
    description: d.description || '',
    color: d.color || '',
    colorCode: Array.isArray(d.colorCode) ? d.colorCode : hexCodes,
    colors: Array.isArray(d.colors) ? d.colors : [],
    hexCodes,
    weave: d.weave || '',
    composition: d.material || d.composition || '',
    pattern: d.pattern || '',
    width: d.width || '',
    weight: d.weight || '',
    stock: d.stock ?? 0,
    price: readFabricPrice(d),
    src: typeof d.src === 'string' ? d.src : typeof d.fabricImg === 'string' ? d.fabricImg : '',
    fabricImg: typeof d.fabricImg === 'string' ? d.fabricImg : typeof d.src === 'string' ? d.src : '',
    imageList,
    thumbnail,
    recommended_buttons: Array.isArray(d.recommended_buttons) ? d.recommended_buttons : undefined,
    default_recommended_button: d.default_recommended_button || undefined,
  };
}

/** Keys under which merged `kurtaRenders[fabricID]` should resolve (website `id` ≠ `fabricID` cases). */
export function fabricRenderLookupKeys(fabric) {
  if (!fabric) return [];
  const out = new Set();
  const add = (v) => {
    const x = normalizeFabricKey(v);
    if (x) out.add(x);
  };
  add(fabric.fabricID);
  add(fabric.websiteId);
  add(fabric.stylePathId);
  add(fabric.firestoreDocId);
  return [...out];
}

/**
 * @param {Record<string, { display?: object, style?: object }>|undefined} map
 * @param {{ fabricID?: string, websiteId?: string, stylePathId?: string, firestoreDocId?: string }|null|undefined} fabric
 */
export function pickFabricRenderEntry(map, fabric) {
  if (!fabric || !map) return null;
  const tryKeys = [fabric.fabricID, fabric.websiteId, fabric.stylePathId, fabric.firestoreDocId];
  for (const k of tryKeys) {
    if (k == null || k === '') continue;
    const e = map[String(k)];
    if (e) return e;
  }
  return null;
}

/**
 * Normalize admin `material` (metal, plastic, …) to UI-friendly label.
 */
function normalizeButtonMaterial(m) {
  if (m == null || String(m).trim() === '') return 'Plastic';
  const s = String(m).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Merge render maps: admin may use top-level `renders`, duplicate `resources` object,
 * and/or `Buttons/{id}/style/{layerCode}` docs with `{ src }` (Button_upload.jsx).
 */
function mergeButtonRenderEntry(d, styleSnap) {
  /** @type {Record<string, { uri: string }>} */
  const renders = {};
  const addFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.entries(obj).forEach(([code, url]) => {
      if (typeof url === 'string' && url.length > 0) renders[code] = { uri: url };
    });
  };
  addFromObject(d.renders);
  addFromObject(d.resources);
  if (styleSnap) {
    styleSnap.forEach((layerDoc) => {
      const url = readSrcField(layerDoc.data());
      if (url) renders[layerDoc.id] = { uri: url };
    });
  }
  return renders;
}

/**
 * Buttons collection: legacy `renders` on doc; admin panel also uses `resources` + subcollection `style`.
 * Icon: `iconUrl` or admin `src`. Link: `linkedFabricID` or admin `fabricId` (often fabric name).
 * @param {import('firebase/firestore').Firestore} db
 */
export async function fetchButtonsCollection(db) {
  const snap = await getDocs(collection(db, 'Buttons'));
  const docs = snap.docs;
  const styleSnaps = await Promise.all(
    docs.map((docSnap) =>
      getDocs(collection(db, 'Buttons', docSnap.id, 'style')).catch(() => null)
    )
  );

  return docs.map((docSnap, idx) => {
    const d = docSnap.data() || {};
    const renders = mergeButtonRenderEntry(d, styleSnaps[idx]);
    const iconRaw = d.iconUrl || d.src;
    const icon = typeof iconRaw === 'string' && iconRaw.length ? { uri: iconRaw } : null;
    return {
      id: docSnap.id,
      name: d.name || docSnap.id,
      material: normalizeButtonMaterial(d.material),
      icon,
      linkedFabricID: d.linkedFabricID ?? d.fabricId ?? undefined,
      targetType: d.targetType,
      parentCategory: d.parentCategory ?? d.type,
      style: d.style,
      color: d.color,
      renders,
    };
  });
}

/**
 * Optional: single doc read (same as website getDatafromDoc pattern).
 * @param {import('firebase/firestore').Firestore} db
 * @param {string[]} pathSegments
 */
export async function getSrcFromDocPath(db, pathSegments) {
  const r = doc(db, ...pathSegments);
  const snap = await getDoc(r);
  if (!snap.exists()) return null;
  const url = readSrcField(snap.data());
  return url ? { uri: url } : null;
}

/**
 * Subcollections under `Fabric/embroidery/{segment}` where admin EmbroideryForm writes * design docs (parent has `style` = style catalog doc id, plus `style` subcoll with layer `{src}`).
 */
const ADMIN_EMBROIDERY_GARMENTS = ['coat', 'pant', 'shirt', 'vest', 'pajama', 'sadri', 'kurta'];
const ADMIN_EMBROIDERY_PARTS = ['base', 'sleeve', 'lapel', 'collar', 'pocket', 'epaulette'];
const ADMIN_EMBROIDERY_CATEGORIES = ['suits', 'kurta', 'sadri', 'blazer'];
const ADMIN_EMBROIDERY_CATEGORY_TO_TYPES = {
  suits: ['coat', 'pant', 'shirt', 'vest', 'sadri', 'kurta'],
  kurta: ['coat', 'pajama', 'sadri', 'kurta'],
  sadri: ['coat', 'sadri', 'kurta'],
  blazer: ['coat'],
};

const ADMIN_EMBROIDERY_LAYOUT_SEGMENTS = ADMIN_EMBROIDERY_GARMENTS.flatMap((garment) =>
  ADMIN_EMBROIDERY_PARTS.map((part) => `${garment}_${part}`)
);

const LEGACY_EMBROIDERY_LAYOUT_SEGMENTS = [
  'kurta_kurta_base',
  'kurta_kurta_sleeve',
  'kurta_kurta_lapel',
  'kurta_kurta_collar',
  'kurta_kurta_pocket',
  'kurta_kurta_epaulette',
  'kurta_sadri_base',
  'kurta_collections',
  'Suits_collections',
  'formal_collections',
  'blazer_collections',
];

export const APP_EMBROIDERY_LAYOUT_SEGMENTS = [
  ...ADMIN_EMBROIDERY_LAYOUT_SEGMENTS,
  ...LEGACY_EMBROIDERY_LAYOUT_SEGMENTS.filter((segment) => !ADMIN_EMBROIDERY_LAYOUT_SEGMENTS.includes(segment)),
];

const LEGACY_EMBROIDERY_UPLOAD_COLLECTIONS = [
  { value: 'Suits_collections', label: 'Suit' },
  { value: 'formal_collections', label: 'Formal' },
  { value: 'blazer_collections', label: 'Blazer' },
  { value: 'kurta_collections', label: 'Kurta' },
  { value: 'kurta_sadri_base', label: 'Sadri' },
];

function emptyEmbroideryBundle() {
  return {
    display: {},
    sadriChestLeft: {},
    sadriChestRight: {},
    coatChestLeft: {},
    coatChestRight: {},
    folded: {},
    uploadsByDocId: {},
    uploadsByType: {},
    uploadsBySelectionKey: {},
  };
}

function emptyEmbroideryUploadDocBundle() {
  return {
    display: {},
    sadriChestLeft: {},
    sadriChestRight: {},
    coatChestLeft: {},
    coatChestRight: {},
    folded: {},
  };
}

function adminEmbroideryDocPath(category, garmentType, docId, subcollection) {
  const segments = ['Fabric', 'embroidery', normalizeEmbroideryLookupKey(category), normalizeEmbroideryLookupKey(garmentType), normalizeEmbroideryLookupKey(subcollection)];
  if (docId != null) segments.push(String(docId));
  return segments;
}

function adminEmbroideryPairs() {
  return ADMIN_EMBROIDERY_CATEGORIES.flatMap((category) =>
    (ADMIN_EMBROIDERY_CATEGORY_TO_TYPES[category] || []).map((garmentType) => ({ category, garmentType }))
  );
}

function parseEmbroiderySegment(segment) {
  const normalized = String(segment || '').trim().toLowerCase();
  if (!normalized) return { garment: '', part: '', normalized: '' };

  if (normalized.includes('/')) {
    const [category = '', garment = '', part = ''] = normalized.split('/');
    return { category, garment, part, normalized };
  }

  if (normalized.includes('_collections')) {
    return { category: '', garment: normalized.replace('_collections', ''), part: 'collection', normalized };
  }

  const parts = normalized.split('_');
  if (parts.length >= 3 && parts[0] === 'kurta') {
    return { category: '', garment: parts[1] || '', part: parts.slice(2).join('_') || '', normalized };
  }

  if (parts.length >= 2) {
    return { category: '', garment: parts[0] || '', part: parts.slice(1).join('_') || '', normalized };
  }

  return { category: '', garment: normalized, part: '', normalized };
}

function isSadriEmbroiderySegment(segment) {
  return parseEmbroiderySegment(segment).garment === 'sadri';
}

function isCoatEmbroiderySegment(segment) {
  return parseEmbroiderySegment(segment).garment === 'coat';
}

function normalizeEmbroideryLookupKey(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

function makeEmbroiderySelectionKey(typeKey, docId) {
  const type = normalizeEmbroideryLookupKey(typeKey);
  const id = normalizeEmbroideryLookupKey(docId);
  if (!type || !id) return '';
  return `${type}::${id}`;
}

function embroideryCodeAliases(segment, code) {
  const raw = String(code || '').trim();
  if (!raw) return [];

  const out = [];
  const seen = new Set();
  const push = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };

  push(raw);

  // Handle E-XX <-> EXX aliases for ALL segments (kurta + sadri).
  if (/^E-[A-Za-z0-9_]+/.test(raw)) {
    push('E' + raw.slice(2));
  } else if (/^E[A-Za-z0-9]/.test(raw) && !raw.startsWith('E-')) {
    push('E-' + raw.slice(1));
  }

  // Also index without -F/-S view suffixes.
  if (raw.endsWith('-F') || raw.endsWith('-S')) {
    push(raw.slice(0, -2));
  }

  return out;
}

/** Style catalog: `Fabric/embroidery/styles/{id}` */
export async function fetchEmbroideryStyleDocuments(db) {
  const snap = await getDocs(collection(db, 'Fabric', 'embroidery', 'styles'));
  return snap.docs;
}
/**
 * Load all layer URLs for one embroidery style id (matches parent design doc field `style`).
 */
export async function fetchEmbroideryRendersForStyleId(
  db,
  styleId,
  segments = APP_EMBROIDERY_LAYOUT_SEGMENTS
) {
  const sid = normalizeFabricKey(styleId);
  if (!sid) return emptyEmbroideryBundle();

  const bundle = emptyEmbroideryBundle();

  const applyLayer = (target, segment, code, url) => {
    if (!code || typeof url !== 'string' || !url.length) return;
    const src = { uri: url };
    const aliases = embroideryCodeAliases(segment, code);
    if (isSadriEmbroiderySegment(segment)) {
      aliases.forEach((alias) => {
        target.sadriChestLeft[alias] = src;
        target.sadriChestRight[alias] = src;
      });
    } else if (isCoatEmbroiderySegment(segment)) {
      aliases.forEach((alias) => {
        target.coatChestLeft[alias] = src;
        target.coatChestRight[alias] = src;
      });
    } else {
      const rawCode = String(code).trim();
      const isStyleVariant = rawCode.endsWith('-S');
      const isDisplayVariant = rawCode.endsWith('-F');
      const destination = isStyleVariant ? target.folded : target.display;

      aliases.forEach((alias) => {
        destination[alias] = src;
        if (isDisplayVariant || isStyleVariant) {
          const unsuffixed = alias.endsWith('-F') || alias.endsWith('-S') ? alias.slice(0, -2) : alias;
          destination[unsuffixed] = src;
        }
      });
    }
  };

  const indexUploadDoc = (docId, data, segment, docBundle, fallbackMeta = {}) => {
    const isCollection = Boolean(
      fallbackMeta.isCollection || (Array.isArray(data.values) && data.values.length > 0)
    );
    bundle.uploadsByDocId[docId] = {
      ...docBundle,
      docId,
      segment,
      type: data.type || '',
      garment: data.targetType || fallbackMeta.garment || '',
      part: data.targetPart || data.part || fallbackMeta.part || '',
      category: data.targetCategory || fallbackMeta.category || '',
      name: data.name || docId,
      refPath: data.refPath || fallbackMeta.refPath || '',
      values: Array.isArray(data.values) ? data.values : [],
      isCollection,
    };

    const selectionKey = makeEmbroiderySelectionKey(segment, docId);
    if (selectionKey) {
      bundle.uploadsBySelectionKey[selectionKey] = bundle.uploadsByDocId[docId];
    }

    const keys = [
      data.type,
      data.part,
      data.name,
      docId,
      segment,
    ].map(normalizeEmbroideryLookupKey);

    keys.forEach((key) => {
      if (!key) return;
      const prev = bundle.uploadsByType[key] || emptyEmbroideryUploadDocBundle();
      bundle.uploadsByType[key] = {
        ...prev,
        display: { ...(prev.display || {}), ...(docBundle.display || {}) },
        sadriChestLeft: { ...(prev.sadriChestLeft || {}), ...(docBundle.sadriChestLeft || {}) },
        sadriChestRight: { ...(prev.sadriChestRight || {}), ...(docBundle.sadriChestRight || {}) },
        coatChestLeft: { ...(prev.coatChestLeft || {}), ...(docBundle.coatChestLeft || {}) },
        coatChestRight: { ...(prev.coatChestRight || {}), ...(docBundle.coatChestRight || {}) },
        folded: { ...(prev.folded || {}), ...(docBundle.folded || {}) },
      };
    });
  };

  const absorbDoc = async (docSnap, segment, fallbackMeta = {}, styleSubcollectionPath = null) => {
    const data = docSnap.data() || {};
    const linked = normalizeFabricKey(data.style);
    const vals = Array.isArray(data.values) ? data.values : [];
    const matchesDirect = linked && linked === sid;
    const matchesViaValues = vals.some((v) => normalizeFabricKey(v?.style) === sid);
    if (!matchesDirect && !matchesViaValues) return;

    const docBundle = emptyEmbroideryUploadDocBundle();
    const target = {
      display: bundle.display,
      folded: bundle.folded,
      sadriChestLeft: bundle.sadriChestLeft,
      sadriChestRight: bundle.sadriChestRight,
      coatChestLeft: bundle.coatChestLeft,
      coatChestRight: bundle.coatChestRight,
    };

    const res = data.resources;
    if (res && typeof res === 'object') {
      Object.entries(res).forEach(([code, url]) => {
        if (typeof url !== 'string') return;
        applyLayer(target, segment, code, url);
        applyLayer(docBundle, segment, code, url);
      });
    }

    if (styleSubcollectionPath) {
      try {
        const styleSnap = await getDocs(collection(db, ...styleSubcollectionPath));
        styleSnap.forEach((layerDoc) => {
          const url = readSrcField(layerDoc.data());
          if (!url) return;
          applyLayer(target, segment, layerDoc.id, url);
          applyLayer(docBundle, segment, layerDoc.id, url);
        });
      } catch {
        /* no style subcollection */
      }
    }

    indexUploadDoc(String(docSnap.id), data, segment, docBundle, fallbackMeta);
  };

  for (const { category, garmentType } of adminEmbroideryPairs()) {
    let embroiderySnap;
    try {
      embroiderySnap = await getDocs(collection(db, ...adminEmbroideryDocPath(category, garmentType, null, 'embroideries')));
    } catch {
      continue;
    }

    for (const docSnap of embroiderySnap.docs) {
      const data = docSnap.data() || {};
      const part = normalizeEmbroideryLookupKey(data.targetPart || '');
      const segment = `${normalizeEmbroideryLookupKey(garmentType)}_${part}`;
      await absorbDoc(
        docSnap,
        segment,
        {
          category,
          garment: garmentType,
          part,
          refPath: adminEmbroideryDocPath(category, garmentType, docSnap.id, 'embroideries').join('/'),
        },
        adminEmbroideryDocPath(category, garmentType, docSnap.id, 'embroideries').concat('style')
      );
    }
  }

  for (const { category, garmentType } of adminEmbroideryPairs()) {
    let collectionsSnap;
    try {
      collectionsSnap = await getDocs(collection(db, ...adminEmbroideryDocPath(category, garmentType, null, 'collections')));
    } catch {
      continue;
    }

    for (const docSnap of collectionsSnap.docs) {
      await absorbDoc(
        docSnap,
        `${normalizeEmbroideryLookupKey(category)}/${normalizeEmbroideryLookupKey(garmentType)}`,
        {
          category,
          garment: garmentType,
          part: 'collection',
          isCollection: true,
          refPath: adminEmbroideryDocPath(category, garmentType, docSnap.id, 'collections').join('/'),
        },
        null
      );
    }
  }

  for (const segment of segments) {
    let collSnap;
    try {
      collSnap = await getDocs(collection(db, 'Fabric', 'embroidery', segment));
      if (typeof __DEV__ !== 'undefined' && __DEV__ && collSnap.size > 0) {
        console.log(`[Maviinci] Embroidery segment "${segment}": ${collSnap.size} docs fetched`);
      }
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(`[Maviinci] Embroidery segment "${segment}" fetch failed:`, err.message);
      }
      continue;
    }
    for (const docSnap of collSnap.docs) {
      const parsedSegment = parseEmbroiderySegment(segment);
      await absorbDoc(docSnap, segment, {
        garment: parsedSegment.garment,
        part: parsedSegment.part,
      }, ['Fabric', 'embroidery', segment, docSnap.id, 'style']);
    }
  }

  return bundle;
}

/**
 * Website admin collections: new schema stores them under
 * `Fabric/embroidery/{category}/{type}/collections/{collectionId}` with `values[]`.
 * Legacy flat buckets remain as fallback.
 */
export const EMBROIDERY_UPLOAD_COLLECTIONS = [
  ...adminEmbroideryPairs().map(({ category, garmentType }) => ({
    value: `${category}/${garmentType}`,
    label: `${category}/${garmentType}`,
    category,
    garmentType,
  })),
  ...LEGACY_EMBROIDERY_UPLOAD_COLLECTIONS,
];

function embroideryValueTypeMatchesPanel(typeKey, panelMode, bucketName) {
  const t = String(typeKey || '').toLowerCase();
  const bucket = String(bucketName || '').toLowerCase();
  const isSadriPanel = panelMode === 'Sadri';
  const isCoatPanel = panelMode === 'Coat';
  const bucketGarment = parseEmbroiderySegment(bucket).garment;
  const typeGarment = parseEmbroiderySegment(t).garment;

  if (isSadriPanel) {
    if (bucketGarment === 'sadri' || typeGarment === 'sadri') return true;
    return bucket === 'kurta_sadri_base';
  }

  if (isCoatPanel) {
    return bucketGarment === 'coat' || typeGarment === 'coat';
  }

  if (bucketGarment === 'kurta' || typeGarment === 'kurta') return true;
  if (bucket === 'kurta_collections') return true;

  // Legacy generic buckets were historically displayed on the Kurta panel.
  if (bucket.endsWith('_collections')) return true;

  return false;
}

function uploadedCollectionMatchesStyleAndPanel(data, sid, panelMode, bucketName) {
  const vals = Array.isArray(data.values) ? data.values : [];
  const forStyle = vals.filter((v) => v && normalizeFabricKey(v.style) === sid);
  if (!forStyle.length) return false;
  return forStyle.some((v) => {
    const valueKey = v.refPath
      ? `${normalizeEmbroideryLookupKey(v.targetCategory)}/${normalizeEmbroideryLookupKey(v.targetType)}/${normalizeEmbroideryLookupKey(v.targetPart)}`
      : v.type;
    return embroideryValueTypeMatchesPanel(valueKey, panelMode, bucketName);
  });
}

function matchingUploadedCollectionValues(data, sid, panelMode, bucketName) {
  const vals = Array.isArray(data?.values) ? data.values : [];
  return vals.filter((v) => {
    if (!v || typeof v !== 'object') return false;
    const valueKey = v.refPath
      ? `${normalizeEmbroideryLookupKey(v.targetCategory)}/${normalizeEmbroideryLookupKey(v.targetType)}/${normalizeEmbroideryLookupKey(v.targetPart)}`
      : v.type;
    return normalizeFabricKey(v.style) === sid && embroideryValueTypeMatchesPanel(valueKey, panelMode, bucketName);
  });
}

/**
 * Admin embroidery “collection” cards for one style id (`Embroidery_collection.jsx` list when a style is opened).
 */
export async function fetchEmbroideryUploadedCollectionsForStyleId(db, styleId, panelMode = 'Kurta') {
  const sid = normalizeFabricKey(styleId);
  if (!sid) return [];

  const out = [];
  for (const entry of EMBROIDERY_UPLOAD_COLLECTIONS) {
    const { value, label, category, garmentType } = entry;
    let snap;
    try {
      if (category && garmentType) {
        snap = await getDocs(collection(db, ...adminEmbroideryDocPath(category, garmentType, null, 'collections')));
      } else {
        snap = await getDocs(collection(db, 'Fabric', 'embroidery', value));
      }
    } catch {
      continue;
    }
    for (const docSnap of snap.docs) {
      const data = docSnap.data() || {};
      if (!Array.isArray(data.values) || data.values.length === 0) continue;
      if (!uploadedCollectionMatchesStyleAndPanel(data, sid, panelMode, value)) continue;

      const vals = matchingUploadedCollectionValues(data, sid, panelMode, value);
      const thumb =
        (typeof data.src === 'string' && data.src.length > 0 && data.src) || readSrcField(data);
      const price = parseMoney(data.price ?? data.Price);
      const resolvedCategory = normalizeEmbroideryLookupKey(data.targetCategory || category);
      const resolvedGarmentType = normalizeEmbroideryLookupKey(data.targetType || garmentType);

      out.push({
        id: docSnap.id,
        segment: value,
        name: data.name || docSnap.id,
        type: label,
        price,
        renderCount: vals.length,
        imageUri: thumb || null,
        targetCategory: resolvedCategory,
        targetType: resolvedGarmentType,
        targetPart: normalizeEmbroideryLookupKey(data.targetPart),
        matchingValues: vals,
      });
    }
  }

  out.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' }));
  return out;
}

/**
 * Merge local embroidery map with remote `{ [styleId]: partial bundle }` (local is often `{}`).
 */
export function mergeEmbroideryRenderMaps(localMap, remoteMap) {
  const ids = new Set([
    ...Object.keys(localMap || {}),
    ...Object.keys(remoteMap || {}),
  ]);
  const out = {};
  for (const id of ids) {
    const loc = localMap?.[id];
    const rem = remoteMap?.[id];
    const hasRemote =
      rem &&
      (Object.keys(rem.display || {}).length > 0 ||
        Object.keys(rem.sadriChestLeft || {}).length > 0 ||
        Object.keys(rem.sadriChestRight || {}).length > 0 ||
        Object.keys(rem.coatChestLeft || {}).length > 0 ||
        Object.keys(rem.coatChestRight || {}).length > 0 ||
        Object.keys(rem.folded || {}).length > 0 ||
        Object.keys(rem.uploadsByDocId || {}).length > 0 ||
        Object.keys(rem.uploadsByType || {}).length > 0 ||
        Object.keys(rem.uploadsBySelectionKey || {}).length > 0);
    if (!hasRemote) {
      if (loc) out[id] = loc;
      continue;
    }
    out[id] = {
      display: { ...(loc?.display || {}), ...(rem.display || {}) },
      sadriChestLeft: { ...(loc?.sadriChestLeft || {}), ...(rem.sadriChestLeft || {}) },
      sadriChestRight: { ...(loc?.sadriChestRight || {}), ...(rem.sadriChestRight || {}) },
      coatChestLeft: { ...(loc?.coatChestLeft || {}), ...(rem.coatChestLeft || {}) },
      coatChestRight: { ...(loc?.coatChestRight || {}), ...(rem.coatChestRight || {}) },
      folded: { ...(loc?.folded || {}), ...(rem.folded || {}) },
      uploadsByDocId: { ...(loc?.uploadsByDocId || {}), ...(rem.uploadsByDocId || {}) },
      uploadsByType: { ...(loc?.uploadsByType || {}), ...(rem.uploadsByType || {}) },
      uploadsBySelectionKey: { ...(loc?.uploadsBySelectionKey || {}), ...(rem.uploadsBySelectionKey || {}) },
    };
  }
  return out;
}
