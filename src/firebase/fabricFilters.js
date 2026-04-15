/**
 * Per-garment fabric lists (SUITS_WEBSITE getFabricDetails) — master is `Fabric/Suits/fabrics`,
 * but Kurta/Pajama/Sadri tabs only show subsets. We match that via optional allowlist
 * subcollections or `garmentTypes` / similar fields on each fabric doc.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';

/** Try these subcollections under `Fabric/kurta` for Kurta-visible fabric ids (doc id = style id or fabricID). */
export const KURTA_ALLOWLIST_PATHS = [
  ['Fabric', 'kurta', 'Kurta'],
  ['Fabric', 'kurta', 'kurtaFabrics'],
  ['Fabric', 'kurta', 'KurtaFabrics'],
];

export const PAJAMA_ALLOWLIST_PATHS = [
  ['Fabric', 'kurta', 'Pajama'],
  ['Fabric', 'kurta', 'PajamaFabrics'],
];

export const SADRI_ALLOWLIST_PATHS = [
  ['Fabric', 'kurta', 'Sadri'],
  ['Fabric', 'kurta', 'SadriFabrics'],
];

export const COAT_ALLOWLIST_PATHS = [
  ['Fabric', 'kurta', 'Coat'],
  ['Fabric', 'kurta', 'CoatFabrics'],
  ['Fabric', 'kurta', 'coat'],
];

/**
 * @param {import('firebase/firestore').QuerySnapshot} snap
 * @returns {Set<string>}
 */
export function idsFromAllowlistSnapshot(snap) {
  const ids = new Set();
  snap.forEach((d) => {
    const data = d.data() || {};
    ids.add(d.id);
    if (data.fabricID != null) ids.add(String(data.fabricID));
    if (data.id != null) ids.add(String(data.id));
  });
  return ids;
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {string[][]} pathCandidates
 * @returns {Promise<Set<string>|null>}
 */
export async function fetchFirstAllowlist(db, pathCandidates) {
  for (const segments of pathCandidates) {
    try {
      const snap = await getDocs(collection(db, ...segments));
      if (snap.size > 0) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`[Maviinci] Garment allowlist: ${segments.join('/')} (${snap.size} ids)`);
        }
        return idsFromAllowlistSnapshot(snap);
      }
    } catch (e) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Maviinci] allowlist path skipped', segments.join('/'), e?.message || e);
      }
    }
  }
  return null;
}

/**
 * Same as fetchFirstAllowlist, but returns full docs for metadata (e.g. price).
 * @param {import('firebase/firestore').Firestore} db
 * @param {string[][]} pathCandidates
 * @returns {Promise<Array<import('firebase/firestore').QueryDocumentSnapshot>|null>}
 */
export async function fetchFirstAllowlistDocs(db, pathCandidates) {
  for (const segments of pathCandidates) {
    try {
      const snap = await getDocs(collection(db, ...segments));
      if (snap.size > 0) {
        return snap.docs;
      }
    } catch {
      /* ignore and try next path */
    }
  }
  return null;
}

/**
 * Build a map: fabric key -> candidate style ids from garment allowlist collections.
 * Rows may contain `fabricID` + `id`; we keep both plus allowlist doc id.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string[][]} pathCandidates
 * @returns {Promise<Record<string, string[]>|null>}
 */
