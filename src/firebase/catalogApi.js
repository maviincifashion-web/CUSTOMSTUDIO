import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { fabricGarmentPath, KURTA_FABRIC_LIST_PATH_CANDIDATES, kurtaFabricListPath } from './paths';

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
  for (const key of ['url', 'imageUrl', 'downloadURL', 'image', 'uri', 'link']) {
    const v = data[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
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

/**
 * Tries each candidate id until display/style has at least one layer URL.
 * Master `Suits/fabrics` rows often key `Kurta_style` by Firestore doc id while `fabricID` is a SKU.
 * @param {import('firebase/firestore').Firestore} db
 * @param {'kurta'|'pajama'|'sadri'|'coat'} garment
 * @param {string[]} candidateIds e.g. [stylePathId, fabricID, firestoreDocId]
 */
export async function fetchGarmentRenderBundleWithFallback(db, garment, candidateIds) {
  const ids = [...new Set((candidateIds || []).filter(Boolean).map(String))];
  if (ids.length === 0) return { display: {}, style: {} };
  /** @type {{ display: Record<string, { uri: string }>, style: Record<string, { uri: string }> }} */
  let last = { display: {}, style: {} };
  for (const id of ids) {
    const bundle = await fetchGarmentRenderBundleWithSuitsFallback(db, garment, id);
    const n =
      Object.keys(bundle.display || {}).length + Object.keys(bundle.style || {}).length;
    last = bundle;
    if (n > 0) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(
          `[Maviinci] ${garment} renders: id="${id}" (${Object.keys(bundle.display).length} display, ${Object.keys(bundle.style).length} style)`
        );
      }
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
  for (const segments of KURTA_FABRIC_LIST_PATH_CANDIDATES) {
    const colRef = collection(db, ...segments);
    const snap = await getDocs(colRef);
    if (snap.size > 0) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[Maviinci] Firestore fabric list: ${segments.join('/')} (${snap.size} docs)`);
      }
      return snap.docs;
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
    websiteId,
    /** Same as docSnap.id — website `getData` merges `doc`; Kurta_style may key off this */
    firestoreDocId: normalizeFabricKey(docSnap.id),
    stylePathId,
    garmentSlots,
    name: displayName,
    brand: (d.brand || '').toString(),
    description: d.description || '',
    colors: Array.isArray(d.colors) ? d.colors : [],
    hexCodes,
    weave: d.weave || '',
    composition: d.material || d.composition || '',
    pattern: d.pattern || '',
    width: d.width || '',
    weight: d.weight || '',
    stock: d.stock ?? 0,
    price: typeof d.price === 'number' ? d.price : Number(d.price) || 0,
    thumbnail,
    recommended_buttons: Array.isArray(d.recommended_buttons) ? d.recommended_buttons : undefined,
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
 * Buttons collection: doc fields `name`, `material`, `renders` map code→URL, optional `iconUrl`, `linkedFabricID`
 * @param {import('firebase/firestore').Firestore} db
 */
export async function fetchButtonsCollection(db) {
  const snap = await getDocs(collection(db, 'Buttons'));
  /** @type {Array<{ id: string, name: string, material: string, icon: { uri: string }|null, linkedFabricID?: string, renders: Record<string, { uri: string }> }>} */
  const list = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data() || {};
    const renders = {};
    const raw = d.renders;
    if (raw && typeof raw === 'object') {
      Object.entries(raw).forEach(([code, url]) => {
        if (typeof url === 'string' && url.length > 0) renders[code] = { uri: url };
      });
    }
    list.push({
      id: docSnap.id,
      name: d.name || docSnap.id,
      material: d.material || 'Plastic',
      icon: typeof d.iconUrl === 'string' && d.iconUrl.length ? { uri: d.iconUrl } : null,
      linkedFabricID: d.linkedFabricID,
      renders,
    });
  });
  return list;
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
