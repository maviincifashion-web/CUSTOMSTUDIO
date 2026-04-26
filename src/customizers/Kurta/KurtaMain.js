import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Easing, ScrollView, Image, Platform, Linking, Modal, Share, InteractionManager, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SvgCssUri } from 'react-native-svg/css';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { DotLottie } from '@lottiefiles/dotlottie-react-native';
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
import { fetchEmbroideryUploadedCollectionsForStyleId, pickFabricRenderEntry } from '../../firebase/catalogApi';
import { KURTA_STYLE_OPTIONS, SKIN_TONE_OPTIONS } from '../../Data/styleData';
import { useOutfit } from '../../context/OutfitContext';
import { useDeepLinkHandler } from '../../hooks/useDeepLinkHandler';
import { useRemoteControl } from '../../context/RemoteControlContext';

// --- YAHAN MODEL COMPONENT IMPORT HUA HAI ---
import KurtaModel from './components/KurtaModel';
import EmbroideryPreviewModal from './components/EmbroideryPreviewModal';
import KurtaFolded from './components/KurtaFolded';
import PajamaStylePreview from './components/PajamaStylePreview';
import FullScreenCarousel from '../../../components/FullScreenCarousel';
import { KurtaStylePanel, PajamaStylePanel, SadriStylePanel, CoatStylePanel } from './components/panels/GarmentStylePanels';

import { IconFabric, IconStyle, IconEmbroidery, IconExtras } from '../../icons/ExtraIcons';

import ExtrasSummary from '../../../assets/images/extra_icons/summary-01.svg';
import ExtrasFavourite from '../../../assets/images/extra_icons/favourite-01.svg';
import ExtrasShare from '../../../assets/images/extra_icons/share-01.svg';
import ExtrasSkinTone from '../../../assets/images/extra_icons/skin tone-01.svg';
import AppLogo from '../../../assets/images/bussiness/only logo-01.svg';

import { useResponsive } from '../../../hooks/useResponsive';
import { CustomTheme } from '../../../constants/theme';
import { hasSadriRightBaseEmbroidery } from './utils/sadriUpperPocket';
import { hasCoatRightBaseEmbroidery } from './utils/coatUpperPocket';

const EXTRAS_TRAY_ITEMS = [
    { id: 0, Icon: ExtrasSummary, label: 'Summary' },
    { id: 1, Icon: ExtrasFavourite, label: 'Favourite' },
    { id: 2, Icon: ExtrasShare, label: 'Share' },
    { id: 3, Icon: ExtrasSkinTone, label: 'Skin Tone' },
];

const PUBLIC_SHARE_BASE_URL = 'https://maviinci.in/s';
const RENDER_LOADING_ANIMATION_URL = 'https://lottie.host/16b69e12-0efb-4061-b33d-12dc2b93fd84/Ax2k12jKRd.lottie';
const SADRI_UPPER_POCKET_BLOCKED_TYPES = new Set(['SS', 'AA', 'CC', 'DD', 'EE', 'N']);
const isSadriUpperPocketBlocked = (sadriType) => SADRI_UPPER_POCKET_BLOCKED_TYPES.has(String(sadriType || '').trim().toUpperCase());

function parseEmbroideryTargetKey(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return { garment: '', part: '', raw: '' };
    if (normalized.includes('/')) {
        const [, garment = '', part = ''] = normalized.split('/');
        return {
            garment,
            part,
            raw: normalized,
        };
    }
    if (normalized.includes('_collections')) {
        return {
            garment: normalized.replace('_collections', ''),
            part: 'collection',
            raw: normalized,
        };
    }
    const pieces = normalized.split('_');
    if (pieces.length >= 3 && pieces[0] === 'kurta') {
        return {
            garment: pieces[1] || '',
            part: pieces.slice(2).join('_') || '',
            raw: normalized,
        };
    }
    if (pieces.length >= 2) {
        return {
            garment: pieces[0] || '',
            part: pieces.slice(1).join('_') || '',
            raw: normalized,
        };
    }
    return { garment: normalized, part: '', raw: normalized };
}

function embroideryUploadMatchesPanel(doc, panelMode) {
    const segmentInfo = parseEmbroideryTargetKey(doc?.segment);
    const typeInfo = parseEmbroideryTargetKey(doc?.type);
    const garment = doc?.garment ? String(doc.garment).trim().toLowerCase() : '';
    const resolvedGarment = garment || typeInfo.garment || segmentInfo.garment;

    if (panelMode === 'Sadri') {
        return resolvedGarment === 'sadri' || segmentInfo.raw === 'sadri_base' || segmentInfo.raw === 'kurta_sadri_base';
    }

    if (panelMode === 'Coat') {
        return resolvedGarment === 'coat' || segmentInfo.part === 'coat';
    }

    if (resolvedGarment === 'kurta' || segmentInfo.raw === 'kurta_base') return true;
    return segmentInfo.raw.endsWith('_collections') && !segmentInfo.raw.includes('sadri') && !segmentInfo.raw.includes('coat');
}

function embroideryValueMatchesPanel(value, panelMode) {
    const targetGarment = String(value?.targetType || '').trim().toLowerCase();
    if (targetGarment) {
        if (panelMode === 'Sadri') return targetGarment === 'sadri';
        if (panelMode === 'Coat') return targetGarment === 'coat';
        return targetGarment === 'kurta';
    }

    const refPath = value?.refPath ? String(value.refPath).trim().toLowerCase() : '';
    if (refPath) {
        const parts = refPath.split('/');
        const garmentFromPath = parts.length >= 4 ? parts[3] : '';
        if (panelMode === 'Sadri') return garmentFromPath === 'sadri';
        if (panelMode === 'Coat') return garmentFromPath === 'coat';
        return garmentFromPath === 'kurta';
    }

    return embroideryUploadMatchesPanel({
        segment: value?.type,
        type: value?.type,
        garment: value?.targetType,
    }, panelMode);
}

function bundleHasPanelUploads(bundle, panelMode) {
    const uploads = bundle?.uploadsByDocId;
    if (!uploads || typeof uploads !== 'object') return false;
    return Object.values(uploads).some((doc) => {
        if (!doc?.isCollection || !embroideryUploadMatchesPanel(doc, panelMode)) return false;
        const values = Array.isArray(doc.values) ? doc.values : [];
        if (values.length === 0) return false;
        return values.some((value) => embroideryValueMatchesPanel(value, panelMode));
    });
}

function buildPublicShareUrlFromSid(sid) {
    const cleanSid = normalizeId(sid);
    if (!cleanSid) return '';
    return `${PUBLIC_SHARE_BASE_URL}/${encodeURIComponent(cleanSid)}`;
}

