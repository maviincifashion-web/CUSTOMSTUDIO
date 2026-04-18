import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Animated, Easing, ScrollView, Image, Platform, Linking, Modal, Share } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SvgCssUri } from 'react-native-svg/css';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as ExpoLinking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../../firebase/config';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';

import {
    INITIAL_SELECTION,
    DUMMY_SADRI_BUTTONS,
    DUMMY_COAT_BUTTONS,
} from '../../Data/dummyData';
import { useFirebaseCatalog } from '../../context/FirebaseCatalogContext';
import { KURTA_STYLE_OPTIONS } from '../../Data/styleData';
import { useOutfit } from '../../context/OutfitContext';

// --- YAHAN MODEL COMPONENT IMPORT HUA HAI ---
import KurtaModel from './components/KurtaModel';
import EmbroideryPreviewModal from './components/EmbroideryPreviewModal';
import KurtaFolded from './components/KurtaFolded';
import PajamaStylePreview from './components/PajamaStylePreview';
import FullScreenCarousel from '../../../components/FullScreenCarousel';

import { IconFabric, IconStyle, IconEmbroidery, IconExtras } from '../../icons/ExtraIcons';

import ExtrasSummary from '../../../assets/images/extra_icons/summary-01.svg';
import ExtrasFavourite from '../../../assets/images/extra_icons/favourite-01.svg';
import ExtrasShare from '../../../assets/images/extra_icons/share-01.svg';
import ExtrasSkinTone from '../../../assets/images/extra_icons/skin tone-01.svg';
import appLogo from '../../../assets/images/icon.png';

const EXTRAS_TRAY_ITEMS = [
    { id: 0, Icon: ExtrasSummary, label: 'Summary' },
    { id: 1, Icon: ExtrasFavourite, label: 'Favourite' },
    { id: 2, Icon: ExtrasShare, label: 'Share' },
    { id: 3, Icon: ExtrasSkinTone, label: 'Skin Tone' },
];

const PUBLIC_SHARE_BASE_URL = 'https://maviinci.in/s';

function buildPublicShareUrlFromSid(sid) {
    const cleanSid = normalizeId(sid);
    if (!cleanSid) return '';
    return `${PUBLIC_SHARE_BASE_URL}/${encodeURIComponent(cleanSid)}`;
}

const BG_THEMES = [
    { start: '#e5e5e5', end: '#bdbab3' },
    { start: '#bdbab3', end: '#ada0a0' },
    { start: '#ada0a0', end: '#bdbab3' },
    { start: '#b8d1cf', end: '#e5e5e5' },
];

function hexToRgb(hex) {
    const cleaned = String(hex || '').replace('#', '').trim();
    if (!/^[0-9a-fA-F]{3,8}$/.test(cleaned)) return null;
    const short = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned.slice(0, 6);
    const value = parseInt(short, 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
}

function hueFromRgb(rgb) {
    if (!rgb) return null;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = ((b - r) / d) + 2;
    else h = ((r - g) / d) + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
}

function hueFromHex(hex) {
    const rgb = hexToRgb(hex);
    return hueFromRgb(rgb);
}

function circularDistanceDeg(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function meanHue(hues) {
    if (!hues.length) return null;
    let sumSin = 0;
    let sumCos = 0;
    hues.forEach((h) => {
        const rad = (h * Math.PI) / 180;
        sumSin += Math.sin(rad);
        sumCos += Math.cos(rad);
    });
    const angle = (Math.atan2(sumSin, sumCos) * 180) / Math.PI;
    return (angle + 360) % 360;
}

function pickThemeIndexFromFabrics(fabrics) {
    const directHexes = [];
    const colorNames = [];
    const pushHex = (v) => {
        if (typeof v !== 'string') return;
        const t = v.trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(t)) directHexes.push(t);
    };
    const pushName = (v) => {
        if (typeof v !== 'string') return;
        const t = v.trim().toLowerCase();
        if (t) colorNames.push(t);
    };
    (fabrics || []).forEach((f) => {
        if (!f) return;
        if (Array.isArray(f.colorCode)) f.colorCode.forEach(pushHex);
        else pushHex(f.colorCode);
        if (Array.isArray(f.hexCodes)) f.hexCodes.forEach(pushHex);
        else pushHex(f.hexCodes);
        if (Array.isArray(f.colors)) f.colors.forEach(pushName);
        pushName(f.color);
    });

    const fabricHues = directHexes
        .map(hueFromHex)
        .filter((v) => typeof v === 'number');

    if (!fabricHues.length) {
        const joined = colorNames.join(' ');
        const nameHueMap = [
            { re: /(red|maroon|burgundy|crimson)/, hue: 0 },
            { re: /(orange|rust|terracotta|peach)/, hue: 25 },
            { re: /(yellow|gold|mustard)/, hue: 52 },
            { re: /(green|olive|mint|teal)/, hue: 135 },
            { re: /(cyan|aqua|turquoise)/, hue: 180 },
            { re: /(blue|navy|royal)/, hue: 220 },
            { re: /(purple|violet|lavender|mauve)/, hue: 275 },
            { re: /(pink|rose|magenta)/, hue: 330 },
            { re: /(white|off white|ivory|cream|beige|silver|grey|gray|black|charcoal)/, hue: 35 },
        ];
        nameHueMap.forEach(({ re, hue }) => {
            if (re.test(joined)) fabricHues.push(hue);
        });
    }

    if (!fabricHues.length) {
        const first = (fabrics || []).find(Boolean);
        const rawKey = first?.fabricID || first?.id || first?.name || '';
        const key = String(rawKey);
        if (!key) return 1;
        let hash = 0;
        for (let i = 0; i < key.length; i += 1) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % BG_THEMES.length;
    }
    const fabricHue = meanHue(fabricHues);
    const oppositeHue = (fabricHue + 180) % 360;

    const themeHues = BG_THEMES.map((t) => {
        const a = hexToRgb(t.start);
        const b = hexToRgb(t.end);
        if (!a || !b) return 0;
        return hueFromRgb({
            r: Math.round((a.r + b.r) / 2),
            g: Math.round((a.g + b.g) / 2),
            b: Math.round((a.b + b.b) / 2),
        });
    });

    let bestIdx = 0;
    let bestDist = Infinity;
    themeHues.forEach((h, idx) => {
        const d = circularDistanceDeg(oppositeHue, h);
        if (d < bestDist) {
            bestDist = d;
            bestIdx = idx;
        }
    });
    return bestIdx;
}

function BackgroundGradient({ start, end }) {
    return (
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
                <LinearGradient id="bgGrad" x1="100%" y1="100%" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor={start} stopOpacity="1" />
                    <Stop offset="100%" stopColor={end} stopOpacity="1" />
                </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#bgGrad)" />
        </Svg>
    );
}

function normalizeId(v) {
    if (v == null) return '';
    return String(v).trim();
}

/** Admin stores `fabricId` as fabric name; legacy dummy uses `linkedFabricID` = SKU — match any known id on the fabric profile. */
function buttonLinkedToFabric(button, fabric) {
    const link = normalizeId(button?.linkedFabricID);
    if (!link || !fabric) return false;
    const linkLc = link.toLowerCase();
    const candidates = [
        fabric.fabricID,
        fabric.id,
        fabric.name,
        fabric.fabric,
        fabric.websiteId,
        fabric.stylePathId,
        fabric.firestoreDocId,
        fabric.doc,
    ]
        .map(normalizeId)
        .filter(Boolean);
    return candidates.some((c) => c.toLowerCase() === linkLc);
}

/** Firebase buttons with `targetType` Sadri/Coat merged into local dummy lists (by id, remote wins fields). */
function mergeRemoteButtonsByTarget(localList, remoteList, targetLabel) {
    const t = String(targetLabel || '').toLowerCase();
    const remote = (remoteList || []).filter(
        (b) => String(b?.targetType || '').toLowerCase() === t
    );
    if (!remote.length) return localList;
    const byId = new Map(
        localList.map((b) => [b.id, { ...b, renders: { ...(b.renders || {}) } }])
    );
    for (const b of remote) {
        const prev = byId.get(b.id);
        if (prev) {
            byId.set(b.id, {
                ...prev,
                ...b,
                renders: { ...(prev.renders || {}), ...(b.renders || {}) },
            });
        } else {
            byId.set(b.id, b);
        }
    }
    return Array.from(byId.values());
}

/** Main kurta picker: only Kurta-target (or legacy rows with no targetType). */
function buttonTargetsKurta(b) {
    const tt = String(b?.targetType || '').toLowerCase();
    return !tt || tt === 'kurta';
}

import { useResponsive } from '../../../hooks/useResponsive';
import { CustomTheme } from '../../../constants/theme';

/** Slide panel scrollviews: thin visible scrollbar (iOS: black indicator + insets; Android: persistent bar). */
const PANEL_SCROLL_PROPS = Platform.select({
    ios: {
        showsVerticalScrollIndicator: true,
        indicatorStyle: 'black',
        scrollIndicatorInsets: { top: 6, bottom: 6, right: 2 },
    },
    android: {
        showsVerticalScrollIndicator: true,
        persistentScrollbar: true,
    },
    default: { showsVerticalScrollIndicator: true },
});

function clamp(v, min, max) {
    'worklet';
    return Math.min(max, Math.max(min, v));
}

function ZoomableImage({ source, imageKey }) {
    const scale = useSharedValue(1);
    const baseScale = useSharedValue(1);

    useEffect(() => {
        scale.value = 1;
        baseScale.value = 1;
    }, [imageKey, scale, baseScale]);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = clamp(baseScale.value * e.scale, 1, 4);
        })
        .onEnd(() => {
            baseScale.value = scale.value;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <GestureDetector gesture={pinch}>
            <Reanimated.Image source={source} style={[styles.viewerImage, animatedStyle]} resizeMode="contain" />
        </GestureDetector>
    );
}

/**
 * Kurta → Sadri (dono set hon to dono slides, chahe URL same ho).
 * Uske baad Firebase “other” / gallery (`profileExtraImages`) — duplicate URL pehle wale slides se skip.
 */
function buildEmbroideryProfileCarouselSources(emb) {
    if (!emb) return [];
    const norm = (src) => {
        if (!src || typeof src !== 'object') return null;
        const uri = src.uri != null ? String(src.uri).trim() : '';
        return uri ? { uri } : null;
    };
    const slides = [];
    const k = norm(emb.profileImage);
    const s = norm(emb.profileImageSadri);
    if (k) slides.push(k);
    if (s) slides.push(s);
    const seen = new Set(slides.map((x) => x.uri));
    const extras = Array.isArray(emb.profileExtraImages) ? emb.profileExtraImages : [];
    for (const ex of extras) {
        const n = norm(ex);
        if (!n || seen.has(n.uri)) continue;
        seen.add(n.uri);
        slides.push(n);
    }
    return slides;
}

