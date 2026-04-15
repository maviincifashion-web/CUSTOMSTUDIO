import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DUMMY_FABRICS,
  DUMMY_BUTTONS,
  DUMMY_SADRI_BUTTONS,
  DUMMY_COAT_BUTTONS,
  KURTA_RENDERS as LOCAL_KURTA,
  PAJAMA_RENDERS as LOCAL_PAJAMA,
  SADRI_RENDERS as LOCAL_SADRI,
  COAT_RENDERS as LOCAL_COAT,
  EMBROIDERY_RENDERS as LOCAL_EMBROIDERY,
} from '../Data/dummyData';
import { getFirestoreDb, isFirebaseConfigured } from '../firebase/config';
import {
  fetchKurtaFabricDocuments,
  fetchGarmentRenderBundleWithFallback,
  fetchButtonsCollection,
  mapFabricDocToProfile,
  fabricRenderLookupKeys,
} from '../firebase/catalogApi';
import {
  KURTA_ALLOWLIST_PATHS,
  PAJAMA_ALLOWLIST_PATHS,
  SADRI_ALLOWLIST_PATHS,
  COAT_ALLOWLIST_PATHS,
  fetchFirstAllowlist,
  fetchFirstAllowlistDocs,
  fetchFirstAllowlistStyleIdMap,
  tryKurtaAllowlistFromMasterQueries,
  filterFabricsForGarment,
} from '../firebase/fabricFilters';

function mergeLayerMaps(local, remote) {
  if (!remote || Object.keys(remote).length === 0) return local;
  return { ...local, ...remote };
}

function mergeGarmentEntry(localEntry, remoteEntry) {
  if (!remoteEntry) return localEntry;
  return {
    display: mergeLayerMaps(localEntry?.display || {}, remoteEntry.display || {}),
    style: mergeLayerMaps(localEntry?.style || {}, remoteEntry.style || {}),
  };
}

function mergeGarmentMap(localMap, remoteMap) {
  const ids = new Set([...Object.keys(localMap || {}), ...Object.keys(remoteMap || {})]);
  const out = {};
  for (const id of ids) {
    out[id] = mergeGarmentEntry(localMap?.[id], remoteMap?.[id]);
  }
  return out;
}

function mergeButtons(localList, remoteList) {
  if (!remoteList?.length) return localList;
  const byId = new Map(localList.map((b) => [b.id, { ...b, renders: { ...b.renders } }]));
  for (const b of remoteList) {
    const prev = byId.get(b.id);
    if (prev) {
      byId.set(b.id, {
        ...prev,
        ...b,
        renders: { ...prev.renders, ...b.renders },
      });
    } else {
      byId.set(b.id, b);
    }
  }
  return Array.from(byId.values());
}

const FirebaseCatalogContext = createContext(null);