export async function fetchFirstAllowlistStyleIdMap(db, pathCandidates) {
  for (const segments of pathCandidates) {
    try {
      const snap = await getDocs(collection(db, ...segments));
      if (snap.size === 0) continue;
      /** @type {Record<string, Set<string>>} */
      const byKey = {};
      const addFor = (key, val) => {
        if (key == null || val == null) return;
        const k = String(key).trim();
        const v = String(val).trim();
        if (!k || !v) return;
        if (!byKey[k]) byKey[k] = new Set();
        byKey[k].add(v);
      };
      snap.forEach((d) => {
        const data = d.data() || {};
        const keys = [
          data.fabricID,
          data.id,
          data.styleDocId,
          d.id,
        ].filter((x) => x != null && String(x).trim().length > 0);
        const ids = [
          data.id,
          data.styleDocId,
          data.fabricID,
          d.id,
        ].filter((x) => x != null && String(x).trim().length > 0);
        keys.forEach((k) => ids.forEach((v) => addFor(k, v)));
      });
      /** @type {Record<string, string[]>} */
      const out = {};
      Object.entries(byKey).forEach(([k, set]) => {
        out[k] = [...set];
      });
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(
          `[Maviinci] Garment style-id map: ${segments.join('/')} (${Object.keys(out).length} keys)`
        );
      }
      return out;
    } catch (e) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Maviinci] style-id map path skipped', segments.join('/'), e?.message || e);
      }
    }
  }
  return null;
}

/**
 * Optional: query master collection when allowlist docs don't exist (needs composite index if used).
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} field
 * @param {unknown} value
 */
export async function fetchMasterDocsByField(db, field, value) {
  try {
    const coll = collection(db, 'Fabric', 'Suits', 'fabrics');
    const q = query(coll, where(field, '==', value));
    const snap = await getDocs(q);
    return snap.size > 0 ? snap.docs : null;
  } catch {
    return null;
  }
}

/**
 * When no `Fabric/kurta/Kurta` allowlist exists, try common boolean / array fields on master docs
 * (same intent as website getFabricDetails filters).
 * @returns {Promise<Set<string>|null>}
 */
function idsFromDocSnapArray(docs) {
  const ids = new Set();
  docs.forEach((d) => {
    const data = d.data() || {};
    ids.add(d.id);
    if (data.fabricID != null) ids.add(String(data.fabricID));
    if (data.id != null) ids.add(String(data.id));
  });
  return ids;
}

export async function tryKurtaAllowlistFromMasterQueries(db) {
  const tries = [
    ['kurta', true],
    ['forKurta', true],
    ['showKurta', true],
  ];
  for (const [field, val] of tries) {
    const docs = await fetchMasterDocsByField(db, field, val);
    if (docs?.length) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[Maviinci] Kurta subset via', field);
      }
      return idsFromDocSnapArray(docs);
    }
  }
  try {
    const coll = collection(db, 'Fabric', 'Suits', 'fabrics');
    const q = query(coll, where('garmentTypes', 'array-contains', 'Kurta'));
    const snap = await getDocs(q);
    if (snap.size > 0) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('[Maviinci] Kurta subset via garmentTypes array-contains');
      }
      return idsFromAllowlistSnapshot(snap);
    }
  } catch {
    /* missing index */
  }
  return null;
}

/**
 * @param {object} profile from mapFabricDocToProfile (must include garmentSlots if present)
 * @param {string} garmentKey 'Kurta' | 'Pajama' | 'Sadri' | 'Coat'
 */
export function profileMatchesGarmentSlot(profile, garmentKey) {
  const slots = profile.garmentSlots;
  if (!slots || !Array.isArray(slots) || slots.length === 0) return true;
  const g = garmentKey.toLowerCase();
  return slots.some((s) => String(s).toLowerCase() === g || String(s).toLowerCase().includes(g));
}

/**
 * @param {Array<object>} profiles
 * @param {'Kurta'|'Pajama'|'Sadri'|'Coat'} garmentKey
 * @param {Set<string>|null|undefined} allowlist
 */
export function filterFabricsForGarment(profiles, garmentKey, allowlist) {
  if (!profiles?.length) return profiles;
  if (allowlist && allowlist.size > 0) {
    return profiles.filter(
      (p) => allowlist.has(p.fabricID) || allowlist.has(p.stylePathId) || allowlist.has(String(p.fabricID))
    );
  }
  const anySlots = profiles.some((p) => p.garmentSlots && p.garmentSlots.length > 0);
  if (anySlots) {
    return profiles.filter((p) => profileMatchesGarmentSlot(p, garmentKey));
  }
  return profiles;
}