const BG_THEMES = [
    { start: '#FDFBF7', end: '#F5F1E8' },
    { start: '#F5F1E8', end: '#EBE6D9' },
    { start: '#EBE6D9', end: '#FDFBF7' },
    { start: '#FDFBF7', end: '#FDFBF7' },
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
            // Merge renders: keep local require() assets, fill gaps with Firebase URLs
            const mergedRenders = { ...(b.renders || {}) };
            for (const [code, val] of Object.entries(prev.renders || {})) {
                if (val != null) mergedRenders[code] = val;
            }
            byId.set(b.id, {
                ...prev,
                ...b,
                renders: mergedRenders,
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

/** Slide panel scrollviews: thin visible scrollbar (iOS: black indicator + insets; Android: persistent bar). */
const PANEL_SCROLL_PROPS = {
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 16,
};

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
        if (!src) return null;
        if (typeof src === 'string') {
            const t = src.trim();
            return t ? { uri: t } : null;
        }
        if (typeof src !== 'object') return null;
        const uri = src.uri != null ? String(src.uri).trim() : '';
        return uri ? { uri } : null;
    };
    const slides = [];
    const k = norm(emb.profileImage);
    const s = norm(emb.profileImageSadri);
    if (k) slides.push(k);
    if (s) slides.push(s);
    const seen = new Set(slides.map((x) => x.uri));
    const extras = [
        ...(Array.isArray(emb.profileExtraImages) ? emb.profileExtraImages : []),
        ...(Array.isArray(emb.other_images) ? emb.other_images : []),
        ...(Array.isArray(emb.otherImages) ? emb.otherImages : []),
        ...(emb.otherImage ? [emb.otherImage] : []),
    ];
    for (const ex of extras) {
        const n = norm(ex);
        if (!n || seen.has(n.uri)) continue;
        seen.add(n.uri);
        slides.push(n);
    }
    return slides;
}

export default function KurtaMain({ presetParam, presetIdParam, isTVView = false, initialPanel = 'Fabric', onNavigate }) {
    const {
        fabrics,
        fabricsByGarment,
        buttons,
        kurtaRenders,
        pajamaRenders,
        sadriRenders,
        coatRenders,
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
            const baseList = sub?.length ? sub : fabrics;
            if (!fabricSearchQuery) return baseList;
            const q = fabricSearchQuery.toLowerCase();
            return baseList.filter(f => 
                (f.name && f.name.toLowerCase().includes(q)) || 
                (f.brand && f.brand.toLowerCase().includes(q))
            );
        },
        [fabrics, fabricsByGarment, fabricSearchQuery]
    );
    const { width, isMobile, isDesktop, isTV, normalize } = useResponsive();
    const effectiveTV = isTVView || isTV;
    const isTabletViewport = !isDesktop && !isTV && width >= 768;
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
        bottomCut: 'R', length: 'K', placketStyle: 'NS', pocketQty: '00', pocketShape: 'R', flapYes: '0', flapShape: 'R', epaulette: '0', collar: 'CM', sleeve: 'SN', cuffStyle: 'US1', sadriUpperPocket: '1', coatUpperPocket: '0', embroideryID: null, sadriEmbroideryID: null, coatEmbroideryID: null
    });
    const [selectedButton, setSelectedButton] = useState(INITIAL_SELECTION?.button || (buttons?.[0] ?? null));
    const [selectedSadriButton, setSelectedSadriButton] = useState(DUMMY_SADRI_BUTTONS ? DUMMY_SADRI_BUTTONS[0] : null);
    const [selectedCoatButton, setSelectedCoatButton] = useState(DUMMY_COAT_BUTTONS ? DUMMY_COAT_BUTTONS[0] : null);
    const [isButtonModalOpen, setButtonModalOpen] = useState(false);
    const [isSadriButtonModalOpen, setSadriButtonModalOpen] = useState(false);
    const [isCoatButtonModalOpen, setCoatButtonModalOpen] = useState(false);
    const [isSummaryOpen, setSummaryOpen] = useState(false);
    const [isSkinToneModalOpen, setSkinToneModalOpen] = useState(false);
    const [selectedSkinTone, setSelectedSkinTone] = useState(1);
    const [summaryTab, setSummaryTab] = useState('Kurta');
    const [buttonModalTab, setButtonModalTab] = useState('Recommended');
    const [sadriButtonModalTab, setSadriButtonModalTab] = useState('Recommended');
    const [coatButtonModalTab, setCoatButtonModalTab] = useState('Recommended');
    const [selectedPajamaFabric, setSelectedPajamaFabric] = useState(fabrics?.[0] || {});
    const [selectedSadriFabric, setSelectedSadriFabric] = useState(fabrics?.[0] || {});
    const [selectedCoatFabric, setSelectedCoatFabric] = useState(fabrics?.[0] || {});
    const [renderSelectedFabric, setRenderSelectedFabric] = useState(selectedFabric);
    const [renderSelectedPajamaFabric, setRenderSelectedPajamaFabric] = useState(selectedPajamaFabric);
    const [renderSelectedSadriFabric, setRenderSelectedSadriFabric] = useState(selectedSadriFabric);
    const [renderSelectedCoatFabric, setRenderSelectedCoatFabric] = useState(selectedCoatFabric);
    const [fabricTab, setFabricTab] = useState('Kurta'); // 'Kurta' | 'Pajama' | 'Sadri' | 'Coat'
    const [embroideryPanelTab, setEmbroideryPanelTab] = useState('Kurta'); // 'Kurta' | 'Sadri' | 'Coat'
    const [embroideryPreview, setEmbroideryPreview] = useState(null); // { item, panelMode } | null
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

    const [pendingKurtaBtnId, setPendingKurtaBtnId] = useState(null);
    const [pendingSadriBtnId, setPendingSadriBtnId] = useState(null);
    const [pendingCoatBtnId, setPendingCoatBtnId] = useState(null);

    useEffect(() => {
        if (pendingKurtaBtnId && buttonById) {
            const b = buttonById.get(pendingKurtaBtnId);
            if (b) {
                setSelectedButton(b);
                setPendingKurtaBtnId(null);
            }
        }
    }, [pendingKurtaBtnId, buttonById]);

    useEffect(() => {
        if (pendingSadriBtnId && buttonById) {
            const b = buttonById.get(pendingSadriBtnId);
            if (b) {
                setSelectedSadriButton(b);
                setPendingSadriBtnId(null);
            }
        }
    }, [pendingSadriBtnId, buttonById]);

    useEffect(() => {
        if (pendingCoatBtnId && buttonById) {
            const b = buttonById.get(pendingCoatBtnId);
            if (b) {
                setSelectedCoatButton(b);
                setPendingCoatBtnId(null);
            }
        }
    }, [pendingCoatBtnId, buttonById]);

    useEffect(() => {
        setEmbroideryPreview(null);
        setInfoEmbroidery(null);
    }, [embroideryPanelTab]);

    // --- REMOTE COMMAND LOGIC (Game Controller Model) ---
    const { tvSessionId, sendCommand, subscribeToCommands } = useRemoteControl();
    useDeepLinkHandler();

    // Refs for lookup maps are assigned after fabricsByAnyId/buttonById are defined (see below)
    const fabricsByAnyIdRef = useRef(null);
    const buttonByIdRef = useRef(null);

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
    const stylePanelScrollY = useRef(new Animated.Value(0)).current;
    const [stylePanelContentHeight, setStylePanelContentHeight] = useState(1);
    const [stylePanelVisibleHeight, setStylePanelVisibleHeight] = useState(1);
    const fabricPanelScrollY = useRef(new Animated.Value(0)).current;
    const [fabricPanelContentHeight, setFabricPanelContentHeight] = useState(1);
    const [fabricPanelVisibleHeight, setFabricPanelVisibleHeight] = useState(1);
    const [fabricSearchQuery, setFabricSearchQuery] = useState('');
    const bgFadeAnim = useRef(new Animated.Value(0)).current;
    const bgTransitionTimerRef = useRef(null);
    const bgAnimatingRef = useRef(false);
    const bgPendingThemeRef = useRef(null);
    const styleTransitionTimerRef = useRef(null);
    const [activeBgThemeIndex, setActiveBgThemeIndex] = useState(0);
    const [incomingBgThemeIndex, setIncomingBgThemeIndex] = useState(null);
    const [isPreparingShareShot, setIsPreparingShareShot] = useState(false);
    const [shareLinkForShot, setShareLinkForShot] = useState('');
    const shareCaptureRef = useRef(null);
    const appliedPresetRef = useRef('');
    const [hasInitialHeroRenderLoaded, setHasInitialHeroRenderLoaded] = useState(false);
    const [isInitialSlideSceneReady, setIsInitialSlideSceneReady] = useState(false);
    const [shouldBufferSlideZeroScene, setShouldBufferSlideZeroScene] = useState(false);
    const [isStyleTransitionLoading, setIsStyleTransitionLoading] = useState(false);

    const [remotePresetData, setRemotePresetData] = useState(null);

    const triggerStyleTransitionLoading = useCallback(() => {
        if (styleTransitionTimerRef.current) {
            clearTimeout(styleTransitionTimerRef.current);
        }
        setIsStyleTransitionLoading(true);
        styleTransitionTimerRef.current = setTimeout(() => {
            setIsStyleTransitionLoading(false);
            styleTransitionTimerRef.current = null;
        }, 450);
    }, []);

    useEffect(() => () => {
        if (styleTransitionTimerRef.current) {
            clearTimeout(styleTransitionTimerRef.current);
            styleTransitionTimerRef.current = null;
        }
    }, []);

    const getFabricIdentityKey = useCallback((fabric) => normalizeId(
        fabric?.fabricID || fabric?.id || fabric?.name || '',
    ), []);

    const hasRenderableBundle = useCallback((bundle) => {
        if (!bundle || typeof bundle !== 'object') return false;
        return Object.keys(bundle?.display || {}).length > 0 || Object.keys(bundle?.style || {}).length > 0;
    }, []);

    const coatEmbroiderySelectionKey = useMemo(() => {
        if (!selectedItems.includes('coat')) return '';
        return [
            normalizeId(selections?.coatEmbroideryID),
            normalizeId(selections?.coatEmbroideryCollection?.id || selections?.coatEmbroideryCollection?.name),
        ].join(':');
    }, [selectedItems, selections?.coatEmbroideryID, selections?.coatEmbroideryCollection?.id, selections?.coatEmbroideryCollection?.name]);

    const isSelectedCoatEmbroideryBundleReady = useMemo(() => {
        if (!selectedItems.includes('coat') || !selections?.coatEmbroideryID) return true;
        return bundleHasPanelUploads(embroideryRenders?.[selections.coatEmbroideryID], 'Coat');
    }, [selectedItems, selections?.coatEmbroideryID, embroideryRenders]);

    const firstHeroRenderReady = useMemo(() => {
        const kurtaReady = hasRenderableBundle(pickFabricRenderEntry(kurtaRenders, renderSelectedFabric));
        const pajamaReady = hasRenderableBundle(pickFabricRenderEntry(pajamaRenders, renderSelectedPajamaFabric));
        const sadriReady = !selectedItems.includes('sadri')
            || hasRenderableBundle(pickFabricRenderEntry(sadriRenders, renderSelectedSadriFabric));
        const coatReady = !selectedItems.includes('coat')
            || hasRenderableBundle(pickFabricRenderEntry(coatRenders, renderSelectedCoatFabric));
        const coatEmbroideryReady = !selectedItems.includes('coat')
            || isSelectedCoatEmbroideryBundleReady;

        return kurtaReady && pajamaReady && sadriReady && coatReady && coatEmbroideryReady && isInitialSlideSceneReady;
    }, [
        hasRenderableBundle,
        kurtaRenders,
        pajamaRenders,
        sadriRenders,
        coatRenders,
        isSelectedCoatEmbroideryBundleReady,
        renderSelectedFabric,
        renderSelectedPajamaFabric,
        renderSelectedSadriFabric,
        renderSelectedCoatFabric,
        isInitialSlideSceneReady,
        selectedItems,
    ]);

    const lastBufferedCoatEmbroideryKeyRef = useRef(coatEmbroiderySelectionKey);

    useEffect(() => {
        if (!hasInitialHeroRenderLoaded) {
            lastBufferedCoatEmbroideryKeyRef.current = coatEmbroiderySelectionKey;
            return;
        }

        if (coatEmbroiderySelectionKey === lastBufferedCoatEmbroideryKeyRef.current) {
            return;
        }

        lastBufferedCoatEmbroideryKeyRef.current = coatEmbroiderySelectionKey;
        setIsInitialSlideSceneReady(false);
        setShouldBufferSlideZeroScene(true);
    }, [coatEmbroiderySelectionKey, hasInitialHeroRenderLoaded]);

    useEffect(() => {
        if (!shouldBufferSlideZeroScene) return;
        if (!isSelectedCoatEmbroideryBundleReady || !isInitialSlideSceneReady) return;
        setShouldBufferSlideZeroScene(false);
    }, [shouldBufferSlideZeroScene, isSelectedCoatEmbroideryBundleReady, isInitialSlideSceneReady]);

    useEffect(() => {
        const selectedKey = getFabricIdentityKey(selectedFabric);
        const renderKey = getFabricIdentityKey(renderSelectedFabric);
        if (selectedKey === renderKey) return;
        if (hasRenderableBundle(pickFabricRenderEntry(kurtaRenders, selectedFabric))) {
            setRenderSelectedFabric(selectedFabric);
        }
    }, [selectedFabric, renderSelectedFabric, getFabricIdentityKey, hasRenderableBundle, kurtaRenders]);

    useEffect(() => {
        const selectedKey = getFabricIdentityKey(selectedPajamaFabric);
        const renderKey = getFabricIdentityKey(renderSelectedPajamaFabric);
        if (selectedKey === renderKey) return;
        if (hasRenderableBundle(pickFabricRenderEntry(pajamaRenders, selectedPajamaFabric))) {
            setRenderSelectedPajamaFabric(selectedPajamaFabric);
        }
    }, [selectedPajamaFabric, renderSelectedPajamaFabric, getFabricIdentityKey, hasRenderableBundle, pajamaRenders]);

    useEffect(() => {
        const selectedKey = getFabricIdentityKey(selectedSadriFabric);
        const renderKey = getFabricIdentityKey(renderSelectedSadriFabric);
        if (selectedKey === renderKey) return;
        if (!selectedItems.includes('sadri')) {
            setRenderSelectedSadriFabric(selectedSadriFabric);
            return;
        }
        if (hasRenderableBundle(pickFabricRenderEntry(sadriRenders, selectedSadriFabric))) {
            setRenderSelectedSadriFabric(selectedSadriFabric);
        }
    }, [selectedSadriFabric, renderSelectedSadriFabric, selectedItems, getFabricIdentityKey, hasRenderableBundle, sadriRenders]);

    useEffect(() => {
        const selectedKey = getFabricIdentityKey(selectedCoatFabric);
        const renderKey = getFabricIdentityKey(renderSelectedCoatFabric);
        if (selectedKey === renderKey) return;
        if (!selectedItems.includes('coat')) {
            setRenderSelectedCoatFabric(selectedCoatFabric);
            return;
        }
        if (hasRenderableBundle(pickFabricRenderEntry(coatRenders, selectedCoatFabric))) {
            setRenderSelectedCoatFabric(selectedCoatFabric);
        }
    }, [selectedCoatFabric, renderSelectedCoatFabric, selectedItems, getFabricIdentityKey, hasRenderableBundle, coatRenders]);

    const isFabricTransitionLoading = useMemo(() => {
        if (!hasInitialHeroRenderLoaded) return false;

        const kurtaPending = getFabricIdentityKey(selectedFabric) !== getFabricIdentityKey(renderSelectedFabric);
        const pajamaPending = getFabricIdentityKey(selectedPajamaFabric) !== getFabricIdentityKey(renderSelectedPajamaFabric);
        const sadriPending = selectedItems.includes('sadri')
            && getFabricIdentityKey(selectedSadriFabric) !== getFabricIdentityKey(renderSelectedSadriFabric);
        const coatPending = selectedItems.includes('coat')
            && getFabricIdentityKey(selectedCoatFabric) !== getFabricIdentityKey(renderSelectedCoatFabric);

        return kurtaPending || pajamaPending || sadriPending || coatPending;
    }, [
        hasInitialHeroRenderLoaded,
        selectedFabric,
        selectedPajamaFabric,
        selectedSadriFabric,
        selectedCoatFabric,
        renderSelectedFabric,
        renderSelectedPajamaFabric,
        renderSelectedSadriFabric,
        renderSelectedCoatFabric,
        selectedItems,
        getFabricIdentityKey,
    ]);

    const isSceneTransitionLoading = shouldBufferSlideZeroScene
        && (!isSelectedCoatEmbroideryBundleReady || !isInitialSlideSceneReady);

    const showRenderLoadingOverlay = !isPreparingShareShot
        && (!hasInitialHeroRenderLoaded || isFabricTransitionLoading || isStyleTransitionLoading || isSceneTransitionLoading);

    const renderLoadingLabel = loadError
        ? 'Render load failed'
        : hasInitialHeroRenderLoaded
            ? 'Updating render...'
            : 'Loading render...';

    useEffect(() => {
        if (hasInitialHeroRenderLoaded) return;
        
        let timer;
        if (firstHeroRenderReady) {
            // Wait a moment for React Native <Image> components to decode and paint 
            // the prefetched images onto the screen to prevent the naked model flash.
            timer = setTimeout(() => {
                setHasInitialHeroRenderLoaded(true);
            }, 500);
        }
        return () => clearTimeout(timer);
    }, [firstHeroRenderReady, hasInitialHeroRenderLoaded]);

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

    const sadriButtonsMerged = useMemo(
        () => mergeRemoteButtonsByTarget(DUMMY_SADRI_BUTTONS, buttons, 'Sadri'),
        [buttons]
    );
    const coatButtonsMerged = useMemo(
        () => mergeRemoteButtonsByTarget(DUMMY_COAT_BUTTONS, buttons, 'Coat'),
        [buttons]
    );

    const buttonById = useMemo(() => {
        const map = new Map();
        (buttons || []).forEach((b) => map.set(normalizeId(b?.id), b));
        (sadriButtonsMerged || []).forEach((b) => map.set(normalizeId(b?.id), b));
        (coatButtonsMerged || []).forEach((b) => map.set(normalizeId(b?.id), b));
        return map;
    }, [buttons, sadriButtonsMerged, coatButtonsMerged]);

    // Keep refs in sync with latest maps
    fabricsByAnyIdRef.current = fabricsByAnyId;
    buttonByIdRef.current = buttonById;

    // Command listener: apply incoming commands from the other device
    useEffect(() => {
        if (!tvSessionId) return;

        const unsubscribe = subscribeToCommands((cmd) => {
            switch (cmd.type) {
                case 'SELECT_FABRIC': {
                    const fid = normalizeId(cmd.payload?.fabricId);
                    const fabric = fabricsByAnyIdRef.current?.get(fid);
                    if (fabric) {
                        const garment = cmd.payload.garment || 'kurta';
                        if (garment === 'kurta') setSelectedFabric(fabric);
                        else if (garment === 'pajama') setSelectedPajamaFabric(fabric);
                        else if (garment === 'sadri') setSelectedSadriFabric(fabric);
                        else if (garment === 'coat') setSelectedCoatFabric(fabric);
                    } else {
                        console.warn('[RemoteCmd] SELECT_FABRIC: fabric not found for id:', fid);
                    }
                    break;
                }
                case 'SELECT_BUTTON': {
                    const btn = buttonByIdRef.current?.get(normalizeId(cmd.payload?.buttonId));
                    if (btn) setSelectedButton(btn);
                    break;
                }
                case 'SELECT_SADRI_BUTTON': {
                    const btn = buttonByIdRef.current?.get(normalizeId(cmd.payload?.buttonId));
                    if (btn) setSelectedSadriButton(btn);
                    break;
                }
                case 'SELECT_COAT_BUTTON': {
                    const btn = buttonByIdRef.current?.get(normalizeId(cmd.payload?.buttonId));
                    if (btn) setSelectedCoatButton(btn);
                    break;
                }
                case 'STYLE_CHANGE': {
                    if (cmd.payload?.type && cmd.payload?.value !== undefined) {
                        triggerStyleTransitionLoading();
                        setSelections(prev => ({ ...prev, [cmd.payload.type]: cmd.payload.value }));
                    }
                    break;
                }
                case 'TOGGLE_ITEM': {
                    if (cmd.payload?.itemId) setSelectedItems(prev => {
                        if (prev.includes(cmd.payload.itemId)) return prev.filter(i => i !== cmd.payload.itemId);
                        return [...prev, cmd.payload.itemId];
                    });
                    break;
                }
                case 'SET_PANEL': {
                    if (cmd.payload?.panel) {
                        setActivePanel(cmd.payload.panel);
                        setIsPanelOpen(true);
                        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
                    }
                    break;
                }
                case 'CLOSE_PANEL': {
                    Animated.timing(slideAnim, { toValue: -4000, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
                        setIsPanelOpen(false); setActivePanel(null);
                    });
                    break;
                }
                case 'SET_FABRIC_TAB': {
                    if (cmd.payload?.tab) setFabricTab(cmd.payload.tab);
                    break;
                }
                case 'CAROUSEL_SCROLL': {
                    if (cmd.payload?.index != null) {
                        isRemoteScrolling.current = true;
                        carouselRef.current?.scrollToIndex(cmd.payload.index);
                        setTimeout(() => { isRemoteScrolling.current = false; }, 500);
                    }
                    break;
                }
                case 'PANEL_SCROLL': {
                    const key = cmd.payload?.panel === 'Fabric'
                        ? `fabric_${cmd.payload.tab}` : cmd.payload?.panel;
                    if (cmd.payload?.y != null && key && panelScrollRefs.current[key]) {
                        isRemoteScrolling.current = true;
                        panelScrollRefs.current[key].scrollTo({ y: cmd.payload.y, animated: true });
                        setTimeout(() => { isRemoteScrolling.current = false; }, 500);
                    }
                    break;
                }
            }
        });
        return unsubscribe;
    }, [tvSessionId, subscribeToCommands, setSelectedItems, slideAnim, triggerStyleTransitionLoading]);

    // Update selectedSadriButton / selectedCoatButton when Firebase data arrives
    useEffect(() => {
        if (!sadriButtonsMerged?.length) return;
        setSelectedSadriButton(prev => {
            if (!prev) return sadriButtonsMerged[0];
            const merged = sadriButtonsMerged.find(b => b.id === prev.id);
            return merged || prev;
        });
    }, [sadriButtonsMerged]);

    useEffect(() => {
        if (!coatButtonsMerged?.length) return;
        setSelectedCoatButton(prev => {
            if (!prev) return coatButtonsMerged[0];
            const merged = coatButtonsMerged.find(b => b.id === prev.id);
            return merged || prev;
        });
    }, [coatButtonsMerged]);

    useEffect(() => {
        if (selections?.embroideryID) prefetchEmbroideryRenders(selections.embroideryID);
    }, [selections?.embroideryID, prefetchEmbroideryRenders]);

    useEffect(() => {
        if (selections?.sadriEmbroideryID) prefetchEmbroideryRenders(selections.sadriEmbroideryID);
    }, [selections?.sadriEmbroideryID, prefetchEmbroideryRenders]);

    useEffect(() => {
        if (selections?.coatEmbroideryID) prefetchEmbroideryRenders(selections.coatEmbroideryID);
    }, [selections?.coatEmbroideryID, prefetchEmbroideryRenders]);

    /** Show only styles that have uploaded collections for the active panel. */
    const embroideryListKurtaTarget = useMemo(() => {
        if (!Array.isArray(embroideryCollections)) return [];
        return embroideryCollections.filter((e) => {
            const bundle = embroideryRenders?.[e.id];
            if (!bundle) return false;
            return bundleHasPanelUploads(bundle, 'Kurta');
        });
    }, [embroideryCollections, embroideryRenders]);

    const embroideryListSadriTarget = useMemo(() => {
        if (!Array.isArray(embroideryCollections)) return [];
        return embroideryCollections.filter((e) => {
            const bundle = embroideryRenders?.[e.id];
            return bundleHasPanelUploads(bundle, 'Sadri');
        });
    }, [embroideryCollections, embroideryRenders]);

    const embroideryListCoatTarget = useMemo(() => {
        if (!Array.isArray(embroideryCollections)) return [];
        return embroideryCollections.filter((e) => {
            const bundle = embroideryRenders?.[e.id];
            return bundleHasPanelUploads(bundle, 'Coat');
        });
    }, [embroideryCollections, embroideryRenders]);

    // Reset embroidery panel tab if current tab is not available
    useEffect(() => {
        const availableTabs = [
            'Kurta',
            ...(selectedItems.includes('sadri') ? ['Sadri'] : []),
            ...(selectedItems.includes('coat') ? ['Coat'] : [])
        ];
        if (!availableTabs.includes(embroideryPanelTab)) {
            setEmbroideryPanelTab('Kurta');
        }
    }, [selectedItems, embroideryPanelTab]);

    const hasAutoDefaultedKurtaRef = useRef(false);
    const hasAutoDefaultedSadriRef = useRef(false);
    const hasAutoDefaultedCoatRef = useRef(false);

    useEffect(() => {
        if (!fabricsByGarment) return;
        const fix = (sel, tab, hasSyncedRef, setPendingBtnId) => {
            const list = listForGarmentTab(tab);
            if (!list?.length) return sel;
            const newSel = sel && list.some((x) => x.fabricID === sel.fabricID) ? sel : list[0];

            if (hasSyncedRef && !hasSyncedRef.current && newSel) {
                console.log(`[DEBUG MAVI] Initializing ${tab} default button for fabric:`, newSel.fabricID, 'Default:', newSel.default_recommended_button, 'Recommended:', newSel.recommended_buttons);
                hasSyncedRef.current = true;
                if (!presetData) {
                    let targetBtnId = newSel.default_recommended_button;
                    if (!targetBtnId && Array.isArray(newSel.recommended_buttons) && newSel.recommended_buttons.length > 0) {
                        targetBtnId = newSel.recommended_buttons[0];
                    }
                    if (targetBtnId && setPendingBtnId) {
                        console.log(`[DEBUG MAVI] Set pending button to:`, targetBtnId);
                        setPendingBtnId(normalizeId(targetBtnId));
                    }
                }
            }
            return newSel;
        };
        setSelectedFabric((f) => fix(f, 'Kurta', hasAutoDefaultedKurtaRef, setPendingKurtaBtnId));
        setSelectedPajamaFabric((f) => fix(f, 'Pajama', null, null));
        setSelectedSadriFabric((f) => fix(f, 'Sadri', hasAutoDefaultedSadriRef, setPendingSadriBtnId));
        setSelectedCoatFabric((f) => fix(f, 'Coat', hasAutoDefaultedCoatRef, setPendingCoatBtnId));
    }, [fabrics, fabricsByGarment, listForGarmentTab, presetData]);

    const buildSlidePrefetchPlan = useCallback((slideIndex) => {
        const immediate = [];
        const background = [];

        const addRequest = (list, fabric, garment) => {
            if (!fabric || !garment) return;
            const fabricKey = String(fabric.fabricID || fabric.id || fabric.name || '').trim();
            if (!fabricKey) return;
            const requestKey = `${garment}:${fabricKey}`;
            if (list.some((item) => item.key === requestKey)) return;
            const profile = fabrics.find((item) => String(item.fabricID || item.id || item.name || '').trim() === fabricKey) || fabric;
            list.push({ key: requestKey, fabric: profile, garment });
        };

        const addSelectedGarments = (list) => {
            addRequest(list, selectedFabric, 'kurta');
            addRequest(list, selectedPajamaFabric, 'pajama');
            if (selectedItems?.includes('sadri')) addRequest(list, selectedSadriFabric, 'sadri');
            if (selectedItems?.includes('coat')) addRequest(list, selectedCoatFabric, 'coat');
        };

        switch (slideIndex) {
            case 0:
                addSelectedGarments(immediate);
                break;
            case 1:
                addRequest(immediate, selectedFabric, 'kurta');
                addRequest(immediate, selectedPajamaFabric, 'pajama');
                break;
            case 2:
                addRequest(immediate, selectedFabric, 'kurta');
                break;
            case 3:
                addRequest(immediate, selectedPajamaFabric, 'pajama');
                break;
            case 4:
                if (selectedItems?.includes('coat')) addRequest(immediate, selectedCoatFabric, 'coat');
                else if (selectedItems?.includes('sadri')) addRequest(immediate, selectedSadriFabric, 'sadri');
                else addSelectedGarments(immediate);
                break;
            case 5:
                if (selectedItems?.includes('coat')) addRequest(immediate, selectedCoatFabric, 'coat');
                break;
            default:
                addSelectedGarments(immediate);
                break;
        }

        addSelectedGarments(background);
        const immediateKeys = new Set(immediate.map((item) => item.key));
        return {
            immediate,
            background: background.filter((item) => !immediateKeys.has(item.key)),
        };
    }, [
        fabrics,
        selectedFabric,
        selectedPajamaFabric,
        selectedSadriFabric,
        selectedCoatFabric,
        selectedItems,
    ]);

    useEffect(() => {
        const { immediate, background } = buildSlidePrefetchPlan(currentCarouselIndex);

        immediate.forEach(({ fabric, garment }) => {
            prefetchFabricRenders(fabric, { garments: [garment] });
        });

        if (!background.length) return undefined;

        const task = InteractionManager.runAfterInteractions(() => {
            background.forEach(({ fabric, garment }) => {
                prefetchFabricRenders(fabric, { garments: [garment] });
            });
        });

        return () => {
            if (task && typeof task.cancel === 'function') task.cancel();
        };
    }, [currentCarouselIndex, buildSlidePrefetchPlan, prefetchFabricRenders]);

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
        if (bKurta) { setSelectedButton(bKurta); setPendingKurtaBtnId(null); }
        if (bSadri) { setSelectedSadriButton(bSadri); setPendingSadriBtnId(null); }
        if (bCoat) { setSelectedCoatButton(bCoat); setPendingCoatBtnId(null); }

        const tab = presetData?.fabricTab;
        if (['Kurta', 'Pajama', 'Sadri', 'Coat'].includes(tab)) setFabricTab(tab);
        const embTab = presetData?.embroideryTab;
        if (['Kurta', 'Sadri', 'Coat'].includes(embTab)) setEmbroideryPanelTab(embTab);

        appliedPresetRef.current = presetKey;
    }, [presetData, fabrics, fabricsByAnyId, buttonById, setSelectedItems]);

    // Yahan aap apne screens ke hisab se Side Panel ki width set kar sakte hain
    const getDynamicPanelWidth = () => {
        // # TV SCREEN (portrait 541dp)
        if (effectiveTV) {
            return Math.min(width * 0.48, 280);
        }
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
    const panelScrollRefs = useRef({});
    const panelScrollTimer = useRef(null);
    const isRemoteScrolling = useRef(false);
    const slideAnim = useRef(new Animated.Value(-4000)).current;

    useEffect(() => {
        // TV mode no longer auto-opens panel — panel opens via user interaction or SET_PANEL command
    }, [initialPanel, isTVView, slideAnim]);

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

    const prefetchEmbroideryCollectionsForPreview = useCallback((embroidery, panelMode) => {
        if (!embroidery?.id) return;
        const db = getFirestoreDb();
        if (!db) return;
        fetchEmbroideryUploadedCollectionsForStyleId(db, embroidery.id, panelMode).catch(() => {});
    }, []);

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
        if (activePanel === panelName && isPanelOpen) {
            closePanel();
        } else {
            setActivePanel(panelName); setIsPanelOpen(true);
            Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
            if (tvSessionId) sendCommand('SET_PANEL', { panel: panelName });
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
        if (tvSessionId) sendCommand('CLOSE_PANEL');
    };

    const handlePanelScroll = (panel, tab) => (e) => {
        if (!tvSessionId || isRemoteScrolling.current) return;
        const y = e.nativeEvent.contentOffset.y;
        clearTimeout(panelScrollTimer.current);
        panelScrollTimer.current = setTimeout(() => {
            sendCommand('PANEL_SCROLL', { y: Math.round(y), panel, tab });
        }, 200);
    };

    const sadriBundle = selections?.sadriEmbroideryID ? embroideryRenders?.[selections.sadriEmbroideryID] : null;
    const sadriRightBaseActive = hasSadriRightBaseEmbroidery(sadriBundle, selections?.sadriEmbroideryCollection);
    const sadriUpperPocketForcedOff = isSadriUpperPocketBlocked(selections?.sadriType) || sadriRightBaseActive;

    const coatBundle = selections?.coatEmbroideryID ? embroideryRenders?.[selections.coatEmbroideryID] : null;
    const coatRightBaseActive = hasCoatRightBaseEmbroidery(coatBundle, selections?.coatEmbroideryCollection);
    const coatUpperPocketForcedOff = coatRightBaseActive;

    const handleStyleChange = (type, value) => {
        const blockSadriUpperPocket = type === 'sadriType' && isSadriUpperPocketBlocked(value);
        const forceSadriUpperPocketOff = type === 'sadriUpperPocket' && sadriUpperPocketForcedOff && String(value) === '1';
        const forceCoatUpperPocketOff = type === 'coatUpperPocket' && coatUpperPocketForcedOff && String(value) === '1';
        
        triggerStyleTransitionLoading();
        setSelections(prev => {
            const nextValue = (forceSadriUpperPocketOff || forceCoatUpperPocketOff) ? '0' : value;
            const next = { ...prev, [type]: nextValue };
            if (blockSadriUpperPocket) next.sadriUpperPocket = '0';
            return next;
        });
        if (tvSessionId) {
            sendCommand('STYLE_CHANGE', { type, value: (forceSadriUpperPocketOff || forceCoatUpperPocketOff) ? '0' : value });
            if (blockSadriUpperPocket) {
                sendCommand('STYLE_CHANGE', { type: 'sadriUpperPocket', value: '0' });
            }
        }
        setIsPanelOpen(false);
        setActivePanel(null);
        if (type === 'cuffStyle') {
            carouselRef.current?.scrollToIndex(1);
        } else if (type === 'sadriType') {
            carouselRef.current?.scrollToIndex(0);
        }
    };

    useEffect(() => {
        if (!isSadriUpperPocketBlocked(selections?.sadriType)) return;
        if (String(selections?.sadriUpperPocket || '0') === '0') return;
        setSelections((prev) => ({ ...prev, sadriUpperPocket: '0' }));
        if (tvSessionId) sendCommand('STYLE_CHANGE', { type: 'sadriUpperPocket', value: '0' });
    }, [selections?.sadriType, selections?.sadriUpperPocket, tvSessionId, sendCommand]);

    useEffect(() => {
        if (!sadriRightBaseActive) return;
        if (String(selections?.sadriUpperPocket || '0') === '0') return;
        setSelections((prev) => ({ ...prev, sadriUpperPocket: '0' }));
        if (tvSessionId) sendCommand('STYLE_CHANGE', { type: 'sadriUpperPocket', value: '0' });
    }, [sadriRightBaseActive, selections?.sadriUpperPocket, tvSessionId, sendCommand]);

    useEffect(() => {
        if (!coatRightBaseActive) return;
        if (String(selections?.coatUpperPocket || '0') === '0') return;
        setSelections((prev) => ({ ...prev, coatUpperPocket: '0' }));
        if (tvSessionId) sendCommand('STYLE_CHANGE', { type: 'coatUpperPocket', value: '0' });
    }, [coatRightBaseActive, selections?.coatUpperPocket, tvSessionId, sendCommand]);

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
            Sadri: ['sadriType', 'sadriUpperPocket'],
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

    const getSummaryEmbroideryImage = useCallback((tab) => {
        const embroideryId = tab === 'Sadri'
            ? selections.sadriEmbroideryID
            : tab === 'Coat'
                ? selections.coatEmbroideryID
                : selections.embroideryID;
        const selectedCollection = tab === 'Sadri'
            ? selections.sadriEmbroideryCollection
            : tab === 'Coat'
                ? selections.coatEmbroideryCollection
                : selections.embroideryCollection;
        if (!embroideryId || !Array.isArray(embroideryCollections)) return null;
        if (selectedCollection?.imageUri) {
            return { uri: selectedCollection.imageUri };
        }
        const embroideryItem = embroideryCollections.find(e => e.id === embroideryId);
        if (!embroideryItem) return null;
        const imageSource = tab === 'Sadri' || tab === 'Coat'
            ? embroideryItem.profileImageSadri || embroideryItem.profileImage
            : embroideryRenders[embroideryId]?.display['K'] || embroideryItem.profileImage;
        if (!imageSource) return null;
        if (typeof imageSource === 'string') {
            return { uri: imageSource };
        }
        return imageSource;
    }, [selections, embroideryCollections, embroideryRenders]);

    const getSummaryButtonImage = useCallback((tab) => {
        const button = tab === 'Sadri'
            ? selectedSadriButton
            : tab === 'Coat'
                ? selectedCoatButton
                : selectedButton;
        if (!button) return null;
        return button.icon || button.image || null;
    }, [selectedButton, selectedSadriButton, selectedCoatButton]);

    const renderFabricCard = (fabric, isActive, onSelect, infoIconSize = 24) => (
        <TouchableOpacity
            key={fabric.fabricID}
            style={[styles.fabricCard, isActive && styles.fabricCardActive, effectiveTV && { marginBottom: 8 }]}
            onPress={onSelect}
            activeOpacity={0.9}
        >
            <Image source={fabric.thumbnail} style={[styles.fabricImage, effectiveTV && { height: 80 }]} resizeMode="cover" />
            <View style={[styles.fabricInfo, effectiveTV && { minHeight: 36, paddingVertical: 5 }]}>
                <View style={styles.fabricInfoTextWrap}>
                    <Text style={[styles.fabricName, effectiveTV && { fontSize: 12 }]} numberOfLines={1}>{fabric.name}</Text>
                    <Text style={[styles.fabricBrand, effectiveTV && { fontSize: 10 }]} numberOfLines={1}>{fabric.brand}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => openFabricInfo(fabric)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    style={styles.fabricInfoIconBtn}
                >
                    <MaterialIcons name="info-outline" size={infoIconSize} color={CustomTheme.accentGold} />
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
                                onPress={() => { setFabricTab(tab); if (tvSessionId) sendCommand('SET_FABRIC_TAB', { tab }); }}
                            >
                                <Text style={[styles.fabricSwitcherText, fabricTab === tab && { color: '#fff' }]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* SEARCH & FILTER BAR */}
                    <View style={styles.searchFilterContainer}>
                        <View style={styles.searchBar}>
                            <MaterialIcons name="search" size={20} color={CustomTheme.accentGold} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search..."
                                placeholderTextColor="#94a3b8"
                                value={fabricSearchQuery}
                                onChangeText={setFabricSearchQuery}
                            />
                            {fabricSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setFabricSearchQuery('')}>
                                    <MaterialIcons name="close" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity style={styles.filterBtn}>
                            <MaterialIcons name="tune" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        {/* KURTA FABRICS */}
                        {fabricTab === 'Kurta' && fabrics ? (
                            <Animated.ScrollView 
                                ref={el => { panelScrollRefs.current['fabric_Kurta'] = el; }} 
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: fabricPanelScrollY } } }],
                                    { 
                                        useNativeDriver: true,
                                        listener: (e) => handlePanelScroll('Fabric', 'Kurta')(e)
                                    }
                                )}
                                onLayout={(e) => setFabricPanelVisibleHeight(e.nativeEvent.layout.height)}
                                onContentSizeChange={(w, h) => setFabricPanelContentHeight(h)}
                                scrollEventThrottle={16} 
                                {...PANEL_SCROLL_PROPS} 
                                contentContainerStyle={styles.gridContainer}
                            >
                                {listForGarmentTab('Kurta').map((fabric) =>
                                    renderFabricCard(
                                        fabric,
                                        selectedFabric?.fabricID === fabric.fabricID,
                                        () => {
                                            setSelectedFabric(fabric);
                                            if (tvSessionId) sendCommand('SELECT_FABRIC', { fabricId: normalizeId(fabric.fabricID), garment: 'kurta' });
                                            let targetBtnId = fabric.default_recommended_button;
                                            if (!targetBtnId && Array.isArray(fabric.recommended_buttons) && fabric.recommended_buttons.length > 0) {
                                                targetBtnId = fabric.recommended_buttons[0];
                                            }
                                            if (targetBtnId) {
                                                setPendingKurtaBtnId(normalizeId(targetBtnId));
                                            }
                                        },
                                        24
                                    )
                                )}
                            </Animated.ScrollView>
                        ) : null}

                        {/* PAJAMA FABRICS */}
                        {fabricTab === 'Pajama' && fabrics ? (
                            <Animated.ScrollView 
                                ref={el => { panelScrollRefs.current['fabric_Pajama'] = el; }} 
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: fabricPanelScrollY } } }],
                                    { 
                                        useNativeDriver: true,
                                        listener: (e) => handlePanelScroll('Fabric', 'Pajama')(e)
                                    }
                                )}
                                onLayout={(e) => setFabricPanelVisibleHeight(e.nativeEvent.layout.height)}
                                onContentSizeChange={(w, h) => setFabricPanelContentHeight(h)}
                                scrollEventThrottle={16} 
                                {...PANEL_SCROLL_PROPS} 
                                contentContainerStyle={styles.gridContainer}
                            >
                                {listForGarmentTab('Pajama').map((fabric) =>
                                    renderFabricCard(
                                        fabric,
                                        selectedPajamaFabric?.fabricID === fabric.fabricID,
                                        () => { setSelectedPajamaFabric(fabric); if (tvSessionId) sendCommand('SELECT_FABRIC', { fabricId: normalizeId(fabric.fabricID), garment: 'pajama' }); },
                                        28
                                    )
                                )}
                            </Animated.ScrollView>
                        ) : null}

                        {/* SADRI FABRICS */}
                        {fabricTab === 'Sadri' && fabrics ? (
                            <Animated.ScrollView 
                                ref={el => { panelScrollRefs.current['fabric_Sadri'] = el; }} 
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: fabricPanelScrollY } } }],
                                    { 
                                        useNativeDriver: true,
                                        listener: (e) => handlePanelScroll('Fabric', 'Sadri')(e)
                                    }
                                )}
                                onLayout={(e) => setFabricPanelVisibleHeight(e.nativeEvent.layout.height)}
                                onContentSizeChange={(w, h) => setFabricPanelContentHeight(h)}
                                scrollEventThrottle={16} 
                                {...PANEL_SCROLL_PROPS} 
                                contentContainerStyle={styles.gridContainer}
                            >
                                {listForGarmentTab('Sadri').map((fabric) =>
                                    renderFabricCard(
                                        fabric,
                                        selectedSadriFabric?.fabricID === fabric.fabricID,
                                        () => {
                                            setSelectedSadriFabric(fabric);
                                            if (tvSessionId) sendCommand('SELECT_FABRIC', { fabricId: normalizeId(fabric.fabricID), garment: 'sadri' });
                                            let targetBtnId = fabric.default_recommended_button;
                                            if (!targetBtnId && Array.isArray(fabric.recommended_buttons) && fabric.recommended_buttons.length > 0) {
                                                targetBtnId = fabric.recommended_buttons[0];
                                            }
                                            if (targetBtnId) {
                                                setPendingSadriBtnId(normalizeId(targetBtnId));
                                            }
                                        },
                                        24
                                    )
                                )}
                            </Animated.ScrollView>
                        ) : null}

                        {/* COAT FABRICS */}
                        {fabricTab === 'Coat' && fabrics ? (
                            <Animated.ScrollView 
                                ref={el => { panelScrollRefs.current['fabric_Coat'] = el; }} 
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: fabricPanelScrollY } } }],
                                    { 
                                        useNativeDriver: true,
                                        listener: (e) => handlePanelScroll('Fabric', 'Coat')(e)
                                    }
                                )}
                                onLayout={(e) => setFabricPanelVisibleHeight(e.nativeEvent.layout.height)}
                                onContentSizeChange={(w, h) => setFabricPanelContentHeight(h)}
                                scrollEventThrottle={16} 
                                {...PANEL_SCROLL_PROPS} 
                                contentContainerStyle={styles.gridContainer}
                            >
                                {listForGarmentTab('Coat').map((fabric) =>
                                    renderFabricCard(
                                        fabric,
                                        selectedCoatFabric?.fabricID === fabric.fabricID,
                                        () => {
                                            setSelectedCoatFabric(fabric);
                                            if (tvSessionId) sendCommand('SELECT_FABRIC', { fabricId: normalizeId(fabric.fabricID), garment: 'coat' });
                                            let targetBtnId = fabric.default_recommended_button;
                                            if (!targetBtnId && Array.isArray(fabric.recommended_buttons) && fabric.recommended_buttons.length > 0) {
                                                targetBtnId = fabric.recommended_buttons[0];
                                            }
                                            if (targetBtnId) {
                                                setPendingCoatBtnId(normalizeId(targetBtnId));
                                            }
                                        },
                                        18
                                    )
                                )}
                            </Animated.ScrollView>
                        ) : null}

                        {/* CUSTOM GOLD SCROLL INDICATOR FOR FABRICS */}
                        {fabricPanelContentHeight > fabricPanelVisibleHeight && (
                            <View style={{
                                position: 'absolute',
                                right: 4,
                                top: 10,
                                bottom: 10,
                                width: 3,
                                backgroundColor: 'rgba(0,0,0,0.03)',
                                borderRadius: 3,
                            }}>
                                <Animated.View style={{
                                    position: 'absolute',
                                    right: 0,
                                    width: '100%',
                                    backgroundColor: CustomTheme.accentGold,
                                    borderRadius: 3,
                                    height: Math.max(20, (fabricPanelVisibleHeight / fabricPanelContentHeight) * (fabricPanelVisibleHeight - 20)),
                                    transform: [{
                                        translateY: fabricPanelScrollY.interpolate({
                                            inputRange: [0, Math.max(1, fabricPanelContentHeight - fabricPanelVisibleHeight)],
                                            outputRange: [0, fabricPanelVisibleHeight - 20 - Math.max(20, (fabricPanelVisibleHeight / fabricPanelContentHeight) * (fabricPanelVisibleHeight - 20))],
                                            extrapolate: 'clamp',
                                        })
                                    }]
                                }} />
                            </View>
                        )}
                    </View>

                    {fabricsLoading && <Text style={styles.panelContent}>Loading fabrics from Firebase…</Text>}
                    {loadError ? <Text style={[styles.panelContent, { color: '#c0392b' }]}>{loadError}</Text> : null}
                </View>

                {/* --- STYLE PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Style' ? 1 : 0, zIndex: activePanel === 'Style' ? 10 : 0 }]} pointerEvents={activePanel === 'Style' ? 'auto' : 'none'}>
                    {KURTA_STYLE_OPTIONS ? (
                        <View style={{ flex: 1 }}>
                            <Animated.ScrollView 
                                ref={el => { panelScrollRefs.current['Style'] = el; }} 
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: stylePanelScrollY } } }],
                                    { 
                                        useNativeDriver: true,
                                        listener: (e) => handlePanelScroll('Style', null)(e)
                                    }
                                )} 
                                onLayout={(e) => setStylePanelVisibleHeight(e.nativeEvent.layout.height)}
                                onContentSizeChange={(w, h) => setStylePanelContentHeight(h)}
                                scrollEventThrottle={16} 
                                {...PANEL_SCROLL_PROPS} 
                                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 }}
                            >
                                {selectedItems.includes('kurta') && (
                                    <KurtaStylePanel 
                                        selections={selections}
                                        handleStyleChange={handleStyleChange}
                                        selectedButton={selectedButton}
                                        setButtonModalOpen={setButtonModalOpen}
                                    />
                                )}
                                {selectedItems.includes('pajama') && (
                                    <PajamaStylePanel 
                                        selections={selections}
                                        handleStyleChange={handleStyleChange}
                                    />
                                )}
                                {selectedItems.includes('sadri') && (
                                    <SadriStylePanel 
                                        selections={selections}
                                        handleStyleChange={handleStyleChange}
                                        selectedSadriButton={selectedSadriButton}
                                        setSadriButtonModalOpen={setSadriButtonModalOpen}
                                        isSadriUpperPocketBlocked={isSadriUpperPocketBlocked(selections?.sadriType)}
                                        sadriRightBaseActive={sadriRightBaseActive}
                                    />
                                )}
                                {selectedItems.includes('coat') && (
                                    <CoatStylePanel 
                                        selections={selections}
                                        handleStyleChange={handleStyleChange}
                                        selectedCoatButton={selectedCoatButton}
                                        setCoatButtonModalOpen={setCoatButtonModalOpen}
                                        coatRightBaseActive={coatRightBaseActive}
                                        isJodhpuriMode={isJodhpuriMode}
                                    />
                                )}
                            </Animated.ScrollView>

                            {/* CUSTOM GOLD SCROLL INDICATOR */}
                            {stylePanelContentHeight > stylePanelVisibleHeight && (
                                <View style={{
                                    position: 'absolute',
                                    right: 4,
                                    top: 10,
                                    bottom: 10,
                                    width: 3,
                                    backgroundColor: 'rgba(0,0,0,0.03)',
                                    borderRadius: 3,
                                }}>
                                    <Animated.View style={{
                                        position: 'absolute',
                                        right: 0,
                                        width: '100%',
                                        backgroundColor: CustomTheme.accentGold,
                                        borderRadius: 3,
                                        height: Math.max(20, (stylePanelVisibleHeight / stylePanelContentHeight) * (stylePanelVisibleHeight - 20)),
                                        transform: [{
                                            translateY: stylePanelScrollY.interpolate({
                                                inputRange: [0, Math.max(1, stylePanelContentHeight - stylePanelVisibleHeight)],
                                                outputRange: [0, stylePanelVisibleHeight - 20 - Math.max(20, (stylePanelVisibleHeight / stylePanelContentHeight) * (stylePanelVisibleHeight - 20))],
                                                extrapolate: 'clamp',
                                            })
                                        }]
                                    }} />
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.panelContent}>Loading Styles...</Text>
                    )}
                </View>

                {/* --- EMBROIDERY PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Embroidery' ? 1 : 0, zIndex: activePanel === 'Embroidery' ? 10 : 0 }]} pointerEvents={activePanel === 'Embroidery' ? 'auto' : 'none'}>
                    {embroideryCollections ? (
                        <>
                            <View style={[styles.fabricSwitcher, { marginTop: 4 }]}>
                                {[
                                    'Kurta',
                                    ...(selectedItems.includes('sadri') ? ['Sadri'] : []),
                                    ...(selectedItems.includes('coat') ? ['Coat'] : [])
                                ].map((tab) => (
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
                                {(embroideryPanelTab === 'Sadri' ? embroideryListSadriTarget : embroideryPanelTab === 'Coat' ? embroideryListCoatTarget : embroideryListKurtaTarget).map((embroidery) => {
                                    const profileThumb = embroideryPanelTab === 'Sadri' || embroideryPanelTab === 'Coat'
                                        ? (embroidery.profileImageSadri || embroidery.profileImage)
                                        : embroideryRenders[embroidery.id]?.display['K'] || embroidery.profileImage;
                                    const isActive = embroideryPanelTab === 'Kurta'
                                        ? selections.embroideryID === embroidery.id
                                        : embroideryPanelTab === 'Sadri'
                                            ? selections.sadriEmbroideryID === embroidery.id
                                            : selections.coatEmbroideryID === embroidery.id;
                                    const embPrice = Number(embroidery.price);
                                    const showEmbPrice = Number.isFinite(embPrice) && embPrice > 0;
                                    return (
                                        <View key={embroidery.id} style={[styles.fabricCard, isActive && styles.fabricCardActive]}>
                                            <TouchableOpacity
                                                onPressIn={() => {
                                                    prefetchEmbroideryCollectionsForPreview(embroidery, embroideryPanelTab);
                                                }}
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
                                                    onPressIn={() => {
                                                        prefetchEmbroideryCollectionsForPreview(embroidery, embroideryPanelTab);
                                                    }}
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
    const panelBottomOffset = effectiveTV ? 10 : 70;

    const buildSlides = () => {
        const baseProps = {
            selections,
            selectedFabric: renderSelectedFabric,
            selectedButton,
            selectedSadriButton,
            selectedCoatButton,
            selectedPajamaFabric: renderSelectedPajamaFabric,
            selectedSadriFabric: renderSelectedSadriFabric,
            selectedCoatFabric: renderSelectedCoatFabric,
            hasSadri,
            sadriCode,
            selectedSkinTone,
        };

        if (hasOuterwear) {
            return [
                <View key="full" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaModel
                        {...baseProps}
                        hasCoat={hasCoat}
                        slideIndex={0}
                        onSceneReadyChange={setIsInitialSlideSceneReady}
                        bufferInitialScene={!hasInitialHeroRenderLoaded || shouldBufferSlideZeroScene}
                    />
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
                <KurtaModel
                    {...baseProps}
                    hasCoat={hasCoat}
                    slideIndex={0}
                    onSceneReadyChange={setIsInitialSlideSceneReady}
                    bufferInitialScene={!hasInitialHeroRenderLoaded || shouldBufferSlideZeroScene}
                />
            </View>,
            <View key="folded" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <KurtaFolded {...baseProps} />
            </View>,
            <View key="pajama_only" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <PajamaStylePreview {...baseProps} />
            </View>
        ];
    };

    const isFoldedSlide = hasOuterwear ? currentCarouselIndex === 2 : currentCarouselIndex === 1;

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
                    <MaterialIcons name="arrow-back" size={22} color="#000000" />
                </TouchableOpacity>
                <View style={styles.headerLogoContainer}>
                    {/* Logo removed as requested */}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* --- LAYER 1: 3D MODEL ENGINE --- */}
            <View
                ref={shareCaptureRef}
                collapsable={false}
                style={[styles.shareCaptureContainer, isPreparingShareShot && styles.shareCapturePreparing]}
            >
                <View style={[styles.modelContainer, effectiveTV && { width: '82%', alignSelf: 'center' }]}>
                    <FullScreenCarousel
                        ref={carouselRef}
                        data={buildSlides()}
                        carouselWidth={effectiveTV ? width * 0.82 : width}
                        onIndexChange={(index) => {
                            setCurrentCarouselIndex(index);
                            if (tvSessionId && !isRemoteScrolling.current) sendCommand('CAROUSEL_SCROLL', { index });
                        }}
                    />
                    {/* INITIAL LOADING CURTAIN */}
                    {!hasInitialHeroRenderLoaded ? (
                        <View style={styles.initialLoadingCurtain}>
                            <View style={styles.initialLoadingContent}>
                                {/* Logo removed */}
                                <View style={styles.initialLoadingSpinnerWrap}>
                                    {!loadError ? (
                                        <DotLottie
                                            source={{ uri: RENDER_LOADING_ANIMATION_URL }}
                                            autoplay
                                            loop
                                            style={styles.initialLoadingAnimation}
                                        />
                                    ) : null}
                                    <Text style={styles.initialLoadingText}>Dressing Model...</Text>
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {/* ONGOING LOADING OVERLAY */}
                    {showRenderLoadingOverlay ? (
                        <View style={styles.renderLoadingOverlay} pointerEvents="none">
                            <View style={styles.renderLoadingPill}>
                                {!loadError ? (
                                    <DotLottie
                                        source={{ uri: RENDER_LOADING_ANIMATION_URL }}
                                        autoplay
                                        loop
                                        style={styles.renderLoadingAnimationSmall}
                                    />
                                ) : null}
                                <Text style={[styles.renderLoadingText, { marginTop: 0, backgroundColor: 'transparent', shadowOpacity: 0, borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0 }]}>
                                    {renderLoadingLabel}
                                </Text>
                            </View>
                        </View>
                    ) : null}
                </View>
                {isPreparingShareShot ? (
                    <View pointerEvents="none" style={styles.shareShotOverlay}>
                        <View style={styles.shareLogoWrap}>
                            {/* Logo removed */}
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

            <View style={[
                styles.rightMenu,
                effectiveTV && { right: normalize(20) }
            ]}>
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
                            <TouchableOpacity key={index} style={[styles.iconButton, isActive && styles.iconButtonActive, effectiveTV && { width: normalize(36), height: normalize(36), borderRadius: normalize(8) }]} onPress={() => togglePanel(IconComponent.displayName)}>
                                <IconComponent size={effectiveTV ? normalize(16) : 28} color={isActive ? CustomTheme.accentGold : '#14213D'} />
                                <Text style={[styles.iconText, isActive && { color: CustomTheme.accentGold, fontWeight: '900' }, { marginTop: 1, fontSize: effectiveTV ? normalize(7) : 11 }]}>
                                    {IconComponent.displayName === 'Embroidery' ? 'EMB' : IconComponent.displayName.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </Animated.View>

                {/* EXTRAS CONTAINER (BUTTON + TRAY) */}
                <View style={{ alignItems: 'center', position: 'relative' }}>
                    <Animated.View
                        pointerEvents={extrasTrayOpen ? 'auto' : 'none'}
                        style={[
                            styles.extrasTrayFloating,
                            {
                                opacity: extrasTrayAnim,
                                position: 'absolute',
                                bottom: 64, // Positioned right above the button
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
                                    style={[styles.extrasTraySlot, effectiveTV && { width: normalize(40), height: normalize(40), borderRadius: normalize(8) }]}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        if (id === 0) { setSummaryTab(fabricTab || 'Kurta'); setSummaryOpen(true); animateExtrasTray(false); return; }
                                        if (id === 2) { handleSharePreset(); animateExtrasTray(false); return; }
                                        if (id === 3) { setSkinToneModalOpen(true); animateExtrasTray(false); return; }
                                    }}
                                >
                                    <Icon width={effectiveTV ? normalize(24) : 40} height={effectiveTV ? normalize(24) : 40} />
                                    <Text style={[styles.extrasTraySlotLabel, effectiveTV && { fontSize: normalize(7) }]}>{label}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </Animated.View>

                    <TouchableOpacity
                        style={[styles.iconButton, extrasTrayOpen && styles.iconButtonActive, { marginBottom: 0 }, effectiveTV && { width: normalize(36), height: normalize(36), borderRadius: normalize(8) }]}
                        onPress={toggleExtrasTray}
                    >
                        <IconExtras size={effectiveTV ? normalize(16) : 28} color={extrasTrayOpen ? CustomTheme.accentGold : '#14213D'} />
                        <Text style={[styles.iconText, extrasTrayOpen && { color: CustomTheme.accentGold, fontWeight: '900' }, { marginTop: 1, fontSize: effectiveTV ? normalize(7) : 11 }]}>{extrasTrayOpen ? 'HIDE' : 'EXTRAS'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {!isTVView && isPanelOpen && (
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

            {isPanelOpen && (
                <Animated.View style={[styles.sidePanel, { width: panelWidth, bottom: panelBottomOffset + insets.bottom, transform: [{ translateX: slideAnim }] }]}>
                    <View style={styles.panelHeader}>
                        <Text style={[styles.panelTitle, effectiveTV && { fontSize: normalize(20) }]}>Select {activePanel}</Text>
                        <TouchableOpacity onPress={closePanel}><Text style={[styles.closeBtn, effectiveTV && { fontSize: normalize(22) }]}>✕</Text></TouchableOpacity>
                    </View>
                    <View style={styles.panelContentArea}>{renderPanelContent()}</View>
                </Animated.View>
            )}

            {isButtonModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <View style={styles.buttonModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Select Button</Text>
                            <TouchableOpacity onPress={() => setButtonModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonModalTabsWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buttonModalTabs}>
                                {['Recommended', 'Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.buttonTab, buttonModalTab === tab && styles.buttonTabActive]}
                                        onPress={() => setButtonModalTab(tab)}
                                    >
                                        <Text style={[styles.buttonTabText, buttonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.buttonListGrid}>
                            {buttons
                                .filter(buttonTargetsKurta)
                                .filter(b => {
                                    if (buttonModalTab === 'Recommended') {
                                        const recs = selectedFabric?.recommended_buttons;
                                        return Array.isArray(recs) && recs.map(normalizeId).includes(normalizeId(b.id));
                                    }
                                    return b.material === buttonModalTab;
                                })
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
                                            onPress={() => { setSelectedButton(btn); setButtonModalOpen(false); if (tvSessionId) sendCommand('SELECT_BUTTON', { buttonId: btn.id }); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} resizeMode="contain" />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={styles.buttonItemName} numberOfLines={2} textAlign="center">{btn.name}</Text>
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
                        <View style={styles.buttonModalTabsWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buttonModalTabs}>
                                {['Recommended', 'Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.buttonTab, sadriButtonModalTab === tab && styles.buttonTabActive]}
                                        onPress={() => setSadriButtonModalTab(tab)}
                                    >
                                        <Text style={[styles.buttonTabText, sadriButtonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.buttonListGrid}>
                            {sadriButtonsMerged
                                .filter(b => {
                                    if (sadriButtonModalTab === 'Recommended') {
                                        const recs = selectedSadriFabric?.recommended_buttons;
                                        return Array.isArray(recs) && recs.map(normalizeId).includes(normalizeId(b.id));
                                    }
                                    return b.material === sadriButtonModalTab;
                                })
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
                                            onPress={() => { setSelectedSadriButton(btn); setSadriButtonModalOpen(false); if (tvSessionId) sendCommand('SELECT_SADRI_BUTTON', { buttonId: btn.id }); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} resizeMode="contain" />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={styles.buttonItemName} numberOfLines={2} textAlign="center">{btn.name}</Text>
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
                        <View style={styles.buttonModalTabsWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buttonModalTabs}>
                                {['Recommended', 'Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.buttonTab, coatButtonModalTab === tab && styles.buttonTabActive]}
                                        onPress={() => setCoatButtonModalTab(tab)}
                                    >
                                        <Text style={[styles.buttonTabText, coatButtonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <ScrollView {...PANEL_SCROLL_PROPS} contentContainerStyle={styles.buttonListGrid}>
                            {coatButtonsMerged
                                .filter(b => {
                                    if (coatButtonModalTab === 'Recommended') {
                                        const recs = selectedCoatFabric?.recommended_buttons;
                                        return Array.isArray(recs) && recs.map(normalizeId).includes(normalizeId(b.id));
                                    }
                                    return b.material === coatButtonModalTab;
                                })
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
                                            onPress={() => { setSelectedCoatButton(btn); setCoatButtonModalOpen(false); if (tvSessionId) sendCommand('SELECT_COAT_BUTTON', { buttonId: btn.id }); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} resizeMode="contain" />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={styles.buttonItemName} numberOfLines={2} textAlign="center">{btn.name}</Text>
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
                        : embroideryPreview?.panelMode === 'Coat'
                            ? selections.coatEmbroideryCollection?.id
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
                    } else if (panelMode === 'Coat') {
                        setSelections((prev) => ({
                            ...prev,
                            coatEmbroideryID: embroidery.id,
                            coatEmbroideryCollection: collection,
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


            {isSkinToneModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSkinToneModalOpen(false)} />
                    <View style={styles.skinToneModalContainer}>
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Skin Tone</Text>
                            <TouchableOpacity onPress={() => setSkinToneModalOpen(false)}>
                                <Text style={styles.closeBtn}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.skinToneGrid} showsVerticalScrollIndicator={false}>
                            {SKIN_TONE_OPTIONS.map((option) => {
                                const isActive = selectedSkinTone === option.value;
                                return (
                                    <View key={option.value} style={styles.skinToneCardWrap}>
                                        <TouchableOpacity
                                            style={[styles.skinToneCard, isActive && styles.skinToneCardActive]}
                                            onPress={() => {
                                                setSelectedSkinTone(option.value);
                                                setSkinToneModalOpen(false);
                                            }}
                                            activeOpacity={0.9}
                                        >
                                            <Image source={option.image} style={styles.skinTonePreview} resizeMode="cover" />
                                        </TouchableOpacity>
                                        <Text style={[styles.optionLabel, { color: isActive ? '#000' : '#555' }]}>{option.label}</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            )}

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


                            {(() => {
                                const embroideryImage = getSummaryEmbroideryImage(summaryTab);
                                const buttonImage = getSummaryButtonImage(summaryTab);
                                if (!embroideryImage && !buttonImage) return null;
                                return (
                                    <View style={styles.summaryImagesWrap}>
                                        {buttonImage ? (
                                            <View style={styles.summaryImageCard}>
                                                <Image source={buttonImage} style={styles.summaryButtonImage} resizeMode="contain" />
                                                <Text style={styles.summaryImageCardLabel}>Button</Text>
                                            </View>
                                        ) : null}
                                        {embroideryImage ? (
                                            <View style={styles.summaryImageCard}>
                                                <Image source={embroideryImage} style={styles.summaryEmbroideryImage} resizeMode="contain" />
                                                <Text style={styles.summaryImageCardLabel}>Embroidery</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            })()}

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

            {!isTVView && (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }, effectiveTV && { minHeight: 36, paddingTop: 2, paddingBottom: 2 }]}>
                    <View style={styles.bottomBarTint} />
                    <View style={styles.bottomBarContent}>
                        <View style={styles.priceBlock}>
                            <Text style={styles.productName} numberOfLines={1}>Custom kurta set</Text>
                            <Text style={styles.price} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                ₹ {totalPrice.toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.estDelivery} numberOfLines={1} adjustsFontSizeToFit>
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
            )}

            {isTVView && (
                <View style={[styles.tvModeBadge, { paddingHorizontal: normalize(20), paddingVertical: normalize(10), borderRadius: normalize(20) }]}>
                    <Text style={[styles.tvModeText, { fontSize: normalize(13) }]}>REMOTE CONNECTED</Text>
                </View>
            )}
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
    modelContainer: { flex: 1, zIndex: 1, position: 'relative', marginTop: 0 },
    renderLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 41,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 80,
    },
    initialLoadingCurtain: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
        backgroundColor: '#101828', // Dark elegant background
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialLoadingContent: {
        alignItems: 'center',
    },
    initialLoadingSpinnerWrap: {
        marginTop: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    initialLoadingAnimation: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    initialLoadingText: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
    renderLoadingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        gap: 12,
    },
    renderLoadingAnimationSmall: {
        width: 24,
        height: 24,
    },
    renderLoadingAnimation: {
        width: 148,
        height: 148,
    },
    renderLoadingText: {
        color: CustomTheme.textBrand,
        fontSize: 13,
        fontWeight: '600',
        marginTop: -8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(20,33,61,0.08)',
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
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
    header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, zIndex: 10 },
    headerLogoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: { width: 44, height: 44, backgroundColor: '#F5F1E8', borderWidth: 0.5, borderColor: '#000000', borderRadius: 6, justifyContent: 'center', alignItems: 'center', shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, overflow: 'hidden' },
    backText: { fontSize: 18, fontWeight: 'bold', color: CustomTheme.textBrand, zIndex: 2 },
    brandText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: CustomTheme.textBrand },
    rightMenu: { position: 'absolute', right: 20, top: 0, bottom: 84, zIndex: 100, alignItems: 'center', justifyContent: 'center' },
    iconButton: { width: 54, height: 54, backgroundColor: '#F5F1E8', borderWidth: 0.5, borderColor: '#000000', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, overflow: 'hidden' },
    iconButtonActive: { backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: CustomTheme.accentGold, shadowColor: CustomTheme.accentGold, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
    iconText: { fontSize: 11, color: CustomTheme.textBrand, fontWeight: 'bold', textAlign: 'center', zIndex: 2 },
    extrasTray: { alignItems: 'center' },
    extrasTrayFloating: {
        alignItems: 'center',
        zIndex: 2,
        marginBottom: 10,
    },
    extrasTraySlot: {
        width: 54,
        height: 54,
        marginBottom: 10,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: '#000000',
        backgroundColor: '#F5F1E8',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: CustomTheme.shadowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
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
    sidePanel: { position: 'absolute', left: 0, top: 0, bottom: 84, backgroundColor: '#FDFBF7', borderWidth: 1, borderColor: '#e5e7eb', zIndex: 5000, elevation: 5000, paddingTop: 18, shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15, borderTopRightRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden' },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 10, marginTop: -10 },
    panelTitle: { fontSize: 20, fontWeight: 'bold', color: CustomTheme.textBrand },
    closeBtn: { fontSize: 24, color: CustomTheme.accentGold, padding: 10 },
    panelContentArea: { flex: 1 },
    panelContent: { fontSize: 16, color: '#666', paddingHorizontal: 20 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'center', paddingBottom: 20 },
    fabricCard: {
        width: '100%',
        backgroundColor: '#F5F1E8',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    fabricCardActive: {
        borderColor: CustomTheme.accentGold,
        borderWidth: 2.5,
        backgroundColor: '#FFFFFF',
        shadowColor: CustomTheme.accentGold,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    fabricImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#EBE6D9',
    },
    fabricInfo: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: 54,
    },
    fabricInfoTextWrap: {
        flex: 1,
        paddingRight: 8,
    },
    fabricInfoIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(155, 118, 66, 0.08)', // Faint Gold background
    },
    fabricName: {
        fontSize: 13,
        fontWeight: '900',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fabricBrand: {
        fontSize: 11,
        color: CustomTheme.accentGold,
        marginTop: 2,
        fontWeight: '700',
    },
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
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#FDFBF7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 10000,
    },
    bottomBarTint: {
        display: 'none',
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
        fontSize: 13,
        fontWeight: '900',
        color: '#9B7642',
        marginBottom: 2,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    price: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000000',
        letterSpacing: -0.5,
    },
    estDelivery: {
        fontSize: 11,
        color: '#9B7642',
        marginTop: 4,
        fontWeight: '700',
        letterSpacing: 0.2,
        lineHeight: 13,
    },
    checkoutBtn: {
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        maxWidth: 160,
    },
    checkoutBtnTablet: {
        maxWidth: 220,
        paddingHorizontal: 60
    },
    checkoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
    checkoutChevron: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginLeft: 2, marginTop: -1 },

    // Fabric Tab Switcher
    fabricSwitcher: { flexDirection: 'row', marginHorizontal: 15, marginTop: 10, marginBottom: 8, backgroundColor: '#F5F1E8', borderRadius: 6, padding: 3, borderWidth: 1, borderColor: '#EBE6D9' },
    fabricSwitcherTab: { flex: 1, paddingVertical: 7, borderRadius: 4, alignItems: 'center' },
    fabricSwitcherTabActive: { backgroundColor: CustomTheme.accentGold },
    fabricSwitcherText: { fontSize: 13, fontWeight: 'bold', color: '#000000' },

    // Search & Filter
    searchFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 16,
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F1E8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 0.5,
        borderColor: '#EBE6D9',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#000',
        paddingVertical: 8,
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    filterBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#F5F1E8',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.5,
        borderColor: '#EBE6D9',
    },

    // Button UI Styles
    buttonBanner: { backgroundColor: CustomTheme.accentGold, paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 15, marginHorizontal: 5 },
    buttonBannerText: { color: CustomTheme.textPrimary, fontSize: 14, fontWeight: 'bold' },
    buttonIconWrapper: { width: '100%', height: 85, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#666', marginHorizontal: 3 },
    buttonModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: CustomTheme.overlayLight, zIndex: 9999, elevation: 9999, justifyContent: 'center', alignItems: 'center' },
    buttonModalContainer: { width: '85%', maxHeight: '70%', backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
    buttonModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    buttonModalTitle: { fontSize: 18, fontWeight: 'bold', color: CustomTheme.textBrand },
    buttonModalTabsWrapper: { borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
    buttonModalTabs: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
    buttonTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 15, marginHorizontal: 4 },
    buttonTabActive: { backgroundColor: CustomTheme.accentGold },
    buttonTabText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    buttonListGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 15 },
    buttonItem: { width: '48%', flexDirection: 'column', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
    buttonItemActive: { borderColor: CustomTheme.accentGold, backgroundColor: 'rgba(252, 157, 3, 0.1)' },
    buttonItemIcon: { width: 125, height: 125, borderRadius: 62.5, backgroundColor: 'transparent', marginBottom: 10 },
    buttonItemName: { fontSize: 13, fontWeight: 'bold', color: CustomTheme.textBrand, textAlign: 'center' },
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
    skinToneModalContainer: {
        width: '92%',
        maxHeight: '80%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    skinToneGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 22,
    },
    skinToneCardWrap: {
        width: '48%',
        marginBottom: 16,
    },
    skinToneCard: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        paddingVertical: 0,
    },
    skinToneCardActive: {
        borderWidth: 2,
        borderColor: CustomTheme.accentGold,
        backgroundColor: '#fffdf8',
    },
    skinTonePreview: {
        width: '100%',
        height: 140,
        marginBottom: 0,
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
    summaryImagesWrap: {
        marginTop: 12,
        marginBottom: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    summaryImageCard: {
        alignItems: 'center',
        flex: 1,
        maxWidth: 140,
    },
    summaryButtonImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    summaryEmbroideryImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
    },
    summaryImageCardLabel: {
        marginTop: 8,
        fontSize: 11,
        color: '#4b5563',
        fontWeight: '700',
        textAlign: 'center',
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
    tvModeBadge: {
        position: 'absolute',
        top: 30,
        right: 30,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: CustomTheme.accentGold,
        zIndex: 1000,
    },
    tvModeText: {
        color: CustomTheme.accentGold,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});
