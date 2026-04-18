import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  DUMMY_FABRICS,
  DUMMY_BUTTONS,
  DUMMY_SADRI_BUTTONS,
  DUMMY_COAT_BUTTONS,
  KURTA_RENDERS as LOCAL_KURTA,
  PAJAMA_RENDERS as LOCAL_PAJAMA,
  SADRI_RENDERS as LOCAL_SADRI,
  COAT_RENDERS as LOCAL_COAT,
} from '../Data/dummyData';
import { getFirestoreDb, isFirebaseConfigured } from '../firebase/config';
import {
  fetchKurtaFabricDocuments,
  fetchGarmentRenderBundleWithFallback,
  fetchButtonsCollection,
  mapFabricDocToProfile,
  fabricRenderLookupKeys,
  readSrcField,
  fetchEmbroideryStyleDocuments,
  fetchEmbroideryRendersForStyleId,
  mergeEmbroideryRenderMaps,
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

/** Single image field on embroidery style doc (string or nested `{ src, url, … }`). */
function embroideryFieldImageUri(data, keys) {
  if (!data || typeof data !== 'object') return null;
  for (const key of keys) {
    if (!(key in data)) continue;
    const v = data[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const u = readSrcField(v);
      if (u) return u;
    }
  }
  return null;
}

/** Admin “other” / gallery images: `otherImages[]`, `otherImage`, etc. */
function embroideryExtraProfileUris(data) {
  if (!data || typeof data !== 'object') return [];
  const out = [];
  const seen = new Set();
  const addUrl = (u) => {
    if (typeof u !== 'string') return;
    const t = u.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  const addVal = (v) => {
    if (typeof v === 'string') addUrl(v);
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      const u = readSrcField(v);
      if (u) addUrl(u);
    }
  };
  const arrays = [data.otherImages, data.extraImages, data.gallery, data.profileGallery];
  for (const arr of arrays) {
    if (Array.isArray(arr)) arr.forEach(addVal);
  }
  addVal(data.otherImage);
  addVal(data.other_image);
  addVal(data.otherProfileImage);
  addVal(data.secondaryImage);
  addVal(data.altImage);
  return out;
}

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
  
  const renderBundleCacheRef = useRef(new Map());
  const renderBundleInFlightRef = useRef(new Map());
  const [remoteEmbroideryByStyleId, setRemoteEmbroideryByStyleId] = useState({});
  const [embroideryCollectionsRemote, setEmbroideryCollectionsRemote] = useState(null);
  const embroideryInflightRef = useRef(new Map());

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

        // 1. Fetch main fabrics
        const docs = await fetchKurtaFabricDocuments(db);
        if (cancelled) return;
        
        if (docs.length === 0) {
          setLoadError('Firebase connected but kurta fabric list is empty.');
          setRemoteFabrics(null);
          setFabricsLoading(false); // End loading here if empty
          return;
        } 

        const list = docs
          .map((d) => mapFabricDocToProfile(d, localThumb))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        // OPTIMIZATION: Push fabrics to UI instantly so the screen renders!
        setRemoteFabrics(list);
        setFabricsLoading(false); // Stop loading spinner immediately

        // 2. Fetch Allowlists & Metadata in the background (Non-blocking)
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
        
        if (cancelled) return;

        let kurtaAl = kAl;
        if (!kurtaAl || kurtaAl.size === 0) {
          kurtaAl = await tryKurtaAllowlistFromMasterQueries(db);
        }

        setGarmentAllowlists({ Kurta: kurtaAl, Pajama: pAl, Sadri: sAl, Coat: cAl });
        setGarmentStyleIdMap({ Kurta: kMap || {}, Pajama: pMap || {}, Sadri: sMap || {}, Coat: cMap || {} });
        setGarmentPriceHints({
          Kurta: makePriceHintMap(kDocs),
          Pajama: makePriceHintMap(pDocs),
          Sadri: makePriceHintMap(sDocs),
          Coat: makePriceHintMap(cDocs),
        });

        // 3. Fetch Buttons in background
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
          setFabricsLoading(false);
        }
      }
    })();
    
    return () => { cancelled = true; };
  }, [enabled, localThumb]);

  const prefetchFabricRenders = useCallback(async (fabricOrId) => {
    if (!enabled || fabricOrId == null) return;
    const fabric = typeof fabricOrId === 'string' ? { fabricID: fabricOrId, stylePathId: fabricOrId } : fabricOrId;
    const mergeKey = fabric.fabricID;
    
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

      const fetchGarment = async (garmentType, ids) => {
        const cacheKey = `${garmentType}:${ids.join('|')}`;
        if (renderBundleCacheRef.current.has(cacheKey)) return renderBundleCacheRef.current.get(cacheKey);
        if (renderBundleInFlightRef.current.has(cacheKey)) return renderBundleInFlightRef.current.get(cacheKey);
        
        const req = fetchGarmentRenderBundleWithFallback(db, garmentType, ids)
          .then((bundle) => {
            const n =
              Object.keys(bundle?.display || {}).length + Object.keys(bundle?.style || {}).length;
            if (n > 0) {
              renderBundleCacheRef.current.set(cacheKey, bundle);
            }
            renderBundleInFlightRef.current.delete(cacheKey);
            return bundle;
          })
          .catch((err) => {
            renderBundleInFlightRef.current.delete(cacheKey);
            throw err;
          });
          
        renderBundleInFlightRef.current.set(cacheKey, req);
        return req;
      };

      const [k, p, s, c] = await Promise.all([
        fetchGarment('kurta', idsForGarment('Kurta')),
        fetchGarment('pajama', idsForGarment('Pajama')),
        fetchGarment('sadri', idsForGarment('Sadri')),
        fetchGarment('coat', idsForGarment('Coat')),
      ]);

      const aliasKeys = fabricRenderLookupKeys(fabric);
      const applyAliases = (setter, bundle) => {
        setter((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const key of aliasKeys) {
            if (next[key] !== bundle) {
              next[key] = bundle;
              changed = true;
            }
          }
          return changed ? next : prev;
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

  const prefetchEmbroideryRenders = useCallback(
    async (styleId) => {
      if (!enabled || styleId == null || String(styleId).trim() === '') return undefined;
      const sid = String(styleId).trim();
      if (embroideryInflightRef.current.has(sid)) return embroideryInflightRef.current.get(sid);
      const db = getFirestoreDb();
      if (!db) return undefined;
      const p = fetchEmbroideryRendersForStyleId(db, sid)
        .then((maps) => {
          setRemoteEmbroideryByStyleId((prev) => ({ ...prev, [sid]: maps }));
          embroideryInflightRef.current.delete(sid);
          return maps;
        })
        .catch((err) => {
          embroideryInflightRef.current.delete(sid);
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[Maviinci] prefetchEmbroideryRenders', sid, err);
          }
        });
      embroideryInflightRef.current.set(sid, p);
      return p;
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      const db = getFirestoreDb();
      if (!db) return;
      try {
        const docs = await fetchEmbroideryStyleDocuments(db);
        if (cancelled) return;
        const list = docs.map((docSnap) => {
          const d = docSnap.data() || {};
          const thumb =
            readSrcField(d) ||
            embroideryFieldImageUri(d, ['profileImage', 'thumbnail', 'image', 'photo']);
          const sadriUri = embroideryFieldImageUri(d, [
            'profileImageSadri',
            'sadriProfileImage',
            'profile_image_sadri',
          ]);
          const extraUris = embroideryExtraProfileUris(d);
          let price = 0;
          if (typeof d.price === 'number' && Number.isFinite(d.price)) price = d.price;
          else if (typeof d.price === 'string') {
            const n = Number(String(d.price).replace(/[^\d.-]/g, ''));
            if (Number.isFinite(n)) price = n;
          }
          const description =
            typeof d.description === 'string' && d.description.trim().length > 0
              ? d.description.trim()
              : typeof d.des === 'string' && d.des.trim().length > 0
                ? d.des.trim()
                : '';
          return {
            id: docSnap.id,
            name: d.name || docSnap.id,
            description,
            price,
            profileImage: thumb ? { uri: thumb } : null,
            profileImageSadri: sadriUri ? { uri: sadriUri } : null,
            /** Firebase “other” / gallery uploads — info carousel mein main / Sadri ke baad */
            profileExtraImages: extraUris.map((u) => ({ uri: u })),
            availableRegions: Array.isArray(d.availableRegions)
              ? d.availableRegions
              : ['Chest', 'Collar', 'Sleeve'],
          };
        });
        setEmbroideryCollectionsRemote(list);
      } catch (e) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Maviinci] embroidery styles fetch', e);
        }
        if (!cancelled) setEmbroideryCollectionsRemote([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /** Prefetch layer maps for every catalog style so Kurta vs Sadri filtering matches Firebase segments. */
  useEffect(() => {
    if (!enabled) return;
    const list = embroideryCollectionsRemote;
    if (!Array.isArray(list) || list.length === 0) return;
    for (const row of list) {
      const id = row?.id;
      if (id != null && String(id).trim() !== '') prefetchEmbroideryRenders(String(id).trim());
    }
  }, [enabled, embroideryCollectionsRemote, prefetchEmbroideryRenders]);

  const embroideryCollections = useMemo(() => {
    if (!enabled) return [];
    const remote = embroideryCollectionsRemote;
    if (remote == null) return null;
    return Array.isArray(remote) ? remote : [];
  }, [enabled, embroideryCollectionsRemote]);

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
          if (hinted > 0) return { ...p, price: hinted };
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
  const embroideryRenders = useMemo(
    () => mergeEmbroideryRenderMaps({}, remoteEmbroideryByStyleId),
    [remoteEmbroideryByStyleId]
  );

  const buttons = useMemo(() => mergeButtons(DUMMY_BUTTONS, remoteButtons || []), [remoteButtons]);

  const value = useMemo(
    () => ({
      firebaseEnabled: enabled,
      fabricsLoading,
      loadError,
      fabrics,
      fabricsByGarment,
      prefetchFabricRenders,
      prefetchEmbroideryRenders,
      embroideryCollections,
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
      enabled, fabricsLoading, loadError, fabrics, fabricsByGarment,
      prefetchFabricRenders, prefetchEmbroideryRenders, embroideryCollections,
      kurtaRenders, pajamaRenders, sadriRenders,
      coatRenders, embroideryRenders, buttons,
    ]
  );

  return <FirebaseCatalogContext.Provider value={value}>{children}</FirebaseCatalogContext.Provider>;
}

export function useFirebaseCatalog() {
  const ctx = useContext(FirebaseCatalogContext);
  if (!ctx) throw new Error('useFirebaseCatalog must be used within FirebaseCatalogProvider');
  return ctx;
}