export default function KurtaMain({ presetParam, presetIdParam }) {
    const {
        fabrics,
        fabricsByGarment,
        buttons,
        embroideryRenders,
        embroideryCollections: embroideryCollectionsFromCtx,
        prefetchFabricRenders,
        prefetchEmbroideryRenders,
        loadError,
        fabricsLoading,
    } = useFirebaseCatalog();

    const embroideryCollections = embroideryCollectionsFromCtx;

    const listForGarmentTab = useCallback(
        (tab) => {
            const sub = fabricsByGarment?.[tab];
            return sub?.length ? sub : fabrics;
        },
        [fabrics, fabricsByGarment]
    );
    const { width, isDesktop, normalize } = useResponsive();
    const isTabletViewport = !isDesktop && width >= 768;
    const insets = useSafeAreaInsets();
    const { selectedItems, setSelectedItems } = useOutfit();
    const [activePanel, setActivePanel] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [extrasTrayOpen, setExtrasTrayOpen] = useState(false);
    const extrasTrayAnim = useRef(new Animated.Value(0)).current;
    const extrasTrayAnimatingRef = useRef(false);

    // STATE MANAGEMENT
    const [selectedFabric, setSelectedFabric] = useState(fabrics?.[0] || {});
    const [selections, setSelections] = useState(INITIAL_SELECTION || {
        bottomCut: 'R', length: 'K', placketStyle: 'NS', pocketQty: '00', pocketShape: 'R', flapYes: '0', flapShape: 'R', epaulette: '0', collar: 'CM', sleeve: 'SN', cuffStyle: 'US1', embroideryID: null, sadriEmbroideryID: null
    });
    const [selectedButton, setSelectedButton] = useState(INITIAL_SELECTION?.button || (buttons?.[0] ?? null));
    const [selectedSadriButton, setSelectedSadriButton] = useState(DUMMY_SADRI_BUTTONS ? DUMMY_SADRI_BUTTONS[0] : null);
    const [selectedCoatButton, setSelectedCoatButton] = useState(DUMMY_COAT_BUTTONS ? DUMMY_COAT_BUTTONS[0] : null);
    const [isButtonModalOpen, setButtonModalOpen] = useState(false);
    const [isSadriButtonModalOpen, setSadriButtonModalOpen] = useState(false);
    const [isCoatButtonModalOpen, setCoatButtonModalOpen] = useState(false);
    const [isSummaryOpen, setSummaryOpen] = useState(false);
    const [summaryTab, setSummaryTab] = useState('Kurta');
    const [buttonModalTab, setButtonModalTab] = useState('Plastic');
    const [sadriButtonModalTab, setSadriButtonModalTab] = useState('Plastic');
    const [coatButtonModalTab, setCoatButtonModalTab] = useState('Plastic');
    const [selectedPajamaFabric, setSelectedPajamaFabric] = useState(fabrics?.[0] || {});
    const [selectedSadriFabric, setSelectedSadriFabric] = useState(fabrics?.[0] || {});
    const [selectedCoatFabric, setSelectedCoatFabric] = useState(fabrics?.[0] || {});
    const [fabricTab, setFabricTab] = useState('Kurta'); // 'Kurta' | 'Pajama' | 'Sadri' | 'Coat'
    const [embroideryPanelTab, setEmbroideryPanelTab] = useState('Kurta'); // 'Kurta' | 'Sadri'
    const [embroideryPreview, setEmbroideryPreview] = useState(null); // { item, panelMode } | null

    useEffect(() => {
        setEmbroideryPreview(null);
        setInfoEmbroidery(null);
    }, [embroideryPanelTab]);

    const [infoFabric, setInfoFabric] = useState(null);
    /** { item, panelMode } | null — embroidery detail sheet (not collections). */
    const [infoEmbroidery, setInfoEmbroidery] = useState(null);
    const [embInfoImageIndex, setEmbInfoImageIndex] = useState(0);

    useEffect(() => {
        if (!infoEmbroidery?.item) {
            setEmbInfoImageIndex(0);
            return;
        }
        const slides = buildEmbroideryProfileCarouselSources(infoEmbroidery.item);
        const pm = infoEmbroidery.panelMode || 'Kurta';
        if (pm === 'Sadri' && slides.length > 1) setEmbInfoImageIndex(1);
        else setEmbInfoImageIndex(0);
    }, [infoEmbroidery]);
    const [infoImageIndex, setInfoImageIndex] = useState(0);
    const [infoBrandLogoFailed, setInfoBrandLogoFailed] = useState(false);
    const [brandNameWrapWidth, setBrandNameWrapWidth] = useState(0);
    const [brandNameTextWidth, setBrandNameTextWidth] = useState(0);
    const [isFabricViewerOpen, setIsFabricViewerOpen] = useState(false);
    const [fabricViewerImages, setFabricViewerImages] = useState([]);
    const [fabricViewerIndex, setFabricViewerIndex] = useState(0);
    const brandNameTranslateX = useRef(new Animated.Value(0)).current;
    const brandNameMarqueeRef = useRef(null);
    const bgFadeAnim = useRef(new Animated.Value(0)).current;
    const bgTransitionTimerRef = useRef(null);
    const bgAnimatingRef = useRef(false);
    const bgPendingThemeRef = useRef(null);
    const [activeBgThemeIndex, setActiveBgThemeIndex] = useState(0);
    const [incomingBgThemeIndex, setIncomingBgThemeIndex] = useState(null);
    const [isPreparingShareShot, setIsPreparingShareShot] = useState(false);
    const [shareLinkForShot, setShareLinkForShot] = useState('');
    const shareCaptureRef = useRef(null);
    const appliedPresetRef = useRef('');

    const [remotePresetData, setRemotePresetData] = useState(null);

    const localPresetData = useMemo(() => {
        if (!presetParam || typeof presetParam !== 'string') return null;
        try {
            return JSON.parse(decodeURIComponent(presetParam));
        } catch {
            return null;
        }
    }, [presetParam]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!presetIdParam) {
                if (!cancelled) setRemotePresetData(null);
                return;
            }
            try {
                const db = getFirestoreDb();
                if (!db) return;
                const snap = await getDoc(doc(db, 'SharedPresets', presetIdParam));
                if (!snap.exists()) return;
                const data = snap.data()?.payload;
                if (!cancelled && data && typeof data === 'object') {
                    setRemotePresetData(data);
                }
            } catch (e) {
                console.warn('Load shared preset failed', e);
            }
        })();
        return () => { cancelled = true; };
    }, [presetIdParam]);

    const presetData = remotePresetData || localPresetData;

    const fabricsByAnyId = useMemo(() => {
        const map = new Map();
        (fabrics || []).forEach((f) => {
            [f.fabricID, f.id, f.doc, f.websiteId, f.stylePathId, f.firestoreDocId]
                .map(normalizeId)
                .filter(Boolean)
                .forEach((k) => map.set(k, f));
        });
        return map;
    }, [fabrics]);

    const buttonById = useMemo(() => {
        const map = new Map();
        (buttons || []).forEach((b) => map.set(normalizeId(b?.id), b));
        (DUMMY_SADRI_BUTTONS || []).forEach((b) => map.set(normalizeId(b?.id), b));
        (DUMMY_COAT_BUTTONS || []).forEach((b) => map.set(normalizeId(b?.id), b));
        return map;
    }, [buttons]);

    const sadriButtonsMerged = useMemo(
        () => mergeRemoteButtonsByTarget(DUMMY_SADRI_BUTTONS, buttons, 'Sadri'),
        [buttons]
    );
    const coatButtonsMerged = useMemo(
        () => mergeRemoteButtonsByTarget(DUMMY_COAT_BUTTONS, buttons, 'Coat'),
        [buttons]
    );

    useEffect(() => {
        if (selections?.embroideryID) prefetchEmbroideryRenders(selections.embroideryID);
    }, [selections?.embroideryID, prefetchEmbroideryRenders]);

    useEffect(() => {
        if (selections?.sadriEmbroideryID) prefetchEmbroideryRenders(selections.sadriEmbroideryID);
    }, [selections?.sadriEmbroideryID, prefetchEmbroideryRenders]);

    /** Kurta tab: `kurta_kurta_*` segments → `display` / `folded`. Sadri tab: `kurta_sadri_base` → `sadriChestLeft`. */
    const embroideryListKurtaTarget = useMemo(() => {
        if (!Array.isArray(embroideryCollections)) return [];
        return embroideryCollections.filter((e) => {
            const bundle = embroideryRenders?.[e.id];
            const nd = bundle?.display && typeof bundle.display === 'object' ? Object.keys(bundle.display).length : 0;
            const nf = bundle?.folded && typeof bundle.folded === 'object' ? Object.keys(bundle.folded).length : 0;
            return nd + nf > 0;
        });
    }, [embroideryCollections, embroideryRenders]);

    const embroideryListSadriTarget = useMemo(() => {
        if (!Array.isArray(embroideryCollections)) return [];
        return embroideryCollections.filter((e) => {
            const m = embroideryRenders?.[e.id]?.sadriChestLeft;
            return m && typeof m === 'object' && Object.keys(m).length > 0;
        });
    }, [embroideryCollections, embroideryRenders]);

    useEffect(() => {
        if (!fabricsByGarment) return;
        const fix = (sel, tab) => {
            const list = listForGarmentTab(tab);
            if (!list?.length) return sel;
            return sel && list.some((x) => x.fabricID === sel.fabricID) ? sel : list[0];
        };
        setSelectedFabric((f) => fix(f, 'Kurta'));
        setSelectedPajamaFabric((f) => fix(f, 'Pajama'));
        setSelectedSadriFabric((f) => fix(f, 'Sadri'));
        setSelectedCoatFabric((f) => fix(f, 'Coat'));
    }, [fabrics, fabricsByGarment, listForGarmentTab]);

    useEffect(() => {
        const picks = [
            selectedFabric,
            selectedPajamaFabric,
            selectedSadriFabric,
            selectedCoatFabric,
        ].filter(Boolean);
        const seen = new Set();
        picks.forEach((sel) => {
            if (!sel.fabricID || seen.has(sel.fabricID)) return;
            seen.add(sel.fabricID);
            const profile =
                fabrics.find((f) => String(f.fabricID) === String(sel.fabricID)) || sel;
            prefetchFabricRenders(profile);
        });
    }, [
        fabrics,
        selectedFabric,
        selectedPajamaFabric,
        selectedSadriFabric,
        selectedCoatFabric,
        prefetchFabricRenders,
    ]);

    useEffect(() => {
        if (!presetData || !fabrics?.length) return;
        const presetKey = JSON.stringify(presetData);
        if (appliedPresetRef.current === presetKey) return;

        const pickFabric = (id) => {
            const key = normalizeId(id);
            return key ? (fabricsByAnyId.get(key) || null) : null;
        };

        const nextKurta = pickFabric(presetData?.fabrics?.kurta);
        const nextPajama = pickFabric(presetData?.fabrics?.pajama);
        const nextSadri = pickFabric(presetData?.fabrics?.sadri);
        const nextCoat = pickFabric(presetData?.fabrics?.coat);

        if (Array.isArray(presetData?.items) && setSelectedItems) {
            setSelectedItems(presetData.items);
        }
        if (presetData?.selections && typeof presetData.selections === 'object') {
            setSelections((prev) => ({ ...prev, ...presetData.selections }));
        }
        if (nextKurta) setSelectedFabric(nextKurta);
        if (nextPajama) setSelectedPajamaFabric(nextPajama);
        if (nextSadri) setSelectedSadriFabric(nextSadri);
        if (nextCoat) setSelectedCoatFabric(nextCoat);

        const bKurta = buttonById.get(normalizeId(presetData?.buttons?.kurta));
        const bSadri = buttonById.get(normalizeId(presetData?.buttons?.sadri));
        const bCoat = buttonById.get(normalizeId(presetData?.buttons?.coat));
        if (bKurta) setSelectedButton(bKurta);
        if (bSadri) setSelectedSadriButton(bSadri);
        if (bCoat) setSelectedCoatButton(bCoat);

        const tab = presetData?.fabricTab;
        if (['Kurta', 'Pajama', 'Sadri', 'Coat'].includes(tab)) setFabricTab(tab);
        const embTab = presetData?.embroideryTab;
        if (['Kurta', 'Sadri'].includes(embTab)) setEmbroideryPanelTab(embTab);

        appliedPresetRef.current = presetKey;
    }, [presetData, fabrics, fabricsByAnyId, buttonById, setSelectedItems]);

    // Yahan aap apne screens ke hisab se Side Panel ki width set kar sakte hain
    const getDynamicPanelWidth = () => {
        // # MOBILE SCREEN
        if (!isDesktop && width < 768) {
            return width * 0.60;
        }
        // # TABLET SCREEN
        if (!isDesktop) {
            return width * 0.40;
        }
        // # TV SCREEN (Commercial Display)
        if (isDesktop) {
            return Math.min(width * 0.58, 620);
        }
        return width * 0.68;
    };

    const panelWidth = getDynamicPanelWidth();
    const carouselRef = useRef(null);
    const slideAnim = useRef(new Animated.Value(-4000)).current;

    const estimatedDeliveryLabel = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 12);
        const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' }).toLowerCase();
        const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
        const month = d.toLocaleDateString('en-IN', { month: 'short' }).toLowerCase();
        const year = d.toLocaleDateString('en-IN', { year: '2-digit' });
        return `Est. delivery by ${weekday}, ${day} ${month} ${year}`;
    }, []);

    const getFabricPresetId = useCallback((fabric) => (
        normalizeId(fabric?.websiteId) ||
        normalizeId(fabric?.stylePathId) ||
        normalizeId(fabric?.fabricID) ||
        normalizeId(fabric?.firestoreDocId) ||
        normalizeId(fabric?.id) ||
        normalizeId(fabric?.doc) ||
        ''
    ), []);

    const buildSharePreset = useCallback(() => ({
        v: 1,
        items: selectedItems,
        selections,
        fabrics: {
            kurta: getFabricPresetId(selectedFabric),
            pajama: getFabricPresetId(selectedPajamaFabric),
            sadri: getFabricPresetId(selectedSadriFabric),
            coat: getFabricPresetId(selectedCoatFabric),
        },
        buttons: {
            kurta: normalizeId(selectedButton?.id),
            sadri: normalizeId(selectedSadriButton?.id),
            coat: normalizeId(selectedCoatButton?.id),
        },
        fabricTab,
        embroideryTab: embroideryPanelTab,
    }), [
        selectedItems,
        selections,
        selectedFabric,
        selectedPajamaFabric,
        selectedSadriFabric,
        selectedCoatFabric,
        selectedButton,
        selectedSadriButton,
        selectedCoatButton,
        fabricTab,
        embroideryPanelTab,
        getFabricPresetId,
    ]);

    const handleSharePreset = useCallback(async () => {
        try {
            const payload = buildSharePreset();
            let url = '';
            try {
                const db = getFirestoreDb();
                if (db) {
                    const ref = await addDoc(collection(db, 'SharedPresets'), {
                        payload,
                        createdAt: serverTimestamp(),
                        v: 1,
                    });
                    url = buildPublicShareUrlFromSid(ref.id) || ExpoLinking.createURL('/kurta', { queryParams: { sid: ref.id } });
                }
            } catch (e) {
                console.warn('Short link save failed, fallback to inline preset', e);
            }
            if (!url) {
                const preset = encodeURIComponent(JSON.stringify(payload));
                url = ExpoLinking.createURL('/kurta', { queryParams: { preset } });
            }
            setShareLinkForShot(url);
            setIsPreparingShareShot(true);
            carouselRef.current?.scrollToIndex(0);
            await new Promise((resolve) => setTimeout(resolve, 280));
            let screenshotUri = '';
            try {
                if (!shareCaptureRef.current) {
                    throw new Error('Share capture view is not mounted');
                }
                screenshotUri = await captureRef(shareCaptureRef.current, {
                    format: 'jpg',
                    quality: 0.92,
                    result: 'tmpfile',
                });
            } catch (e) {
                console.warn('Share screenshot capture failed', e);
            }
            const message = `Check my Maviinci design: ${url}`;
            const fileUri = screenshotUri
                ? (screenshotUri.startsWith('file://') ? screenshotUri : `file://${screenshotUri}`)
                : undefined;
            if (fileUri) {
                try {
                    // Prefer Share API first: better chance WhatsApp keeps caption with media.
                    await Share.share({
                        title: 'Maviinci design preset',
                        message: `${message}\n${url}`,
                        url: fileUri,
                        ...(Platform.OS === 'android' ? { dialogTitle: 'Share design via' } : {}),
                    });
                    return;
                } catch (err) {
                    console.warn('Share API media+caption failed, fallback to file share', err);
                }
                const canNativeShareFile = await Sharing.isAvailableAsync();
                if (canNativeShareFile) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'image/jpeg',
                        UTI: 'public.jpeg',
                        dialogTitle: 'Share design via',
                    });
                    return;
                }
            }
            await Share.share({
                title: 'Maviinci design preset',
                message: `${message}\n${url}`,
                ...(fileUri ? { url: fileUri } : {}),
                ...(Platform.OS === 'android' ? { dialogTitle: 'Share design via' } : {}),
            });
        } catch (e) {
            console.warn('Share preset failed', e);
        } finally {
            setIsPreparingShareShot(false);
            setShareLinkForShot('');
        }
    }, [buildSharePreset]);

    const animateExtrasTray = useCallback((toOpen) => {
        if (extrasTrayAnimatingRef.current) return;
        extrasTrayAnimatingRef.current = true;
        if (toOpen) setExtrasTrayOpen(true);
        extrasTrayAnim.stopAnimation(() => {
            Animated.spring(extrasTrayAnim, {
                toValue: toOpen ? 1 : 0,
                damping: 20,
                stiffness: 220,
                mass: 0.9,
                useNativeDriver: true,
            }).start(() => {
                extrasTrayAnimatingRef.current = false;
                if (!toOpen) setExtrasTrayOpen(false);
            });
        });
    }, [extrasTrayAnim]);

    const togglePanel = (panelName) => {
        if (extrasTrayOpen) animateExtrasTray(false);
        if (activePanel === panelName && isPanelOpen) closePanel();
        else {
            setActivePanel(panelName); setIsPanelOpen(true);
            Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
        }
    };

    const toggleExtrasTray = () => {
        if (extrasTrayAnimatingRef.current) return;
        if (extrasTrayOpen) return animateExtrasTray(false);
        if (isPanelOpen) closePanel();
        animateExtrasTray(true);
    };

    const closePanel = () => {
        Animated.timing(slideAnim, { toValue: -4000, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
            setIsPanelOpen(false); setActivePanel(null);
        });
    };

    const handleStyleChange = (type, value) => {
        setSelections(prev => ({ ...prev, [type]: value }));
        if (type === 'cuffStyle') {
            carouselRef.current?.scrollToIndex(1);
        } else if (type === 'sadriType') {
            carouselRef.current?.scrollToIndex(0);
        }
    };

    const getInfoImages = useCallback((fabric) => {
        if (!fabric) return [];
        const out = [];
        const push = (v) => {
            if (!v) return;
            if (typeof v === 'string' && v.length > 0) out.push({ uri: v });
            else if (typeof v === 'number') out.push(v);
            else if (typeof v === 'object' && v.uri) out.push(v);
        };
        if (Array.isArray(fabric.imageList)) fabric.imageList.forEach(push);
        push(fabric.fabricImg);
        push(fabric.src);
        push(fabric.thumbnail);
        const seen = new Set();
        return out.filter((img) => {
            const key = typeof img === 'number' ? `r:${img}` : `u:${img.uri}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, []);

    const openFabricInfo = useCallback((fabric) => {
        const imgs = getInfoImages(fabric);
        setInfoFabric(fabric);
        setInfoImageIndex(imgs.length >= 2 ? 1 : 0); // second image first (if present)
        setInfoBrandLogoFailed(false);
    }, [getInfoImages]);

    const normalizeRemoteImageUri = useCallback((rawUri) => {
        if (typeof rawUri !== 'string') return null;
        const uri = rawUri.trim();
        if (!uri) return null;
        if (/^https?:\/\//i.test(uri)) return uri;
        if (/^\/\//.test(uri)) return `https:${uri}`;
        if (/^gs:\/\//i.test(uri)) {
            const rest = uri.replace(/^gs:\/\//i, '');
            const slashIdx = rest.indexOf('/');
            if (slashIdx > 0) {
                const bucket = rest.slice(0, slashIdx);
                const objectPath = rest.slice(slashIdx + 1);
                if (objectPath) {
                    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
                }
            }
        }
        return null;
    }, []);

    const getBrandLogoSource = useCallback((fabric) => {
        if (!fabric) return null;
        const logo = fabric.brandImg || fabric.brandLogo || fabric.brandImage || fabric.logo || null;
        if (!logo) return null;
        if (typeof logo === 'string') {
            const uri = normalizeRemoteImageUri(logo);
            return uri ? { uri } : null;
        }
        if (logo && typeof logo === 'object' && !Array.isArray(logo)) {
            const nested = logo.url || logo.src || logo.uri || logo.image || logo.downloadURL || logo.href || null;
            const nestedUri = normalizeRemoteImageUri(nested);
            if (nestedUri) return { uri: nestedUri };
        }
        return null;
    }, [normalizeRemoteImageUri]);

    const isSvgLogoSource = useCallback((source) => {
        const uri = source && typeof source === 'object' ? source.uri : null;
        return typeof uri === 'string' && /\.svg([\-?#]|$)/i.test(uri);
    }, []);

    useEffect(() => {
        if (brandNameMarqueeRef.current) {
            brandNameMarqueeRef.current.stop();
            brandNameMarqueeRef.current = null;
        }
        brandNameTranslateX.setValue(0);
        if (!infoFabric) return undefined;
        const overflow = brandNameTextWidth - brandNameWrapWidth;
        if (!(overflow > 8)) return undefined;
        const travel = Math.ceil(overflow);
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(700),
                Animated.timing(brandNameTranslateX, {
                    toValue: -travel,
                    duration: Math.max(1800, travel * 24),
                    useNativeDriver: true,
                }),
                Animated.delay(350),
                Animated.timing(brandNameTranslateX, {
                    toValue: 0,
                    duration: Math.max(800, travel * 14),
                    useNativeDriver: true,
                }),
                Animated.delay(400),
            ])
        );
        brandNameMarqueeRef.current = loop;
        loop.start();
        return () => {
            if (brandNameMarqueeRef.current) {
                brandNameMarqueeRef.current.stop();
                brandNameMarqueeRef.current = null;
            }
        };
    }, [infoFabric, brandNameWrapWidth, brandNameTextWidth, brandNameTranslateX]);

    const backgroundThemeTargetIndex = useMemo(() => {
        // Prioritize currently focused garment fabric first, then others as backup.
        const prioritized = [];
        if (fabricTab === 'Pajama') prioritized.push(selectedPajamaFabric);
        else if (fabricTab === 'Sadri') prioritized.push(selectedSadriFabric);
        else if (fabricTab === 'Coat') prioritized.push(selectedCoatFabric);
        else prioritized.push(selectedFabric);

        prioritized.push(selectedFabric, selectedPajamaFabric);
        if (selectedItems?.includes('sadri')) prioritized.push(selectedSadriFabric);
        if (selectedItems?.includes('coat')) prioritized.push(selectedCoatFabric);

        const deduped = [];
        const seen = new Set();
        prioritized.forEach((f) => {
            if (!f) return;
            const k = String(f.fabricID || f.id || f.name || '');
            if (seen.has(k)) return;
            seen.add(k);
            deduped.push(f);
        });
        return pickThemeIndexFromFabrics(deduped);
    }, [fabricTab, selectedFabric, selectedPajamaFabric, selectedSadriFabric, selectedCoatFabric, selectedItems]);

    const startBgTransition = useCallback((toThemeIndex) => {
        if (toThemeIndex === activeBgThemeIndex) return;
        if (bgAnimatingRef.current) {
            bgPendingThemeRef.current = toThemeIndex;
            return;
        }
        if (bgTransitionTimerRef.current) {
            clearTimeout(bgTransitionTimerRef.current);
            bgTransitionTimerRef.current = null;
        }
        bgAnimatingRef.current = true;
        bgTransitionTimerRef.current = setTimeout(() => {
            setIncomingBgThemeIndex(toThemeIndex);
            bgFadeAnim.setValue(0);
            Animated.timing(bgFadeAnim, {
                toValue: 1,
                duration: 3200,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                setActiveBgThemeIndex(toThemeIndex);
                setIncomingBgThemeIndex(null);
                bgFadeAnim.setValue(0);
                bgAnimatingRef.current = false;
                bgTransitionTimerRef.current = null;
                const pending = bgPendingThemeRef.current;
                bgPendingThemeRef.current = null;
                if (typeof pending === 'number' && pending !== toThemeIndex) {
                    startBgTransition(pending);
                }
            });
        }, 520);
    }, [activeBgThemeIndex, bgFadeAnim]);

    useEffect(() => {
        if (backgroundThemeTargetIndex === activeBgThemeIndex) return undefined;
        startBgTransition(backgroundThemeTargetIndex);
        return undefined;
    }, [backgroundThemeTargetIndex, activeBgThemeIndex, startBgTransition]);

    useEffect(() => () => {
        if (bgTransitionTimerRef.current) {
            clearTimeout(bgTransitionTimerRef.current);
            bgTransitionTimerRef.current = null;
        }
    }, []);

    const renderInfoDetailRow = (icon, label, value, opts = {}) => {
        const multiline = !!opts.multiline;
        return (
            <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
                <View style={[styles.infoRowLeft, multiline && styles.infoRowLeftMultiline]}>
                    <View style={styles.infoIconWrap}>
                        <MaterialIcons name={icon} size={14} color={CustomTheme.accentGold} />
                    </View>
                    <Text style={styles.infoLabel}>{label}</Text>
                </View>
                <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value || '-'}</Text>
            </View>
        );
    };

    const summaryTabs = useMemo(() => {
        const tabs = ['Kurta', 'Pajama'];
        if (selectedItems.includes('sadri')) tabs.push('Sadri');
        if (selectedItems.includes('coat')) tabs.push('Coat');
        return tabs;
    }, [selectedItems]);

    useEffect(() => {
        if (!summaryTabs.includes(summaryTab)) {
            setSummaryTab(summaryTabs[0] || 'Kurta');
        }
    }, [summaryTab, summaryTabs]);

    const getSummaryFabricForTab = useCallback((tab) => {
        if (tab === 'Pajama') return selectedPajamaFabric;
        if (tab === 'Sadri') return selectedSadriFabric;
        if (tab === 'Coat') return selectedCoatFabric;
        return selectedFabric;
    }, [selectedFabric, selectedPajamaFabric, selectedSadriFabric, selectedCoatFabric]);

    const getSummaryStyleItems = useCallback((tab) => {
        const selectedKeysByTab = {
            Kurta: ['bottomCut', 'placketStyle', 'pocketQty', 'epaulette', 'sleeve', 'cuffStyle'],
            Pajama: ['pajamaType', 'beltType'],
            Sadri: ['sadriType'],
            Coat: ['coatType', 'coatLapel', 'coatBackStyle'],
        };
        const selectedKeys = selectedKeysByTab[tab] || [];
        return selectedKeys
            .map((key) => {
                const value = selections?.[key];
                if (value == null || value === '') return null;
                const matchingSection = KURTA_STYLE_OPTIONS.find((s) =>
                    s.key === key && Array.isArray(s.options) && s.options.some((o) => o.value === value)
                );
                const option = matchingSection?.options?.find((o) => o.value === value);
                if (!matchingSection || !option) return null;
                return {
                    key,
                    title: matchingSection.title,
                    label: option.label,
                    Icon: option.icon,
                };
            })
            .filter(Boolean);
    }, [selections]);

    const renderFabricCard = (fabric, isActive, onSelect, infoIconSize = 24) => (
        <TouchableOpacity
            key={fabric.fabricID}
            style={[styles.fabricCard, isActive && styles.fabricCardActive]}
            onPress={onSelect}
            activeOpacity={0.9}
        >
            <Image source={fabric.thumbnail} style={styles.fabricImage} resizeMode="cover" />
            <View style={styles.fabricInfo}>
                <View style={styles.fabricInfoTextWrap}>
                    <Text style={styles.fabricName} numberOfLines={1}>{fabric.name}</Text>
                    <Text style={styles.fabricBrand} numberOfLines={1}>{fabric.brand}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => openFabricInfo(fabric)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    style={styles.fabricInfoIconBtn}
                >
                    <MaterialIcons name="info-outline" size={infoIconSize} color="#475569" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderPanelContent = () => {
        const coatType = selections.coatType || 'NONE';
        const isJodhpuriMode = ['JH', 'JR', 'JS', 'JO'].includes(coatType);

        return (
            <View style={{ flex: 1, position: 'relative' }}>
                {/* --- FABRIC PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Fabric' ? 1 : 0, zIndex: activePanel === 'Fabric' ? 10 : 0 }]} pointerEvents={activePanel === 'Fabric' ? 'auto' : 'none'}>
                    {/* SWITCHER TABS */}
                    <View style={styles.fabricSwitcher}>
                        {['Kurta', 'Pajama', ...(selectedItems.includes('sadri') ? ['Sadri'] : []), ...(selectedItems.includes('coat') ? ['Coat'] : [])].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.fabricSwitcherTab, fabricTab === tab && styles.fabricSwitcherTabActive]}
                                onPress={() => setFabricTab(tab)}
                            >
                                <Text style={[styles.fabricSwitcherText, fabricTab === tab && { color: '#fff' }]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* KURTA FABRICS */}
                    {fabricTab === 'Kurta' && fabrics ? (
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.gridContainer}>
                            {listForGarmentTab('Kurta').map((fabric) =>
                                renderFabricCard(
                                    fabric,
                                    selectedFabric?.fabricID === fabric.fabricID,
                                    () => { setSelectedFabric(fabric); },
                                    24
                                )
                            )}
                        </ScrollView>
                    ) : null}

                    {/* PAJAMA FABRICS — same fabric list as Kurta, independent selection */}
                    {fabricTab === 'Pajama' && fabrics ? (
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.gridContainer}>
                            {listForGarmentTab('Pajama').map((fabric) =>
                                renderFabricCard(
                                    fabric,
                                    selectedPajamaFabric?.fabricID === fabric.fabricID,
                                    () => { setSelectedPajamaFabric(fabric); },
                                    28
                                )
                            )}
                        </ScrollView>
                    ) : null}

                    {/* SADRI FABRICS — same fabric list as Kurta, independent selection */}
                    {fabricTab === 'Sadri' && fabrics ? (
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.gridContainer}>
                            {listForGarmentTab('Sadri').map((fabric) =>
                                renderFabricCard(
                                    fabric,
                                    selectedSadriFabric?.fabricID === fabric.fabricID,
                                    () => { setSelectedSadriFabric(fabric); },
                                    24
                                )
                            )}
                        </ScrollView>
                    ) : null}

                    {/* COAT FABRICS — same fabric list as Kurta, independent selection */}
                    {fabricTab === 'Coat' && fabrics ? (
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.gridContainer}>
                            {listForGarmentTab('Coat').map((fabric) =>
                                renderFabricCard(
                                    fabric,
                                    selectedCoatFabric?.fabricID === fabric.fabricID,
                                    () => { setSelectedCoatFabric(fabric); },
                                    18
                                )
                            )}
                        </ScrollView>
                    ) : null}

                    {fabricsLoading && <Text style={styles.panelContent}>Loading fabrics from Firebase…</Text>}
                    {loadError ? <Text style={[styles.panelContent, { color: '#c0392b' }]}>{loadError}</Text> : null}
                </View>

                {/* --- STYLE PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Style' ? 1 : 0, zIndex: activePanel === 'Style' ? 10 : 0 }]} pointerEvents={activePanel === 'Style' ? 'auto' : 'none'}>
                    {KURTA_STYLE_OPTIONS ? (
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 }}>
                            {/* BUTTON PICKER SECTION MAP TO EXACT SCREENSHOT */}
                            <View style={{ marginBottom: 15 }}>
                                <View style={styles.buttonBanner}>
                                    <Text style={styles.buttonBannerText}>Kurta</Text>
                                </View>
                                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Button</Text>
                                <View style={styles.optionRow}>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <View style={styles.buttonIconWrapper}>
                                            {selectedButton && selectedButton.icon ? (
                                                <Image source={selectedButton.icon} style={{ width: 45, height: 45 }} resizeMode="contain" />
                                            ) : (
                                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#888' }} />
                                            )}
                                        </View>
                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                            Button 1
                                        </Text>
                                    </View>

                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => setButtonModalOpen(true)}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                <View style={styles.dot} />
                                                <View style={styles.dot} />
                                                <View style={styles.dot} />
                                            </View>
                                        </TouchableOpacity>
                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                            More{"\n"}options
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {KURTA_STYLE_OPTIONS.map((section, idx) => {
                                if (section.dependency) {
                                    if (section.dependency.isContextItem) {
                                        if (!selectedItems.includes(section.dependency.isContextItem)) return null;
                                    } else {
                                        const depValue = selections[section.dependency.key];
                                        if (section.dependency.notValue && depValue === section.dependency.notValue) return null;
                                        if (section.dependency.andNotValue && depValue === section.dependency.andNotValue) return null;
                                        if (section.dependency.value && depValue !== section.dependency.value) return null;
                                    }
                                }

                                return (
                                    <View
                                        key={idx}
                                        style={[
                                            { marginBottom: 25 },
                                            section.key === 'coatLapel' && isJodhpuriMode
                                                ? { opacity: 0.35 }
                                                : null
                                        ]}
                                    >
                                        {section.key === 'pajamaType' && (
                                            <View style={styles.buttonBanner}>
                                                <Text style={styles.buttonBannerText}>Pajama</Text>
                                            </View>
                                        )}
                                        {section.key === 'sadriType' && selectedItems.includes('sadri') && (
                                            <View style={{ marginBottom: 15 }}>
                                                <View style={styles.buttonBanner}>
                                                    <Text style={styles.buttonBannerText}>Sadri</Text>
                                                </View>
                                                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Sadri Button</Text>
                                                <View style={styles.optionRow}>
                                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                                        <View style={styles.buttonIconWrapper}>
                                                            {selectedSadriButton && selectedSadriButton.icon ? (
                                                                <Image source={selectedSadriButton.icon} style={{ width: 45, height: 45 }} resizeMode="contain" />
                                                            ) : (
                                                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#888' }} />
                                                            )}
                                                        </View>
                                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                                            Button 1
                                                        </Text>
                                                    </View>

                                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => setSadriButtonModalOpen(true)}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                                <View style={styles.dot} />
                                                                <View style={styles.dot} />
                                                                <View style={styles.dot} />
                                                            </View>
                                                        </TouchableOpacity>
                                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                                            More{"\n"}options
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                        {section.key === 'coatType' && idx === firstCoatTypeIndex && selectedItems.includes('coat') && (
                                            <View style={{ marginBottom: 15 }}>
                                                <View style={styles.buttonBanner}>
                                                    <Text style={styles.buttonBannerText}>Coat</Text>
                                                </View>
                                                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Coat Button</Text>
                                                <View style={styles.optionRow}>
                                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                                        <View style={styles.buttonIconWrapper}>
                                                            {selectedCoatButton && selectedCoatButton.icon ? (
                                                                <Image source={selectedCoatButton.icon} style={{ width: 45, height: 45 }} resizeMode="contain" />
                                                            ) : (
                                                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#888' }} />
                                                            )}
                                                        </View>
                                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                                            Button 1
                                                        </Text>
                                                    </View>

                                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => setCoatButtonModalOpen(true)}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                                <View style={styles.dot} />
                                                                <View style={styles.dot} />
                                                                <View style={styles.dot} />
                                                            </View>
                                                        </TouchableOpacity>
                                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                                            More{"\n"}options
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{section.title}</Text>
                                        <View style={styles.optionRow}>
                                            {section.options.map((opt) => {
                                                const IconComponent = opt.icon?.default || opt.icon;
                                                const isActive = selections[section.key] === opt.value;
                                                return (
                                                    <View key={opt.value} style={{ width: '48%', marginBottom: 15 }}>
                                                        <TouchableOpacity
                                                            style={[styles.styleOption, isActive && styles.activeStyleOption]}
                                                            onPress={() => {
                                                                if (section.key === 'coatLapel' && isJodhpuriMode) return;
                                                                handleStyleChange(section.key, opt.value);
                                                            }}
                                                        >
                                                            {IconComponent ? <IconComponent size={120} /> : <Text>Icon</Text>}
                                                        </TouchableOpacity>
                                                        <Text style={[styles.optionLabel, { color: isActive ? '#000' : '#555' }]}>{opt.label}</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <Text style={styles.panelContent}>Loading Styles...</Text>
                    )}
                </View>

                {/* --- EMBROIDERY PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Embroidery' ? 1 : 0, zIndex: activePanel === 'Embroidery' ? 10 : 0 }]} pointerEvents={activePanel === 'Embroidery' ? 'auto' : 'none'}>
                    {embroideryCollections ? (
                        <>
                            <View style={[styles.fabricSwitcher, { marginTop: 4 }]}>
                                {['Kurta', 'Sadri'].map((tab) => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.fabricSwitcherTab, embroideryPanelTab === tab && styles.fabricSwitcherTabActive]}
                                        onPress={() => setEmbroideryPanelTab(tab)}
                                    >
                                        <Text style={[styles.fabricSwitcherText, embroideryPanelTab === tab && { color: '#fff' }]}>{tab}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <ScrollView {...PANEL_SCROLL_PROPS} style={{ flex: 1 }} contentContainerStyle={styles.gridContainer}>
                                {(embroideryPanelTab === 'Sadri' ? embroideryListSadriTarget : embroideryListKurtaTarget).map((embroidery) => {
                                    const profileThumb = embroideryPanelTab === 'Sadri'
                                        ? (embroidery.profileImageSadri || embroidery.profileImage)
                                        : embroidery.profileImage;
                                    const isActive = embroideryPanelTab === 'Kurta'
                                        ? selections.embroideryID === embroidery.id
                                        : selections.sadriEmbroideryID === embroidery.id;
                                    const embPrice = Number(embroidery.price);
                                    const showEmbPrice = Number.isFinite(embPrice) && embPrice > 0;
                                    return (
                                        <View key={embroidery.id} style={[styles.fabricCard, isActive && styles.fabricCardActive]}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEmbroideryPreview({ item: embroidery, panelMode: embroideryPanelTab });
                                                }}
                                                activeOpacity={0.9}
                                            >
                                                {profileThumb ? (
                                                    <Image source={profileThumb} style={styles.fabricImage} resizeMode="cover" />
                                                ) : (
                                                    <View style={[styles.fabricImage, { backgroundColor: '#f0e6d2' }]} />
                                                )}
                                            </TouchableOpacity>
                                            <View style={styles.fabricInfo}>
                                                <TouchableOpacity
                                                    style={styles.fabricInfoTextWrap}
                                                    onPress={() => setEmbroideryPreview({ item: embroidery, panelMode: embroideryPanelTab })}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={styles.fabricName} numberOfLines={2}>{embroidery.name}</Text>
                                                    {showEmbPrice ? (
                                                        <Text style={[styles.fabricBrand, { color: '#27ae60', fontWeight: 'bold' }]}>
                                                            + ₹ {embroidery.price}
                                                        </Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setInfoEmbroidery({ item: embroidery, panelMode: embroideryPanelTab });
                                                    }}
                                                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                                    style={styles.fabricInfoIconBtn}
                                                >
                                                    <MaterialIcons name="info-outline" size={24} color="#475569" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </>
                    ) : (
                        <Text style={styles.panelContent}>Loading Embroidery...</Text>
                    )}
                </View>

                {/* --- DEFAULT PANEL --- */}
                {activePanel !== 'Fabric' && activePanel !== 'Style' && activePanel !== 'Embroidery' && (
                    <View style={[StyleSheet.absoluteFill, { opacity: 1, zIndex: 1 }]} pointerEvents="auto">
                        <Text style={styles.panelContent}>Select a category to customize.</Text>
                    </View>
                )}
            </View>
        );
    };


    const toNumber = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };
    const hasCoat = selectedItems.includes('coat');
    const hasSadri = selectedItems.includes('sadri');
    const hasOuterwear = hasCoat || hasSadri;
    // Website-style total: selected garment collection prices only.
    const kurtaTotal = toNumber(selectedFabric?.price);
    const pajamaTotal = toNumber(selectedPajamaFabric?.price);
    const sadriTotal = hasSadri ? toNumber(selectedSadriFabric?.price) : 0;
    const coatTotal = hasCoat ? toNumber(selectedCoatFabric?.price) : 0;
    const kurtaEmbroideryPrice = selections.embroideryCollection ? toNumber(selections.embroideryCollection?.price) : 0;
    const sadriEmbroideryPrice = hasSadri && selections.sadriEmbroideryCollection
        ? toNumber(selections.sadriEmbroideryCollection?.price)
        : 0;
    const embroideryPrice = kurtaEmbroideryPrice + sadriEmbroideryPrice;
    const totalPrice = kurtaTotal + pajamaTotal + sadriTotal + coatTotal + embroideryPrice;

    const sadriCode = selections.sadriType || 'SR';
    const firstCoatTypeIndex = KURTA_STYLE_OPTIONS.findIndex((section) => section.key === 'coatType');
    const panelBottomOffset = 70;

    const buildSlides = () => {
        const baseProps = { selections, selectedFabric, selectedButton, selectedSadriButton, selectedCoatButton, selectedPajamaFabric, selectedSadriFabric, selectedCoatFabric, hasSadri, sadriCode };

        if (hasOuterwear) {
            return [
                <View key="full" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaModel {...baseProps} hasCoat={hasCoat} slideIndex={0} />
                </View>,
                <View key="inner" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaModel {...baseProps} hasCoat={false} slideIndex={1} />
                </View>,
                <View key="folded" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaFolded
                        {...baseProps}
                        selections={{
                            ...selections,
                        }}
                    />
                </View>,
                <View key="pajama_only" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <PajamaStylePreview {...baseProps} />
                </View>,
                <View key="outerwear_front" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaModel {...baseProps} hasCoat={hasCoat} slideIndex={4} />
                </View>,
                ...(hasCoat ? [
                    <View key="outerwear_back" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                        <KurtaModel {...baseProps} hasCoat={hasCoat} slideIndex={5} />
                    </View>
                ] : []),
            ];
        }

        return [
            <View key="full" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <KurtaModel {...baseProps} hasCoat={hasCoat} slideIndex={0} />
            </View>,
            <View key="folded" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <KurtaFolded {...baseProps} />
            </View>,
            <View key="pajama_only" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <PajamaStylePreview {...baseProps} />
            </View>
        ];
    };

    return (
        <SafeAreaView style={styles.container}>
            <View pointerEvents="none" style={styles.dynamicBgLayer}>
                <BackgroundGradient
                    start={BG_THEMES[activeBgThemeIndex].start}
                    end={BG_THEMES[activeBgThemeIndex].end}
                />
                {incomingBgThemeIndex != null ? (
                    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgFadeAnim }]}>
                        <BackgroundGradient
                            start={BG_THEMES[incomingBgThemeIndex].start}
                            end={BG_THEMES[incomingBgThemeIndex].end}
                        />
                    </Animated.View>
                ) : null}
            </View>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            {/* --- LAYER 1: 3D MODEL ENGINE --- */}
            <View
                ref={shareCaptureRef}
                collapsable={false}
                style={[styles.shareCaptureContainer, isPreparingShareShot && styles.shareCapturePreparing]}
            >
                <View style={styles.modelContainer}>
                    <FullScreenCarousel
                        ref={carouselRef}
                        data={buildSlides()}
                    />
                </View>
                {isPreparingShareShot ? (
                    <View pointerEvents="none" style={styles.shareShotOverlay}>
                        <View style={styles.shareLogoWrap}>
                            <Image source={appLogo} style={styles.shareLogoImg} resizeMode="contain" />
                        </View>
                        <View style={styles.shareBottomLeftWrap}>
                            {shareLinkForShot ? (
                                <View style={styles.shareQrWrap}>
                                    <QRCode value={shareLinkForShot} size={58} backgroundColor="white" color="#14213D" />
                                </View>
                            ) : null}
                            <View style={styles.shareSignatureWrap}>
                                <Text style={styles.shareSignatureText}>Design by Customer</Text>
                                {shareLinkForShot ? (
                                    <Text style={styles.shareSignatureLink} numberOfLines={2}>
                                        {shareLinkForShot}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                ) : null}
            </View>

            <View style={styles.rightMenu}>
                <Animated.View
                    pointerEvents={extrasTrayOpen ? 'none' : 'auto'}
                    style={{
                        opacity: extrasTrayAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                        }),
                        transform: [
                            {
                                scale: extrasTrayAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 0.72],
                                }),
                            },
                        ],
                    }}
                >
                    {[IconFabric, IconStyle, IconEmbroidery].map((IconComponent, index) => {
                        const isActive = activePanel === IconComponent.displayName;
                        return (
                            <TouchableOpacity key={index} style={[styles.iconButton, isActive && styles.iconButtonActive]} onPress={() => togglePanel(IconComponent.displayName)}>
                                <IconComponent size={28} color={isActive ? '#fff' : '#14213D'} />
                                <Text style={[styles.iconText, isActive && { color: '#fff' }, { marginTop: 4 }]}>
                                    {IconComponent.displayName === 'Embroidery' ? 'EMB' : IconComponent.displayName.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </Animated.View>

                <Animated.View
                    pointerEvents={extrasTrayOpen ? 'auto' : 'none'}
                    style={[
                        styles.extrasTrayFloating,
                        {
                            opacity: extrasTrayAnim,
                        },
                    ]}
                >
                    {EXTRAS_TRAY_ITEMS.map(({ id, Icon, label }) => (
                        <Animated.View
                            key={id}
                            style={{
                                opacity: extrasTrayAnim.interpolate({
                                    inputRange: [0, 0.4, 1],
                                    outputRange: [0, 0.2, 1],
                                }),
                                transform: [
                                    {
                                        translateY: extrasTrayAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [16 * (id + 1), 0],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <TouchableOpacity
                                style={styles.extrasTraySlot}
                                activeOpacity={0.85}
                                onPress={() => {
                                    if (id === 0) {
                                        setSummaryTab(fabricTab || 'Kurta');
                                        setSummaryOpen(true);
                                        animateExtrasTray(false);
                                        return;
                                    }
                                    if (id === 2) {
                                        handleSharePreset();
                                        animateExtrasTray(false);
                                        return;
                                    }
                                }}
                            >
                                <Icon width={40} height={40} />
                                <Text style={styles.extrasTraySlotLabel}>{label}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </Animated.View>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={toggleExtrasTray}
                >
                    <IconExtras size={28} color="#14213D" />
                    <Text style={[styles.iconText, { marginTop: 4 }]}>{extrasTrayOpen ? 'HIDE' : 'EXTRAS'}</Text>
                </TouchableOpacity>
            </View>

            {isPanelOpen && (
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => {
                        if (isPanelOpen) closePanel();
                    }}
                >
                    <View style={styles.overlayDim} />
                </TouchableOpacity>
            )}

            <Animated.View style={[styles.sidePanel, { width: panelWidth, bottom: panelBottomOffset + insets.bottom, transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Select {activePanel}</Text>
                    <TouchableOpacity onPress={closePanel}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.panelContentArea}>{renderPanelContent()}</View>
            </Animated.View>

            {isButtonModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <View style={styles.buttonModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Select Button</Text>
                            <TouchableOpacity onPress={() => setButtonModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonModalTabs}>
                            {['Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.buttonTab, buttonModalTab === tab && styles.buttonTabActive]}
                                    onPress={() => setButtonModalTab(tab)}
                                >
                                    <Text style={[styles.buttonTabText, buttonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <ScrollView {...PANEL_SCROLL_PROPS} style={styles.buttonList}>
                            {buttons
                                .filter(buttonTargetsKurta)
                                .filter(b => b.material === buttonModalTab)
                                .sort((a, b) => {
                                    if (a.material === 'Fabric' && b.material === 'Fabric') {
                                        if (buttonLinkedToFabric(a, selectedFabric)) return -1;
                                        if (buttonLinkedToFabric(b, selectedFabric)) return 1;
                                    }
                                    return 0;
                                })
                                .map(btn => {
                                    const isRecommended = btn.material === 'Fabric' && buttonLinkedToFabric(btn, selectedFabric);
                                    const isSelected = selectedButton?.id === btn.id;
                                    return (
                                        <TouchableOpacity
                                            key={btn.id}
                                            style={[styles.buttonItem, isSelected && styles.buttonItemActive]}
                                            onPress={() => { setSelectedButton(btn); setButtonModalOpen(false); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.buttonItemName}>{btn.name}</Text>
                                                {isRecommended && <Text style={styles.recommendedBadge}>RECOMMENDED</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </View>
            )}

            {isSadriButtonModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <View style={styles.buttonModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Select Sadri Button</Text>
                            <TouchableOpacity onPress={() => setSadriButtonModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonModalTabs}>
                            {['Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.buttonTab, sadriButtonModalTab === tab && styles.buttonTabActive]}
                                    onPress={() => setSadriButtonModalTab(tab)}
                                >
                                    <Text style={[styles.buttonTabText, sadriButtonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <ScrollView {...PANEL_SCROLL_PROPS} style={styles.buttonList}>
                            {sadriButtonsMerged
                                .filter(b => b.material === sadriButtonModalTab)
                                .sort((a, b) => {
                                    if (a.material === 'Fabric' && b.material === 'Fabric') {
                                        if (buttonLinkedToFabric(a, selectedSadriFabric)) return -1;
                                        if (buttonLinkedToFabric(b, selectedSadriFabric)) return 1;
                                    }
                                    return 0;
                                })
                                .map(btn => {
                                    const isRecommended = btn.material === 'Fabric' && buttonLinkedToFabric(btn, selectedSadriFabric);
                                    const isSelected = selectedSadriButton?.id === btn.id;
                                    return (
                                        <TouchableOpacity
                                            key={btn.id}
                                            style={[styles.buttonItem, isSelected && styles.buttonItemActive]}
                                            onPress={() => { setSelectedSadriButton(btn); setSadriButtonModalOpen(false); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.buttonItemName}>{btn.name}</Text>
                                                {isRecommended && <Text style={styles.recommendedBadge}>RECOMMENDED</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </View>
            )}

            {isCoatButtonModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <View style={styles.buttonModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Select Coat Button</Text>
                            <TouchableOpacity onPress={() => setCoatButtonModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonModalTabs}>
                            {['Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.buttonTab, coatButtonModalTab === tab && styles.buttonTabActive]}
                                    onPress={() => setCoatButtonModalTab(tab)}
                                >
                                    <Text style={[styles.buttonTabText, coatButtonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <ScrollView {...PANEL_SCROLL_PROPS} style={styles.buttonList}>
                            {coatButtonsMerged
                                .filter(b => b.material === coatButtonModalTab)
                                .sort((a, b) => {
                                    if (a.material === 'Fabric' && b.material === 'Fabric') {
                                        if (buttonLinkedToFabric(a, selectedCoatFabric)) return -1;
                                        if (buttonLinkedToFabric(b, selectedCoatFabric)) return 1;
                                    }
                                    return 0;
                                })
                                .map(btn => {
                                    const isRecommended = btn.material === 'Fabric' && buttonLinkedToFabric(btn, selectedCoatFabric);
                                    const isSelected = selectedCoatButton?.id === btn.id;
                                    return (
                                        <TouchableOpacity
                                            key={btn.id}
                                            style={[styles.buttonItem, isSelected && styles.buttonItemActive]}
                                            onPress={() => { setSelectedCoatButton(btn); setCoatButtonModalOpen(false); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.buttonItemName}>{btn.name}</Text>
                                                {isRecommended && <Text style={styles.recommendedBadge}>RECOMMENDED</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </View>
            )}

            {infoFabric && (
                <View style={styles.buttonModalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setInfoFabric(null)} />
                    <View style={styles.infoModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Fabric Info</Text>
                            <TouchableOpacity onPress={() => setInfoFabric(null)}>
                                <Text style={styles.closeBtn}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
                            <View style={styles.infoTitleBlock}>
                                <View style={styles.infoBrandBanner}>
                                    {(() => {
                                        const logoSource = infoBrandLogoFailed ? null : getBrandLogoSource(infoFabric);
                                        if (logoSource && isSvgLogoSource(logoSource)) {
                                            return (
                                                <View style={styles.infoBrandLogo}>
                                                    <SvgCssUri
                                                        uri={logoSource.uri}
                                                        width="100%"
                                                        height="100%"
                                                        onError={() => setInfoBrandLogoFailed(true)}
                                                    />
                                                </View>
                                            );
                                        }
                                        if (logoSource) {
                                            return (
                                                <Image
                                                    source={logoSource}
                                                    style={styles.infoBrandLogo}
                                                    resizeMode="contain"
                                                    onError={() => setInfoBrandLogoFailed(true)}
                                                />
                                            );
                                        }
                                        return (
                                            <View style={styles.infoBrandLogoFallback}>
                                                <Text style={styles.infoBrandLogoFallbackText} numberOfLines={1}>
                                                    {(infoFabric.brand || 'Brand').toUpperCase()}
                                                </Text>
                                            </View>
                                        );
                                    })()}
                                    <View style={styles.infoBrandNameWrap}>
                                        <View
                                            style={styles.infoBrandNameViewport}
                                            onLayout={(e) => setBrandNameWrapWidth(e.nativeEvent.layout.width)}
                                        >
                                            <Animated.Text
                                                style={[styles.infoBrandName, { transform: [{ translateX: brandNameTranslateX }] }]}
                                                numberOfLines={1}
                                                onLayout={(e) => setBrandNameTextWidth(e.nativeEvent.layout.width)}
                                            >
                                                {infoFabric.name || 'Unnamed Fabric'}
                                            </Animated.Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {(() => {
                                const images = getInfoImages(infoFabric);
                                if (!images.length) return null;
                                const idx = Math.min(infoImageIndex, images.length - 1);
                                return (
                                    <View style={styles.infoImageWrap}>
                                        <TouchableOpacity
                                            activeOpacity={0.95}
                                            onPress={() => {
                                                setFabricViewerImages(images);
                                                setFabricViewerIndex(idx);
                                                setIsFabricViewerOpen(true);
                                            }}
                                        >
                                            <Image source={images[idx]} style={styles.infoImage} resizeMode="cover" />
                                        </TouchableOpacity>
                                        {images.length > 1 ? (
                                            <View style={styles.infoImageControls}>
                                                <TouchableOpacity
                                                    style={styles.infoImageNav}
                                                    onPress={() => setInfoImageIndex((p) => (p - 1 + images.length) % images.length)}
                                                >
                                                    <Text style={styles.infoImageNavText}>‹</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.infoImageCounter}>{idx + 1}/{images.length}</Text>
                                                <TouchableOpacity
                                                    style={styles.infoImageNav}
                                                    onPress={() => setInfoImageIndex((p) => (p + 1) % images.length)}
                                                >
                                                    <Text style={styles.infoImageNavText}>›</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            })()}
                            <View style={styles.infoDetailsCard}>
                                {renderInfoDetailRow('description', 'Description', infoFabric.description || infoFabric.des || '-', { multiline: true })}
                                {renderInfoDetailRow(
                                    'palette',
                                    'Color',
                                    Array.isArray(infoFabric.colors) && infoFabric.colors.length
                                        ? infoFabric.colors.join(', ')
                                        : (infoFabric.color || '-')
                                )}
                                {renderInfoDetailRow('science', 'Composition', infoFabric.composition || '-', { multiline: true })}
                                {renderInfoDetailRow('texture', 'Weave', infoFabric.weave || '-')}
                                {renderInfoDetailRow('grid_view', 'Pattern', infoFabric.pattern || '-')}
                                {renderInfoDetailRow('straighten', 'Width', infoFabric.width || '-')}
                            </View>
                            {typeof infoFabric.link === 'string' && infoFabric.link.length > 0 ? (
                                <TouchableOpacity
                                    style={styles.infoLinkBtn}
                                    onPress={async () => {
                                        const url = infoFabric.link;
                                        if (await Linking.canOpenURL(url)) {
                                            Linking.openURL(url);
                                        }
                                    }}
                                >
                                    <Text style={styles.infoLinkText}>Open Link</Text>
                                </TouchableOpacity>
                            ) : null}
                        </ScrollView>
                    </View>
                </View>
            )}

            {infoEmbroidery?.item && (
                <View style={styles.buttonModalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setInfoEmbroidery(null)} />
                    <View style={styles.infoModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Embroidery Info</Text>
                            <TouchableOpacity onPress={() => setInfoEmbroidery(null)}>
                                <Text style={styles.closeBtn}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            style={[styles.infoScroll, styles.embInfoScroll]}
                            contentContainerStyle={styles.infoContent}
                        >
                            {(() => {
                                const emb = infoEmbroidery.item;
                                const slides = buildEmbroideryProfileCarouselSources(emb);
                                const idx = slides.length
                                    ? Math.min(embInfoImageIndex, slides.length - 1)
                                    : 0;
                                const hero = slides.length ? slides[idx] : null;
                                const desc =
                                    typeof emb.description === 'string' && emb.description.trim().length > 0
                                        ? emb.description.trim()
                                        : '—';
                                return (
                                    <>
                                        <View style={styles.embInfoCarouselOuter}>
                                            <View style={styles.embInfoHeroWrap}>
                                                {hero ? (
                                                    <Image
                                                        source={hero}
                                                        style={styles.embInfoHeroImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View
                                                        style={[
                                                            styles.embInfoHeroImage,
                                                            { backgroundColor: '#f0e6d2' },
                                                        ]}
                                                    />
                                                )}
                                                {slides.length > 1 ? (
                                                    <>
                                                        <TouchableOpacity
                                                            style={[styles.embInfoNavArrow, styles.embInfoNavArrowLeft]}
                                                            accessibilityRole="button"
                                                            accessibilityLabel="Previous image"
                                                            hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
                                                            onPress={() =>
                                                                setEmbInfoImageIndex(
                                                                    (p) => (p - 1 + slides.length) % slides.length
                                                                )
                                                            }
                                                        >
                                                            <MaterialIcons name="chevron-left" size={30} color="#0f172a" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.embInfoNavArrow, styles.embInfoNavArrowRight]}
                                                            accessibilityRole="button"
                                                            accessibilityLabel="Next image"
                                                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
                                                            onPress={() =>
                                                                setEmbInfoImageIndex((p) => (p + 1) % slides.length)
                                                            }
                                                        >
                                                            <MaterialIcons name="chevron-right" size={30} color="#0f172a" />
                                                        </TouchableOpacity>
                                                        <View style={styles.embInfoSlideCounter} pointerEvents="none">
                                                            <View style={styles.embInfoSlideCounterPill}>
                                                                <Text style={styles.embInfoSlideCounterText}>
                                                                    {idx + 1}/{slides.length}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </>
                                                ) : null}
                                            </View>
                                        </View>
                                        <Text style={styles.embInfoTitle}>{emb.name || 'Embroidery'}</Text>
                                        <Text style={styles.embInfoDesc}>{desc}</Text>
                                    </>
                                );
                            })()}
                        </ScrollView>
                    </View>
                </View>
            )}

            <EmbroideryPreviewModal
                visible={!!embroideryPreview}
                onClose={() => setEmbroideryPreview(null)}
                embroidery={embroideryPreview?.item}
                panelMode={embroideryPreview?.panelMode || 'Kurta'}
                selectedCollectionId={
                    embroideryPreview?.panelMode === 'Sadri'
                        ? selections.sadriEmbroideryCollection?.id
                        : selections.embroideryCollection?.id
                }
                onApply={(collection, embroidery, panelMode) => {
                    if (!collection || !embroidery?.id) return;
                    if (panelMode === 'Sadri') {
                        setSelections((prev) => ({
                            ...prev,
                            sadriEmbroideryID: embroidery.id,
                            sadriEmbroideryCollection: collection,
                        }));
                    } else {
                        setSelections((prev) => ({
                            ...prev,
                            embroideryID: embroidery.id,
                            embroideryCollection: collection,
                        }));
                    }
                }}
            />

            {isSummaryOpen && (
                <View style={styles.buttonModalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSummaryOpen(false)} />
                    <View style={styles.summaryModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Summary</Text>
                            <TouchableOpacity onPress={() => setSummaryOpen(false)}>
                                <Text style={styles.closeBtn}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.summaryTabsRow}>
                            {summaryTabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.summaryTabBtn, summaryTab === tab && styles.summaryTabBtnActive]}
                                    onPress={() => setSummaryTab(tab)}
                                >
                                    <Text style={[styles.summaryTabText, summaryTab === tab && styles.summaryTabTextActive]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
                            <Text style={styles.summarySectionTitle}>Fabric Details</Text>
                            <View style={styles.infoBrandBanner}>
                                {(() => {
                                    const fabric = getSummaryFabricForTab(summaryTab);
                                    const logoSource = getBrandLogoSource(fabric);
                                    if (logoSource && isSvgLogoSource(logoSource)) {
                                        return (
                                            <View style={styles.infoBrandLogo}>
                                                <SvgCssUri uri={logoSource.uri} width="100%" height="100%" />
                                            </View>
                                        );
                                    }
                                    if (logoSource) {
                                        return <Image source={logoSource} style={styles.infoBrandLogo} resizeMode="contain" />;
                                    }
                                    return (
                                        <View style={styles.infoBrandLogoFallback}>
                                            <Text style={styles.infoBrandLogoFallbackText} numberOfLines={1}>
                                                {(getSummaryFabricForTab(summaryTab)?.brand || 'Brand').toUpperCase()}
                                            </Text>
                                        </View>
                                    );
                                })()}
                                <View style={styles.infoBrandNameWrap}>
                                    <View style={styles.infoBrandNameViewport}>
                                        <Text style={styles.infoBrandName} numberOfLines={1}>
                                            {getSummaryFabricForTab(summaryTab)?.name || '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.summaryDivider} />
                            <Text style={styles.summarySectionTitle}>Style Details</Text>

                            <View style={styles.summaryStyleGrid}>
                                {getSummaryStyleItems(summaryTab).map((item) => (
                                    <View key={item.key} style={styles.summaryStyleItem}>
                                        {item.Icon ? <item.Icon width={58} height={58} /> : <View style={styles.summaryStyleIconFallback} />}
                                        <Text style={styles.summaryStyleLabel}>{item.title}</Text>
                                        <Text style={styles.summaryStyleValue}>{item.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {summaryTab !== 'Pajama' ? (
                                <View style={styles.summaryMetaCard}>
                                    <Text style={styles.summaryMetaRow}>
                                        Button: {summaryTab === 'Sadri'
                                            ? (selectedSadriButton?.name || 'None')
                                            : summaryTab === 'Coat'
                                                ? (selectedCoatButton?.name || 'None')
                                                : (selectedButton?.name || 'None')}
                                    </Text>
                                    <Text style={styles.summaryMetaRow}>
                                        Embroidery: {summaryTab === 'Sadri'
                                            ? (selections.sadriEmbroideryCollection?.name || 'None')
                                            : (selections.embroideryCollection?.name || 'None')}
                                    </Text>
                                </View>
                            ) : null}
                        </ScrollView>
                    </View>
                </View>
            )}

            <Modal
                visible={isFabricViewerOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsFabricViewerOpen(false)}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.viewerOverlay}>
                        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsFabricViewerOpen(false)} />
                        <View style={styles.viewerTopBar}>
                            <Text style={styles.viewerCounter}>
                                {fabricViewerImages.length ? `${fabricViewerIndex + 1}/${fabricViewerImages.length}` : '0/0'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsFabricViewerOpen(false)}>
                                <Text style={styles.viewerClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.viewerBody}>
                            {fabricViewerImages.length > 1 ? (
                                <TouchableOpacity
                                    style={[styles.viewerSideArrow, styles.viewerLeftArrow]}
                                    onPress={() => setFabricViewerIndex((p) => (p - 1 + fabricViewerImages.length) % fabricViewerImages.length)}
                                >
                                    <Text style={styles.viewerArrowText}>‹</Text>
                                </TouchableOpacity>
                            ) : null}

                            <View style={styles.viewerImageScroll}>
                                <View style={styles.viewerImageScrollContent}>
                                    {fabricViewerImages[fabricViewerIndex] ? (
                                        <ZoomableImage
                                            source={fabricViewerImages[fabricViewerIndex]}
                                            imageKey={`${fabricViewerIndex}`}
                                        />
                                    ) : null}
                                </View>
                            </View>

                            {fabricViewerImages.length > 1 ? (
                                <TouchableOpacity
                                    style={[styles.viewerSideArrow, styles.viewerRightArrow]}
                                    onPress={() => setFabricViewerIndex((p) => (p + 1) % fabricViewerImages.length)}
                                >
                                    <Text style={styles.viewerArrowText}>›</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </GestureHandlerRootView>
            </Modal>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <View style={styles.bottomBarTint} />
                <View style={styles.bottomBarContent}>
                    <View style={styles.priceBlock}>
                        <Text style={styles.productName} numberOfLines={1}>Custom kurta set</Text>
                        <Text style={styles.price} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                            ₹ {totalPrice.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.estDelivery} numberOfLines={2}>
                            {estimatedDeliveryLabel}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.checkoutBtn, isTabletViewport && styles.checkoutBtnTablet]}
                        activeOpacity={0.88}
                        onPress={() => alert('Measurements Screen!')}
                    >
                        <Text style={styles.checkoutText}>Lets Dress Up</Text>
                        <Text style={styles.checkoutChevron}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CustomTheme.backgroundSecondary },
    shareCaptureContainer: {
        flex: 1,
        position: 'relative',
    },
    shareCapturePreparing: {
        backgroundColor: '#8e9493',
    },
    dynamicBgLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    modelContainer: { flex: 1, zIndex: 1, position: 'relative', marginTop: -60 },
    shareShotOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
        justifyContent: 'space-between',
        paddingTop: 18,
        paddingHorizontal: 14,
        paddingBottom: 26,
    },
    shareLogoWrap: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    shareLogoImg: {
        width: 34,
        height: 34,
    },
    shareSignatureWrap: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(20,33,61,0.78)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    shareBottomLeftWrap: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
        gap: 6,
    },
    shareQrWrap: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 8,
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.12)',
    },
    shareSignatureText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    shareSignatureLink: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 9,
        marginTop: 4,
        maxWidth: 190,
    },
    previewLabel: { position: 'absolute', top: 12, left: 12, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: CustomTheme.accentGold },
    previewLabelText: { color: CustomTheme.accentGold, fontSize: 12, fontWeight: '700' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
    backButton: { padding: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 25, shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    backText: { fontSize: 18, fontWeight: 'bold', color: CustomTheme.textBrand, zIndex: 2 },
    brandText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: CustomTheme.textBrand },
    rightMenu: { position: 'absolute', right: 20, top: '25%', zIndex: 100, alignItems: 'center' },
    iconButton: { width: 60, height: 60, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, overflow: 'hidden' },
    iconButtonActive: { backgroundColor: 'rgba(252, 157, 3, 0.3)', borderColor: CustomTheme.accentGold, shadowColor: CustomTheme.accentGold, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
    iconText: { fontSize: 11, color: CustomTheme.textBrand, fontWeight: 'bold', textAlign: 'center', zIndex: 2 },
    extrasTray: { alignItems: 'center' },
    extrasTrayFloating: {
        position: 'absolute',
        bottom: 76,
        alignItems: 'center',
        zIndex: 2,
    },
    extrasTraySlot: {
        width: 64,
        height: 64,
        marginBottom: 10,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: CustomTheme.shadowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    extrasTraySlotLabel: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: '700',
        color: CustomTheme.textBrand,
        textAlign: 'center',
    },
    extrasTrayAnchor: { marginTop: 2 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', zIndex: 20 },
    overlayDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
    sidePanel: { position: 'absolute', left: 0, top: 0, bottom: 84, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: '#e5e7eb', zIndex: 5000, elevation: 5000, paddingTop: 18, shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15, borderTopRightRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden' },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 10, marginTop: -10 },
    panelTitle: { fontSize: 20, fontWeight: 'bold', color: CustomTheme.textBrand },
    closeBtn: { fontSize: 24, color: CustomTheme.accentGold, padding: 10 },
    panelContentArea: { flex: 1 },
    panelContent: { fontSize: 16, color: '#666', paddingHorizontal: 20 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'center', paddingBottom: 20 },
    fabricCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 7, elevation: 4 },
    fabricCardActive: { borderColor: CustomTheme.accentGold, backgroundColor: '#fffdf8', shadowColor: CustomTheme.accentGold, shadowOpacity: 0.35, shadowRadius: 10, elevation: 9 },
    fabricImage: { width: '100%', height: 112, backgroundColor: '#f8fafc' },
    fabricInfo: { paddingHorizontal: 10, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 58 },
    fabricInfoTextWrap: { flex: 1, minWidth: 0, paddingRight: 8, justifyContent: 'center' },
    fabricInfoIconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
    fabricName: { fontSize: 13, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },
    fabricBrand: { fontSize: 11, color: '#7c6a3a', marginTop: 3, fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: CustomTheme.textBrand },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    styleOption: { width: '100%', aspectRatio: .8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
    activeStyleOption: { backgroundColor: 'rgba(252, 157, 3, 0.15)', borderColor: CustomTheme.accentGold },
    optionLabel: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 8 },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        minHeight: 92,
        paddingTop: 14,
        paddingHorizontal: 16,
        zIndex: 10000,
        overflow: 'hidden',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(15, 23, 42, 0.08)',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 10000,
    },
    bottomBarTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 253, 250, 1)',
    },
    bottomBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        zIndex: 2,
        gap: 12,
    },
    priceBlock: {
        flex: 1,
        minWidth: 0,
        marginRight: 4,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 11,
        color: '#666',
        marginBottom: 3,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 22,
        fontWeight: '800',
        color: '#14213D',
        letterSpacing: -0.5,
    },
    estDelivery: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
        fontWeight: '500',
        letterSpacing: 0.2,
        lineHeight: 13,
    },
    checkoutBtn: {
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CustomTheme.accentGold, // Orange button
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: CustomTheme.accentGold,
        shadowColor: CustomTheme.accentGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        maxWidth: 148,
    },
    checkoutBtnTablet: {
        maxWidth: 220,
        paddingHorizontal: 60
    },
    checkoutText: { color: CustomTheme.textPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
    checkoutChevron: { color: CustomTheme.textPrimary, fontSize: 18, fontWeight: '800', marginLeft: 2, marginTop: -1 },

    // Fabric Tab Switcher
    fabricSwitcher: { flexDirection: 'row', marginHorizontal: 15, marginTop: 10, marginBottom: 8, backgroundColor: '#ffffff', borderRadius: 25, padding: 3, borderWidth: 1, borderColor: '#e5e7eb' },
    fabricSwitcherTab: { flex: 1, paddingVertical: 7, borderRadius: 22, alignItems: 'center' },
    fabricSwitcherTabActive: { backgroundColor: CustomTheme.accentGold },
    fabricSwitcherText: { fontSize: 13, fontWeight: 'bold', color: CustomTheme.textBrand },

    // Button UI Styles
    buttonBanner: { backgroundColor: CustomTheme.accentGold, paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 15, marginHorizontal: 5 },
    buttonBannerText: { color: CustomTheme.textPrimary, fontSize: 14, fontWeight: 'bold' },
    buttonIconWrapper: { width: '100%', height: 60, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#666', marginHorizontal: 3 },
    buttonModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: CustomTheme.overlayLight, zIndex: 9999, elevation: 9999, justifyContent: 'center', alignItems: 'center' },
    buttonModalContainer: { width: '85%', maxHeight: '70%', backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
    buttonModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    buttonModalTitle: { fontSize: 18, fontWeight: 'bold', color: CustomTheme.textBrand },
    buttonModalTabs: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#ffffff', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e5e7eb' },
    buttonTab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
    buttonTabActive: { backgroundColor: CustomTheme.accentGold },
    buttonTabText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    buttonList: { padding: 20 },
    buttonItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
    buttonItemActive: { borderColor: CustomTheme.accentGold, backgroundColor: 'rgba(252, 157, 3, 0.1)' },
    buttonItemIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc', marginRight: 15 },
    buttonItemName: { fontSize: 14, fontWeight: 'bold', color: CustomTheme.textBrand },
    recommendedBadge: { fontSize: 9, color: CustomTheme.accentGold, fontWeight: 'bold', marginTop: 2 },
    infoModalContainer: {
        width: '88%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dbe3ee',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    infoScroll: {
        maxHeight: 460,
    },
    embInfoScroll: {
        maxHeight: 580,
    },
    embInfoCarouselOuter: {
        marginBottom: 16,
    },
    embInfoHeroWrap: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f1f5f9',
    },
    embInfoNavArrow: {
        position: 'absolute',
        top: '50%',
        marginTop: -24,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.96)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 8,
    },
    embInfoNavArrowLeft: {
        left: 10,
        paddingRight: 2,
    },
    embInfoNavArrowRight: {
        right: 10,
        paddingLeft: 2,
    },
    embInfoSlideCounter: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    embInfoSlideCounterPill: {
        backgroundColor: 'rgba(15,23,42,0.72)',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 14,
    },
    embInfoSlideCounterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    embInfoHeroImage: {
        width: '100%',
        aspectRatio: 4 / 5,
        backgroundColor: '#f1f5f9',
    },
    embInfoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    embInfoDesc: {
        fontSize: 15,
        lineHeight: 22,
        color: '#475569',
    },
    infoContent: {
        padding: 16,
        paddingBottom: 20,
    },
    infoTitleBlock: {
        marginBottom: 12,
    },
    infoBrandBanner: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        height: 36,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    infoBrandLogo: {
        width: 132,
        height: '100%',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    infoBrandLogoFallback: {
        width: 132,
        height: '100%',
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    infoBrandLogoFallbackText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    infoBrandNameWrap: {
        width: 147,
        backgroundColor: '#e5e5e5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        height: '100%',
    },
    infoBrandNameViewport: {
        width: '100%',
        overflow: 'hidden',
    },
    infoBrandName: {
        fontSize: 12,
        fontWeight: '800',
        color: 'black',
        alignSelf: 'flex-end',
        textAlign: 'center',
    },
    infoSubTitle: {
        marginTop: 8,
        fontSize: 12,
        color: '#64748b',
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    infoImage: {
        width: '100%',
        height: 168,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    infoImageWrap: {
        marginBottom: 14,
    },
    infoImageControls: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    infoImageNav: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoImageNavText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#334155',
        marginTop: -2,
    },
    infoImageCounter: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        minWidth: 48,
        textAlign: 'center',
    },
    infoDetailsCard: {
        marginTop: 2,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    infoRowMultiline: {
        alignItems: 'flex-start',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 6,
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '44%',
        minWidth: 116,
        paddingRight: 10,
    },
    infoRowLeftMultiline: {
        width: '100%',
        minWidth: 0,
        paddingRight: 0,
    },
    infoIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    infoLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    infoValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 12,
        color: '#14213D',
        fontWeight: '600',
        lineHeight: 17,
    },
    infoValueMultiline: {
        width: '100%',
        textAlign: 'left',
        flex: 0,
        fontSize: 13,
        lineHeight: 20,
    },
    infoLinkBtn: {
        marginTop: 14,
        alignSelf: 'center',
        backgroundColor: CustomTheme.accentGold,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    infoLinkText: {
        color: '#14213D',
        fontWeight: '800',
        fontSize: 12,
    },
    summaryModalContainer: {
        width: '92%',
        maxHeight: '82%',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#dbe3ee',
    },
    summaryTabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 14,
        paddingTop: 6,
        gap: 10,
    },
    summaryTabBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    summaryTabBtnActive: {
        borderBottomColor: '#14213D',
    },
    summaryTabText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    summaryTabTextActive: {
        color: '#14213D',
        fontWeight: '800',
    },
    summarySectionTitle: {
        marginTop: 4,
        marginBottom: 10,
        fontSize: 34 / 2,
        fontWeight: '800',
        color: '#1f2937',
        textAlign: 'center',
    },
    summaryDivider: {
        marginTop: 14,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#d1d5db',
    },
    summaryStyleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 14,
    },
    summaryStyleItem: {
        width: '31%',
        alignItems: 'center',
    },
    summaryStyleIconFallback: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: '#eef2f7',
    },
    summaryStyleLabel: {
        marginTop: 5,
        fontSize: 11,
        color: '#374151',
        textAlign: 'center',
        fontWeight: '700',
    },
    summaryStyleValue: {
        marginTop: 2,
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
    },
    summaryMetaCard: {
        marginTop: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryMetaRow: {
        fontSize: 12,
        color: '#1f2937',
        fontWeight: '600',
        marginBottom: 6,
    },
    viewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
    },
    viewerTopBar: {
        position: 'absolute',
        top: 42,
        left: 12,
        right: 12,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewerCounter: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    viewerClose: {
        color: '#fff',
        fontSize: 34,
        lineHeight: 34,
        fontWeight: '600',
    },
    viewerBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewerImageScroll: {
        flex: 1,
    },
    viewerImageScrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerImage: {
        width: '100%',
        height: '78%',
    },
    viewerSideArrow: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        zIndex: 9,
    },
    viewerLeftArrow: {
        left: 12,
    },
    viewerRightArrow: {
        right: 12,
    },
    viewerArrowText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        marginTop: -2,
    },
});