export function FirebaseCatalogProvider({ children }) {
  const localThumb = DUMMY_FABRICS[0]?.thumbnail;
  const [remoteFabrics, setRemoteFabrics] = useState(null);
  const [remoteKurta, setRemoteKurta] = useState({});
  const [remotePajama, setRemotePajama] = useState({});
  const [remoteSadri, setRemoteSadri] = useState({});
  const [remoteCoat, setRemoteCoat] = useState({});
  const [remoteButtons, setRemoteButtons] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [fabricsLoading, setFabricsLoading] = useState(false);
  const [garmentAllowlists, setGarmentAllowlists] = useState(null);
  const [garmentStyleIdMap, setGarmentStyleIdMap] = useState(null);
  const [garmentPriceHints, setGarmentPriceHints] = useState(null);

  const parseMoney = useCallback((value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      if (!cleaned) return 0;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }, []);

  const priceFromDocData = useCallback((data) => {
    if (!data || typeof data !== 'object') return 0;
    const keys = ['price', 'Price', 'fabricPrice', 'amount', 'mrp', 'MRP', 'salePrice', 'sellingPrice', 'cost'];
    for (const k of keys) {
      if (data[k] != null) {
        const p = parseMoney(data[k]);
        if (p > 0) return p;
      }
    }
    return 0;
  }, [parseMoney]);

  const makePriceHintMap = useCallback((docs) => {
    /** @type {Record<string, number>} */
    const out = {};
    (docs || []).forEach((docSnap) => {
      const d = docSnap.data() || {};
      const price = priceFromDocData(d);
      if (!(price > 0)) return;
      const keys = [d.fabricID, d.id, d.styleDocId, docSnap.id]
        .filter((x) => x != null && String(x).trim().length > 0)
        .map((x) => String(x));
      keys.forEach((k) => {
        out[k] = price;
      });
    });
    return out;
  }, [priceFromDocData]);

  const enabled = isFirebaseConfigured();

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      setFabricsLoading(true);
      setLoadError(null);
      try {
        const db = getFirestoreDb();
        if (!db) {
          setLoadError('Firebase init failed (missing config).');
          return;
        }
        const docs = await fetchKurtaFabricDocuments(db);
        if (cancelled) return;
        if (docs.length === 0) {
          setLoadError(
            'Firebase connected but kurta fabric list is empty. Collection path may differ from admin — check Metro log for [Maviinci] paths or src/firebase/paths.js.'
          );
          setRemoteFabrics(null);
        } else {
          const list = docs
            .map((d) => mapFabricDocToProfile(d, localThumb))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

          const [kAl, pAl, sAl, cAl, kMap, pMap, sMap, cMap, kDocs, pDocs, sDocs, cDocs] = await Promise.all([
            fetchFirstAllowlist(db, KURTA_ALLOWLIST_PATHS),
            fetchFirstAllowlist(db, PAJAMA_ALLOWLIST_PATHS),
            fetchFirstAllowlist(db, SADRI_ALLOWLIST_PATHS),
            fetchFirstAllowlist(db, COAT_ALLOWLIST_PATHS),
            fetchFirstAllowlistStyleIdMap(db, KURTA_ALLOWLIST_PATHS),
            fetchFirstAllowlistStyleIdMap(db, PAJAMA_ALLOWLIST_PATHS),
            fetchFirstAllowlistStyleIdMap(db, SADRI_ALLOWLIST_PATHS),
            fetchFirstAllowlistStyleIdMap(db, COAT_ALLOWLIST_PATHS),
            fetchFirstAllowlistDocs(db, KURTA_ALLOWLIST_PATHS),
            fetchFirstAllowlistDocs(db, PAJAMA_ALLOWLIST_PATHS),
            fetchFirstAllowlistDocs(db, SADRI_ALLOWLIST_PATHS),
            fetchFirstAllowlistDocs(db, COAT_ALLOWLIST_PATHS),
          ]);
          let kurtaAl = kAl;
          if (!kurtaAl || kurtaAl.size === 0) {
            kurtaAl = await tryKurtaAllowlistFromMasterQueries(db);
          }
          setGarmentAllowlists({
            Kurta: kurtaAl,
            Pajama: pAl,
            Sadri: sAl,
            Coat: cAl,
          });
          setGarmentStyleIdMap({
            Kurta: kMap || {},
            Pajama: pMap || {},
            Sadri: sMap || {},
            Coat: cMap || {},
          });
          setGarmentPriceHints({
            Kurta: makePriceHintMap(kDocs),
            Pajama: makePriceHintMap(pDocs),
            Sadri: makePriceHintMap(sDocs),
            Coat: makePriceHintMap(cDocs),
          });
          setRemoteFabrics(list);
        }

        try {
          const btns = await fetchButtonsCollection(db);
          if (!cancelled) setRemoteButtons(btns.length ? btns : null);
        } catch (e) {
          console.warn('Firebase buttons fetch failed', e);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(String(e?.message || e));
          setRemoteFabrics(null);
        }
      } finally {
        if (!cancelled) setFabricsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, localThumb]);

  /**
   * @param {string | { fabricID: string, stylePathId?: string, websiteId?: string, firestoreDocId?: string }} fabricOrId
   * Fetches layers using Kurta_style/Pajama_style doc id(s); merges maps under `fabricID` for the UI.
   */
  const prefetchFabricRenders = useCallback(async (fabricOrId) => {
    if (!enabled || fabricOrId == null) return;
    const fabric =
      typeof fabricOrId === 'string'
        ? { fabricID: fabricOrId, stylePathId: fabricOrId }
        : fabricOrId;
    const mergeKey = fabric.fabricID;
    /** Website order: `id` field (Suits/fabrics query), then SKU, then Firestore doc id — see SUITS getData `doc` */
    const candidateIds = [
      fabric.websiteId,
      fabric.stylePathId,
      fabric.fabricID,
      fabric.firestoreDocId,
    ].filter((x) => x != null && String(x).length > 0);
    if (!mergeKey || candidateIds.length === 0) return;

    const db = getFirestoreDb();
    if (!db) return;
    try {
      const maps = garmentStyleIdMap || { Kurta: {}, Pajama: {}, Sadri: {}, Coat: {} };
      const baseKeys = fabricRenderLookupKeys(fabric);
      const idsForGarment = (garmentLabel) => {
        const set = new Set(candidateIds);
        for (const key of baseKeys) {
          const extra = maps?.[garmentLabel]?.[String(key)];
          if (Array.isArray(extra)) extra.forEach((id) => set.add(String(id)));
        }
        return [...set];
      };
      const [k, p, s, c] = await Promise.all([
        fetchGarmentRenderBundleWithFallback(db, 'kurta', idsForGarment('Kurta')),
        fetchGarmentRenderBundleWithFallback(db, 'pajama', idsForGarment('Pajama')),
        fetchGarmentRenderBundleWithFallback(db, 'sadri', idsForGarment('Sadri')),
        fetchGarmentRenderBundleWithFallback(db, 'coat', idsForGarment('Coat')),
      ]);
      const aliasKeys = fabricRenderLookupKeys(fabric);
      const applyAliases = (setter, bundle) => {
        setter((prev) => {
          const next = { ...prev };
          for (const key of aliasKeys) {
            next[key] = bundle;
          }
          return next;
        });
      };
      applyAliases(setRemoteKurta, k);
      applyAliases(setRemotePajama, p);
      applyAliases(setRemoteSadri, s);
      applyAliases(setRemoteCoat, c);
    } catch (e) {
      console.warn('prefetchFabricRenders', mergeKey, e);
    }
  }, [enabled, garmentStyleIdMap]);

  const fabrics = remoteFabrics ?? DUMMY_FABRICS;

  const fabricsByGarment = useMemo(() => {
    const base = remoteFabrics ?? DUMMY_FABRICS;
    const al = garmentAllowlists || { Kurta: null, Pajama: null, Sadri: null, Coat: null };
    const ph = garmentPriceHints || { Kurta: {}, Pajama: {}, Sadri: {}, Coat: {} };
    const withPriceHints = (list, garmentLabel) => {
      const priceMap = ph?.[garmentLabel] || {};
      return (list || []).map((p) => {
        const keys = fabricRenderLookupKeys(p);
        for (const k of keys) {
          const hinted = priceMap[String(k)];
          if (hinted > 0) {
            return { ...p, price: hinted };
          }
        }
        return p;
      });
    };
    return {
      Kurta: withPriceHints(filterFabricsForGarment(base, 'Kurta', al.Kurta), 'Kurta'),
      Pajama: withPriceHints(filterFabricsForGarment(base, 'Pajama', al.Pajama), 'Pajama'),
      Sadri: withPriceHints(filterFabricsForGarment(base, 'Sadri', al.Sadri), 'Sadri'),
      Coat: withPriceHints(filterFabricsForGarment(base, 'Coat', al.Coat), 'Coat'),
    };
  }, [remoteFabrics, garmentAllowlists, garmentPriceHints]);

  const firstKurtaFabricId = fabricsByGarment.Kurta?.[0]?.fabricID;
  useEffect(() => {
    if (!enabled || !fabrics?.length) return;
    const firstKurta = fabricsByGarment.Kurta?.[0] || fabrics[0];
    prefetchFabricRenders(firstKurta);
  }, [enabled, fabrics?.length, firstKurtaFabricId, prefetchFabricRenders, fabrics, fabricsByGarment.Kurta]);

  const kurtaRenders = useMemo(() => mergeGarmentMap(LOCAL_KURTA, remoteKurta), [remoteKurta]);
  const pajamaRenders = useMemo(() => mergeGarmentMap(LOCAL_PAJAMA, remotePajama), [remotePajama]);
  const sadriRenders = useMemo(() => mergeGarmentMap(LOCAL_SADRI, remoteSadri), [remoteSadri]);
  const coatRenders = useMemo(() => mergeGarmentMap(LOCAL_COAT, remoteCoat), [remoteCoat]);
  const embroideryRenders = LOCAL_EMBROIDERY;

  const buttons = useMemo(
    () => mergeButtons(DUMMY_BUTTONS, remoteButtons || []),
    [remoteButtons]
  );

  const value = useMemo(
    () => ({
      firebaseEnabled: enabled,
      fabricsLoading,
      loadError,
      fabrics,
      fabricsByGarment,
      prefetchFabricRenders,
      kurtaRenders,
      pajamaRenders,
      sadriRenders,
      coatRenders,
      embroideryRenders,
      buttons,
      sadriButtons: DUMMY_SADRI_BUTTONS,
      coatButtons: DUMMY_COAT_BUTTONS,
    }),
    [
      enabled,
      fabricsLoading,
      loadError,
      fabrics,
      fabricsByGarment,
      prefetchFabricRenders,
      kurtaRenders,
      pajamaRenders,
      sadriRenders,
      coatRenders,
      embroideryRenders,
      buttons,
    ]
  );

  return <FirebaseCatalogContext.Provider value={value}>{children}</FirebaseCatalogContext.Provider>;
}

export function useFirebaseCatalog() {
  const ctx = useContext(FirebaseCatalogContext);
  if (!ctx) {
    throw new Error('useFirebaseCatalog must be used within FirebaseCatalogProvider');
  }
  return ctx;
}
