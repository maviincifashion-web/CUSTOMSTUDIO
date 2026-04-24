import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Share,
    Linking,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { fetchPresetById } from '../../src/firebase/TrendingApi';
import { getFirestoreDb } from '../../src/firebase/config';
import { fetchFabricById } from '../../src/firebase/catalogApi';
import { useResponsive } from '../../hooks/useResponsive';
import { BlurView } from 'expo-blur';
import WrenchIcon from '../../assets/images/extra_icons/settings-wrench-svgrepo-com.svg';
import { SvgCssUri } from 'react-native-svg/css';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    runOnJS 
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = require('../../assets/images/hero_banner.jpg');
const IMAGE_KEYS = ['src', 'url', 'uri', 'image', 'imageUrl', 'imageURL', 'thumbnail', 'thumb', 'fabricImg', 'profileImage', 'photo'];
const ORDER_KEYS = ['pos', 'order', 'position', 'index', 'sequence', 'sort', 'priority'];
const LABEL_MAP: Record<string, string> = {
    item_type: 'Item Type',
    size_fit: 'Size & Fit',
    washcare: 'Wash Care',
    customize_url: 'Reference URL',
    item_included: 'Items Included',
    includes: 'Items Included',
};

type ProductRecord = Record<string, unknown>;
type DetailRow = { label: string; value: string };
type OrderedImageItem = { uri: string; sortOrder: number; sourceOrder: number };
type FabricProfile = {
    key: string;
    tabLabel: string;
    title: string;
    brand: string;
    brandLogoUri: string;
    link: string;
    imageUris: string[];
    imageUri: string;
    composition: string;
    color: string;
    weave: string;
    pattern: string;
    width: string;
    weight: string;
    description: string;
    price: string;
    sortOrder: number;
    sourceOrder: number;
};

function isRecord(value: unknown): value is ProductRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeUrl(value: string) {
    return /^https?:\/\//i.test(value.trim());
}

function dedupeStrings(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function humanizeKey(value: string) {
    if (LABEL_MAP[value]) return LABEL_MAP[value];
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateValue(value: unknown) {
    const formatDate = (date: Date) => date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    if (isRecord(value) && typeof value.toDate === 'function') {
        return formatDate(value.toDate());
    }

    if (isRecord(value)) {
        const seconds = value.seconds ?? value._seconds;
        if (typeof seconds === 'number') {
            return formatDate(new Date(seconds * 1000));
        }
    }

    return '';
}

function formatScalar(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return formatDateValue(value);
}

function parseNumber(value: unknown) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        if (!cleaned) return 0;
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function formatCurrency(value: unknown) {
    const amount = parseNumber(value);
    if (!amount) return 'Price on request';

    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `INR ${Math.round(amount)}`;
    }
}

function extractImageUris(value: unknown, seen = new Set<string>(), depth = 0): string[] {
    if (value == null || depth > 3) return [];

    if (typeof value === 'string') {
        const uri = value.trim();
        if (!looksLikeUrl(uri) || seen.has(uri)) return [];
        seen.add(uri);
        return [uri];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) => extractImageUris(item, seen, depth + 1));
    }

    if (!isRecord(value)) return [];

    const directMatches = IMAGE_KEYS.flatMap((key) => extractImageUris(value[key], seen, depth + 1));
    const nestedMatches = Object.values(value).flatMap((entry) => extractImageUris(entry, seen, depth + 1));
    return [...directMatches, ...nestedMatches];
}

function readSortOrder(value: unknown, fallbackIndex: number) {
    if (!isRecord(value)) return fallbackIndex;

    for (const key of ORDER_KEYS) {
        const raw = value[key];
        if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
        if (typeof raw === 'string' && raw.trim()) {
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) return parsed;
        }
    }

    return fallbackIndex;
}

function extractOrderedImagesFromValue(value: unknown, startIndex: number) {
    const ordered: OrderedImageItem[] = [];
    const seen = new Set<string>();

    const pushUris = (uris: string[], sortOrder: number, sourceOrder: number) => {
        uris.forEach((uri, uriIndex) => {
            if (!uri || seen.has(uri)) return;
            seen.add(uri);
            ordered.push({
                uri,
                sortOrder: sortOrder + uriIndex * 0.001,
                sourceOrder: sourceOrder + uriIndex * 0.001,
            });
        });
    };

    if (Array.isArray(value)) {
        value.forEach((entry, index) => {
            const sourceOrder = startIndex + index;
            pushUris(extractImageUris(entry), readSortOrder(entry, sourceOrder), sourceOrder);
        });
    } else {
        pushUris(extractImageUris(value), startIndex, startIndex);
    }

    return ordered;
}

function extractOrderedPresetImages(product: ProductRecord | null) {
    if (!product) return [];

    const ordered: OrderedImageItem[] = [];
    const pushGroup = (value: unknown, startIndex: number) => {
        ordered.push(...extractOrderedImagesFromValue(value, startIndex));
    };

    pushGroup(product.src, 0);
    pushGroup(product.image, 10);
    pushGroup(product.single, 100);
    pushGroup(product.images, 200);
    pushGroup(product.gallery, 300);
    pushGroup((product as ProductRecord).other_images, 400);
    pushGroup((product as ProductRecord).otherImages, 500);

    const sorted = ordered.sort((a, b) => (a.sortOrder === b.sortOrder ? a.sourceOrder - b.sourceOrder : a.sortOrder - b.sortOrder));
    
    const finalUris: string[] = [];
    const seenUris = new Set<string>();
    
    for (const item of sorted) {
        if (!seenUris.has(item.uri)) {
            seenUris.add(item.uri);
            finalUris.push(item.uri);
        }
    }
    
    return finalUris;
}

function extractOrderedIncludedItems(product: ProductRecord | null) {
    if (!product) return [];

    const directItems = dedupeStrings(
        extractDisplayList(product.item_included)
            .concat(extractDisplayList(product.includes))
            .concat(extractDisplayList(product.includedItems))
    );
    if (directItems.length > 0) return directItems;

    const orderedItems: { label: string; sortOrder: number; sourceOrder: number }[] = [];
    const fabrics = Array.isArray(product.fabrics) ? product.fabrics : [];

    fabrics.forEach((entry, index) => {
        if (!isRecord(entry)) return;

        const nestedFabric = isRecord(entry.fabric) ? entry.fabric : null;
        const label = summarizeValue(entry.type) || summarizeValue(nestedFabric?.type) || summarizeValue(entry.category);
        if (!label) return;

        const sourceOrder = index;
        const sortOrder = readSortOrder(entry, readSortOrder(nestedFabric, sourceOrder));
        orderedItems.push({ label, sortOrder, sourceOrder });
    });

    if (orderedItems.length === 0) {
        const singleFabric = isRecord(product.fabric) ? product.fabric : null;
        const singleLabel = summarizeValue(singleFabric?.type) || summarizeValue(product.category);
        return singleLabel ? [singleLabel] : [];
    }

    const seen = new Set<string>();
    return orderedItems
        .sort((a, b) => (a.sortOrder === b.sortOrder ? a.sourceOrder - b.sourceOrder : a.sortOrder - b.sortOrder))
        .flatMap((item) => {
            const normalized = item.label.trim().toLowerCase();
            if (!normalized || seen.has(normalized)) return [];
            seen.add(normalized);
            return [item.label];
        });
}

function firstMeaningfulText(...values: unknown[]) {
    for (const value of values) {
        const text = summarizeValue(value);
        if (text) return text;
    }
    return '';
}

function firstMeaningfulImage(...values: unknown[]) {
    for (const value of values) {
        const imageUri = extractImageUris(value)[0];
        if (imageUri) return imageUri;
    }
    return '';
}

function normalizeRemoteImageUri(rawUri: unknown) {
    if (typeof rawUri !== 'string') return '';
    const uri = rawUri.trim();
    if (!uri) return '';
    if (/^https?:\/\//i.test(uri)) return uri;
    if (/^\/\//.test(uri)) return `https:${uri}`;
    if (/^gs:\/\//i.test(uri)) {
        const rest = uri.replace(/^gs:\/\//i, '');
        const slashIndex = rest.indexOf('/');
        if (slashIndex > 0) {
            const bucket = rest.slice(0, slashIndex);
            const objectPath = rest.slice(slashIndex + 1);
            if (objectPath) {
                return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
            }
        }
    }
    return '';
}

function collectFabricInfoImages(...values: unknown[]) {
    const out: string[] = [];
    const seen = new Set<string>();
    values.forEach((value) => {
        extractImageUris(value).forEach((uri) => {
            if (!uri || seen.has(uri)) return;
            seen.add(uri);
            out.push(uri);
        });
    });
    return out;
}

function buildFabricProfiles(product: ProductRecord | null): FabricProfile[] {
    if (!product) return [];

    const sourceEntries = Array.isArray(product.fabrics)
        ? product.fabrics.filter(isRecord)
        : isRecord(product.fabric)
            ? [product.fabric]
            : [];

    return sourceEntries
        .map((entry, index) => {
            const nestedFabric = isRecord(entry.fabric) ? entry.fabric : null;
            const sourceOrder = index;
            const sortOrder = readSortOrder(entry, readSortOrder(nestedFabric, sourceOrder));
            const tabLabel = firstMeaningfulText(entry.type, nestedFabric?.type, entry.category, `Fabric ${index + 1}`);
            const title = firstMeaningfulText(entry.name, nestedFabric?.fabric, nestedFabric?.name, entry.fabricName, tabLabel);
            const brand = firstMeaningfulText(entry.brand, nestedFabric?.brand, entry.mill, 'Premium Fabric');
            const rawPrice = entry.price ?? nestedFabric?.price;
            const price = parseNumber(rawPrice) > 0 ? formatCurrency(rawPrice) : '';
            const fabricMasterImages = collectFabricInfoImages(
                nestedFabric?.src,
                nestedFabric?.single,
                nestedFabric?.fabricImg,
                nestedFabric?.imageList
            );

            const imageUris = fabricMasterImages.length > 0
                ? fabricMasterImages
                : collectFabricInfoImages(
                    entry.src,
                    entry.single,
                    entry.fabricImg,
                    entry.imageList
                );

            const defaultImageIndex = imageUris.length >= 2 ? 1 : 0;

            return {
                key: `${tabLabel}-${title}-${index}`,
                tabLabel,
                title,
                brand,
                brandLogoUri: normalizeRemoteImageUri(entry.brandImg ?? nestedFabric?.brandImg ?? entry.brandLogo ?? nestedFabric?.brandLogo),
                link: firstMeaningfulText(entry.link, nestedFabric?.link),
                imageUris,
                imageUri: imageUris[defaultImageIndex] || firstMeaningfulImage(
                    nestedFabric?.src,
                    nestedFabric?.single,
                    nestedFabric?.fabricImg,
                    entry.src,
                    entry.single,
                    entry.fabricImg
                ),
                composition: firstMeaningfulText(entry.composition, entry.material, nestedFabric?.composition, nestedFabric?.material),
                color: firstMeaningfulText(entry.color, entry.colorCode, nestedFabric?.color, nestedFabric?.colorCode),
                weave: firstMeaningfulText(entry.weave, nestedFabric?.weave),
                pattern: firstMeaningfulText(entry.pattern, nestedFabric?.pattern),
                width: firstMeaningfulText(entry.width, nestedFabric?.width),
                weight: firstMeaningfulText(entry.weight, nestedFabric?.weight),
                description: firstMeaningfulText(entry.des, entry.description, nestedFabric?.des, nestedFabric?.description),
                price,
                sortOrder,
                sourceOrder,
            };
        })
        .sort((a, b) => (a.sortOrder === b.sortOrder ? a.sourceOrder - b.sourceOrder : a.sortOrder - b.sortOrder));
}

function extractDisplayList(value: unknown, depth = 0): string[] {
    if (value == null || depth > 2) return [];

    if (typeof value === 'string') {
        const text = value.trim();
        return text && !looksLikeUrl(text) ? [text] : [];
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return [formatScalar(value)];
    }

    const formattedDate = formatDateValue(value);
    if (formattedDate) return [formattedDate];

    if (Array.isArray(value)) {
        return dedupeStrings(value.flatMap((item) => extractDisplayList(item, depth + 1)));
    }

    if (!isRecord(value)) return [];

    const preferredValues = ['name', 'title', 'label', 'type', 'fabric', 'value']
        .flatMap((key) => extractDisplayList(value[key], depth + 1));

    if (preferredValues.length > 0) {
        return dedupeStrings(preferredValues);
    }

    return dedupeStrings(
        Object.entries(value)
            .filter(([key]) => !IMAGE_KEYS.includes(key) && !looksLikeUrl(String(value[key] ?? '')))
            .flatMap(([key, nested]) => {
                const scalar = formatScalar(nested);
                if (scalar) return [`${humanizeKey(key)}: ${scalar}`];

                const nestedValues = extractDisplayList(nested, depth + 1);
                return nestedValues.length > 0 ? [`${humanizeKey(key)}: ${nestedValues.join(', ')}`] : [];
            })
    );
}

function summarizeValue(value: unknown) {
    const scalar = formatScalar(value);
    if (scalar) return scalar;
    return extractDisplayList(value).slice(0, 4).join(' • ');
}

function pushRow(rows: DetailRow[], label: string, value: unknown) {
    const formatted = summarizeValue(value);
    if (formatted) rows.push({ label, value: formatted });
}

function buildSelectionRows(selection: ProductRecord) {
    return Object.entries(selection)
        .map(([key, value]) => ({ label: humanizeKey(key), value: summarizeValue(value) }))
        .filter((row) => row.value);
}

function buildAdditionalRows(product: ProductRecord) {
    return Object.entries(product)
        .filter(([key]) => !CURATED_KEYS.has(key))
        .map(([key, value]) => ({ label: humanizeKey(key), value: summarizeValue(value) }))
        .filter((row) => row.value);
}



const ZoomableImage = ({ uri, onZoomChange }: { uri: string; onZoomChange: (zooming: boolean) => void }) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
            if (scale.value > 1.1) {
                runOnJS(onZoomChange)(true);
            }
        })
        .onEnd(() => {
            if (scale.value < 1.1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                runOnJS(onZoomChange)(false);
            } else {
                savedScale.value = scale.value;
            }
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
            if (scale.value !== 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                runOnJS(onZoomChange)(false);
            } else {
                scale.value = withSpring(2.5);
                savedScale.value = 2.5;
                runOnJS(onZoomChange)(true);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <GestureDetector gesture={Gesture.Exclusive(pinchGesture, doubleTap)}>
            <Animated.Image
                source={uri ? { uri } : PLACEHOLDER_IMAGE}
                style={[styles.fullScreenImage, animatedStyle]}
                resizeMode="contain"
            />
        </GestureDetector>
    );
};

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { normalize, isTablet } = useResponsive();
    const [product, setProduct] = useState<ProductRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [activeFabricIndex, setActiveFabricIndex] = useState(0);
    const [activeFabricImageIndex, setActiveFabricImageIndex] = useState(0);
    const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
    const [modalImages, setModalImages] = useState<string[]>([]);
    const [modalInitialIndex, setModalInitialIndex] = useState(0);
    const [isPinching, setIsPinching] = useState(false);
    const [isPaymentOptionsExpanded, setIsPaymentOptionsExpanded] = useState(false);
    const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    const openFullScreen = (images: string[], index: number) => {
        setModalImages(images);
        setModalInitialIndex(index);
        setIsFullScreenVisible(true);
    };

    const loadProduct = useCallback(async () => {
        if (typeof id !== 'string' || !id.trim()) {
            setErrorMessage('Product id missing from route.');
            setProduct(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const data = await fetchPresetById(id);
            if (!data) {
                setProduct(null);
                setErrorMessage('No preset found for this product.');
                return;
            }

            // Fetch actual fabric data from database for each assigned fabric
            const db = getFirestoreDb();
            if (db) {
                const fabrics = Array.isArray(data.fabrics) ? data.fabrics : (data.fabric ? [data.fabric] : []);
                
                const updatedFabrics = await Promise.all(fabrics.map(async (entry: any) => {
                    const fabricID = entry.fabricID || entry.fabricId || entry.id;
                    if (fabricID) {
                        const dbFabric = await fetchFabricById(db, fabricID);
                        if (dbFabric) {
                            return { ...entry, fabric: dbFabric };
                        }
                    }
                    return entry;
                }));

                if (Array.isArray(data.fabrics)) {
                    data.fabrics = updatedFabrics;
                } else if (data.fabric) {
                    data.fabric = updatedFabrics[0];
                }
            }

            setProduct(data);
        } catch (error) {
            console.error('[ProductDetailScreen] Failed to load preset:', error);
            setProduct(null);
            setErrorMessage('Unable to load product details right now.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [product?.id]);

    useEffect(() => {
        setActiveFabricIndex(0);
    }, [product?.id]);

    useEffect(() => {
        const defaultIdx = (activeFabric?.imageUris?.length ?? 0) >= 2 ? 1 : 0;
        setActiveFabricImageIndex(defaultIdx);
    }, [activeFabricIndex, product?.id, activeFabric?.imageUris?.length]);

    const selectionSource = useMemo(() => {
        if (!product) return {};
        const rawSelection = product.Selection ?? product.selection ?? product.config;
        return isRecord(rawSelection) ? rawSelection : {};
    }, [product]);

    const uploadedProductImages = useMemo(() => extractOrderedPresetImages(product), [product]);

    const safeActiveImageIndex = uploadedProductImages.length > 0
        ? Math.min(activeImageIndex, uploadedProductImages.length - 1)
        : 0;
    const heroImage = uploadedProductImages[safeActiveImageIndex] || null;
    const productName = summarizeValue(product?.name) || 'Untitled Design';
    const categoryLabel = (summarizeValue(product?.category) || 'Preset').toUpperCase();
    const displayPrice = formatCurrency(product?.price);
    const discountValue = parseNumber(product?.discount);
    const fabricDetails = useMemo(
        () => dedupeStrings(extractDisplayList(product?.fabric).concat(extractDisplayList(product?.fabrics))),
        [product]
    );
    const fabricProfiles = useMemo(() => buildFabricProfiles(product), [product]);
    const occasionDetails = useMemo(() => extractDisplayList(product?.occasion), [product]);
    const sizeFitDetails = useMemo(() => extractDisplayList(product?.size_fit), [product]);
    const washCareDetails = useMemo(() => extractDisplayList(product?.washcare), [product]);
    const typeDetails = useMemo(() => extractDisplayList(product?.types), [product]);
    const itemIncludedDetails = useMemo(() => extractOrderedIncludedItems(product), [product]);
    const itemIncludedLabel = useMemo(() => {
        if (itemIncludedDetails.length === 0) return 'ITEM INCLUDED';
        return `${itemIncludedDetails.length} ITEM INCLUDED`;
    }, [itemIncludedDetails]);
    const itemIncludedText = useMemo(() => {
        if (itemIncludedDetails.length === 0) return '';
        if (itemIncludedDetails.length === 1) return itemIncludedDetails[0];
        const items = [...itemIncludedDetails];
        const last = items.pop();
        return `${items.join(', ')} & ${last}`;
    }, [itemIncludedDetails]);
    const safeActiveFabricIndex = fabricProfiles.length > 0
        ? Math.min(activeFabricIndex, fabricProfiles.length - 1)
        : 0;
    const activeFabric = fabricProfiles[safeActiveFabricIndex] ?? null;
    const activeFabricImages = activeFabric?.imageUris || [];
    const safeActiveFabricImageIndex = activeFabricImages.length > 0
        ? Math.min(activeFabricImageIndex, activeFabricImages.length - 1)
        : 0;
    const activeFabricImage = activeFabricImages[safeActiveFabricImageIndex] || activeFabric?.imageUri || '';
    const activeFabricBrandIsSvg = !!activeFabric?.brandLogoUri && /\.svg([?#-]|$)/i.test(activeFabric.brandLogoUri);
    const description = useMemo(() => {
        const dbDescription = summarizeValue(product?.des) || summarizeValue(product?.description) || summarizeValue(product?.desc);
        if (dbDescription) return dbDescription;

        const categoryText = summarizeValue(product?.category) || 'tailored preset';
        const typeText = summarizeValue(product?.item_type) || summarizeValue(product?.single) || 'signature piece';
        return `A ${categoryText} preset from the MAVI catalog, configured as a ${typeText} with live database-backed styling details.`;
    }, [product]);

    const referenceUrl = useMemo(() => {
        const rawUrl = summarizeValue(product?.customize_url);
        return rawUrl && looksLikeUrl(rawUrl) ? rawUrl : '';
    }, [product]);



    const estimatedDeliveryLabel = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 12);
        const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
        const month = d.toLocaleDateString('en-IN', { month: 'short' });
        const year = d.toLocaleDateString('en-IN', { year: '2-digit' });
        return `Est. delivery by ${weekday}, ${day} ${month} ${year}`;
    }, []);

    const attributeFields = useMemo(
        () => [
            {
                key: 'washcare',
                label: 'Wash Care',
                value: washCareDetails.join(', ') || '',
            },
            {
                key: 'occasion',
                label: 'Occasion',
                value: occasionDetails.join(', ') || '',
            },
            {
                key: 'size-fit',
                label: 'Size & Fit',
                value: sizeFitDetails.join(', ') || '',
            },
        ].filter(field => field.value),
        [occasionDetails, sizeFitDetails, washCareDetails]
    );


    const customizationAvailable = product?.customize === true;
    const heroHeight = isTablet ? height * 0.62 : height * 0.54;
    const horizontalPadding = normalize(isTablet ? 28 : 20);

    const renderFabricInfoDetailRow = useCallback((
        icon: React.ComponentProps<typeof MaterialIcons>['name'],
        label: string,
        value: string,
        opts?: { multiline?: boolean }
    ) => {
        const multiline = !!opts?.multiline;
        return (
            <View style={[styles.customizerInfoRow, multiline ? styles.customizerInfoRowMultiline : null]}>
                <View style={[styles.customizerInfoRowLeft, multiline ? styles.customizerInfoRowLeftMultiline : null]}>
                    <View style={styles.customizerInfoIconWrap}>
                        <MaterialIcons name={icon} size={16} color="#D4A106" />
                    </View>
                    <Text style={styles.customizerInfoLabel}>{label}</Text>
                </View>
                <Text style={[styles.customizerInfoValue, multiline ? styles.customizerInfoValueMultiline : null]}>
                    {value || '-'}
                </Text>
            </View>
        );
    }, []);

    const handleCustomize = useCallback(() => {
        if (!product) return;

        // Prioritize the database-provided reference/customize URL
        if (referenceUrl) {
            handleOpenReference();
            return;
        }

        const presetData = encodeURIComponent(JSON.stringify(product));
        const category = String(product.category || '').toLowerCase();

        if (category === 'kurta') {
            router.push({
                pathname: '/kurta',
                params: { presetParam: presetData, presetIdParam: String(product.id || '') },
            });
            return;
        }

        router.push({
            pathname: '/outfit',
            params: { presetParam: presetData, presetIdParam: String(product.id || '') },
        });
    }, [product, referenceUrl, handleOpenReference, router]);

    const handleShare = useCallback(async () => {
        if (!product) return;

        const lines = [productName, displayPrice, description];
        if (referenceUrl) lines.push(referenceUrl);

        try {
            await Share.share({
                title: productName,
                message: lines.filter(Boolean).join('\n'),
            });
        } catch (error) {
            console.error('[ProductDetailScreen] Share failed:', error);
        }
    }, [description, displayPrice, product, productName, referenceUrl]);

    const handleOpenReference = useCallback(async () => {
        if (!referenceUrl) {
            handleShare();
            return;
        }

        try {
            const canOpen = await Linking.canOpenURL(referenceUrl);
            if (canOpen) {
                await Linking.openURL(referenceUrl);
                return;
            }
        } catch (error) {
            console.error('[ProductDetailScreen] Failed to open reference URL:', error);
        }

        handleShare();
    }, [handleShare, referenceUrl]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#C6933F" />
                <Text style={styles.loaderText}>Loading live preset details...</Text>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#8D7B68" />
                <Text style={styles.errorTitle}>Product Not Found</Text>
                <Text style={styles.errorBody}>{errorMessage || 'This preset is unavailable right now.'}</Text>
                <View style={styles.errorActions}>
                    <TouchableOpacity style={styles.secondaryErrorBtn} onPress={() => router.back()}>
                        <Text style={styles.secondaryErrorBtnText}>Go Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryErrorBtn} onPress={loadProduct}>
                        <Text style={styles.primaryErrorBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: productName,
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F6F1E8' },
                    headerTintColor: '#18130F',
                }}
            />
            <StatusBar barStyle="dark-content" backgroundColor="#F6F1E8" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => openFullScreen(uploadedProductImages.length > 0 ? uploadedProductImages : [heroImage || ''], safeActiveImageIndex)}
                >
                    <View style={[styles.heroContainer, { height: heroHeight }]}> 
                        <Image
                            source={heroImage ? { uri: heroImage } : PLACEHOLDER_IMAGE}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                    </View>
                </TouchableOpacity>

                {uploadedProductImages.length > 0 ? (
                    <View style={[styles.galleryRailSection, { paddingHorizontal: horizontalPadding }]}> 
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.galleryRailContent}
                        >
                            {uploadedProductImages.map((imageUri, index) => (
                                <TouchableOpacity
                                    key={`${imageUri}-${index}`}
                                    activeOpacity={0.9}
                                    onPress={() => setActiveImageIndex(index)}
                                    style={[
                                        styles.thumbnailCard,
                                        index === safeActiveImageIndex ? styles.thumbnailCardActive : null,
                                    ]}
                                >
                                    <Image source={{ uri: imageUri }} style={styles.thumbnailImage} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}> 
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTopRow}>
                            <View style={styles.summaryHeadingWrap}>
                                <Text style={styles.sectionEyebrow}>{categoryLabel}</Text>
                                <Text style={styles.summaryTitle}>{productName}</Text>
                                <View style={styles.deliveryBadge}>
                                    <MaterialIcons name="local-shipping" size={14} color="#8A5A12" />
                                    <Text style={styles.deliveryText}>{estimatedDeliveryLabel}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryPriceWrap}>
                                <Text style={styles.summaryPrice}>{displayPrice}</Text>
                                {discountValue > 0 ? <Text style={styles.summaryDiscount}>{discountValue}% OFF</Text> : null}
                            </View>
                        </View>

                        {customizationAvailable ? (
                            <View style={styles.customizeBadge}>
                                <WrenchIcon width={14} height={14} fill="#C6933F" />
                                <Text style={styles.customizeBadgeText}>CUSTOMIZABLE</Text>
                            </View>
                        ) : null}

                        <Text style={styles.summaryDescription}>{description}</Text>

                        {itemIncludedDetails.length > 0 ? (
                            <View style={styles.itemIncludedSection}>
                                <Text style={[styles.itemIncludedLabel, { fontSize: normalize(12) }]}>{itemIncludedLabel}</Text>
                                <Text style={[styles.itemIncludedText, { fontSize: normalize(18), lineHeight: normalize(26) }]}>
                                    {itemIncludedText}
                                </Text>
                            </View>
                        ) : null}

                        {attributeFields.length > 0 ? (
                            <View style={styles.summaryAttributesSection}>
                                {attributeFields.map((field) => (
                                    <View key={field.key} style={styles.summaryAttributeRow}>
                                        <Text style={styles.summaryAttributeLabel}>{field.label}: </Text>
                                        <Text style={styles.summaryAttributeValue}>{field.value}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </View>



                    {fabricProfiles.length > 0 && activeFabric ? (
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryTopRow}>
                                <View style={styles.summaryHeadingWrap}>
                                    <Text style={styles.sectionEyebrow}>FABRIC INFO</Text>
                                </View>


                            </View>

                            {fabricProfiles.length > 1 ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={[styles.customizerFabricTabsRow, { paddingVertical: 8, paddingHorizontal: 4 }]}
                                >
                                    {fabricProfiles.map((fabric, index) => (
                                        <TouchableOpacity
                                            key={fabric.key}
                                            onPress={() => setActiveFabricIndex(index)}
                                            style={[
                                                styles.customizerFabricTab,
                                                index === safeActiveFabricIndex ? styles.customizerFabricTabActive : null,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.customizerFabricTabText,
                                                    index === safeActiveFabricIndex ? styles.customizerFabricTabTextActive : null,
                                                ]}
                                            >
                                                {fabric.tabLabel}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : null}

                            <View style={styles.customizerBrandBanner}>
                                <View style={styles.customizerBrandLogoPanel}>
                                    {activeFabric.brandLogoUri ? (
                                        activeFabricBrandIsSvg ? (
                                            <SvgCssUri uri={activeFabric.brandLogoUri} width="100%" height="100%" />
                                        ) : (
                                            <Image
                                                source={{ uri: activeFabric.brandLogoUri }}
                                                style={styles.customizerBrandLogoImage}
                                                resizeMode="contain"
                                            />
                                        )
                                    ) : (
                                        <View style={styles.customizerBrandFallback}>
                                            <Text style={styles.customizerBrandFallbackText}>FABRIC</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.customizerBrandNamePanel}>
                                    <Text style={styles.customizerBrandNameText} numberOfLines={1}>{activeFabric.title}</Text>
                                </View>
                            </View>

                            <View style={styles.customizerInfoImageWrap}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => openFullScreen(activeFabricImages.length > 0 ? activeFabricImages : [activeFabricImage], safeActiveFabricImageIndex)}
                                >
                                    <Image
                                        source={activeFabricImage ? { uri: activeFabricImage } : PLACEHOLDER_IMAGE}
                                        style={styles.customizerInfoImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>

                                {activeFabricImages.length > 1 ? (
                                    <View style={styles.customizerInfoImageControls}>
                                        <TouchableOpacity
                                            style={styles.customizerInfoImageNav}
                                            onPress={() => setActiveFabricImageIndex((prev) => (prev - 1 + activeFabricImages.length) % activeFabricImages.length)}
                                        >
                                            <Text style={styles.customizerInfoImageNavText}>‹</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.customizerInfoImageNav}
                                            onPress={() => setActiveFabricImageIndex((prev) => (prev + 1) % activeFabricImages.length)}
                                        >
                                            <Text style={styles.customizerInfoImageNavText}>›</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </View>

                            {activeFabric.description ? (
                                <Text style={[styles.summaryDescription, { marginBottom: 4 }]}>{activeFabric.description}</Text>
                            ) : null}

                            <View style={styles.customizerInfoDetailsCard}>
                                {renderFabricInfoDetailRow('palette', 'Color', activeFabric.color || '-')}
                                {renderFabricInfoDetailRow('science', 'Composition', activeFabric.composition || '-', { multiline: true })}
                                {renderFabricInfoDetailRow('texture', 'Weave', activeFabric.weave || '-')}
                                {renderFabricInfoDetailRow('grid-view', 'Pattern', activeFabric.pattern || '-')}
                                {renderFabricInfoDetailRow('straighten', 'Width', activeFabric.width || '-')}
                            </View>

                            {activeFabric.link ? (
                                <TouchableOpacity
                                    style={styles.customizerInfoLinkBtn}
                                    onPress={async () => {
                                        if (await Linking.canOpenURL(activeFabric.link)) {
                                            Linking.openURL(activeFabric.link);
                                        }
                                    }}
                                >
                                    <Text style={styles.customizerInfoLinkText}>Open Link</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Payment Options Section */}
                    <View style={styles.summaryCard}>
                        <TouchableOpacity 
                            style={styles.paymentHeader}
                            onPress={() => setIsPaymentOptionsExpanded(!isPaymentOptionsExpanded)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.paymentTitleRow}>
                                <MaterialIcons name="payment" size={18} color="#8A5A12" style={{ marginRight: 8 }} />
                                <Text style={styles.paymentTitle}>Payment Options</Text>
                            </View>
                            <Ionicons 
                                name={isPaymentOptionsExpanded ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color="#18130F" 
                            />
                        </TouchableOpacity>

                        {isPaymentOptionsExpanded && (
                            <View style={styles.paymentContent}>
                                <View style={styles.paymentLogosRow}>
                                    <View style={styles.paymentIconBox}><Text style={styles.paymentIconText}>UPI</Text></View>
                                    <View style={styles.paymentIconBox}><Ionicons name="card" size={14} color="#4B3F34" /></View>
                                    <View style={styles.paymentIconBox}><Text style={styles.paymentIconText}>GPay</Text></View>
                                    <View style={styles.paymentIconBox}><Text style={styles.paymentIconText}>Paytm</Text></View>
                                    <Text style={styles.plusMore}>+10</Text>
                                </View>
                                
                                <View style={styles.prepaidOfferBadge}>
                                    <Text style={styles.prepaidOfferText}>Get Extra 5% off on pre-paid Orders</Text>
                                </View>

                                <Text style={styles.paymentNote}>
                                    Pay full amount with your payment options. You will be redirected to Razorpay for Payment.
                                </Text>

                                <View style={styles.razorpayBranding}>
                                    <Text style={styles.poweredByText}>Powered by </Text>
                                    <Text style={styles.razorpayLogoText}>Razorpay</Text>
                                </View>

                                <View style={styles.paymentSeparator}>
                                    <View style={styles.paymentLine} />
                                    <Text style={styles.paymentOrText}>OR</Text>
                                    <View style={styles.paymentLine} />
                                </View>

                                <View style={styles.codBadge}>
                                    <MaterialIcons name="money" size={16} color="#4B3F34" />
                                    <Text style={styles.codText}>Cash on Delivery</Text>
                                </View>
                                <View style={styles.codInfoBox}>
                                    <MaterialIcons name="info-outline" size={12} color="#8A5A12" style={{ marginRight: 6, marginTop: 2 }} />
                                    <Text style={styles.codNoteText}>
                                        Since we provide an <Text style={{ fontWeight: '800' }}>Exclusive Custom-Tailored Service</Text> where every garment is handcrafted specifically for you, a <Text style={{ fontWeight: '800' }}>₹500 advance token</Text> is required to confirm COD orders.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Policies Section */}
                    <View style={styles.policiesContainer}>
                        <Text style={styles.policiesHeading}>Policies & Information</Text>
                        
                        {[
                            {
                                id: 'tnc',
                                title: 'Terms and Conditions',
                                content: `Blue Pearl Industries Inc.\n\nFor the purpose of these Terms and Conditions, the term "we", "us", "our" used anywhere on this page shall mean Blue Pearl, whose registered/operational office is Ward 15 indira para, shanti nagar bhilai Durg CHATTISGARH 490021. "you", “your”, "user", “visitor” shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.\n\nYour use of the website and/or purchase from us are governed by following Terms and Conditions:\n\n• The content of the pages of this website is subject to change without notice.\n• Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose.\n• Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable.\n• Reproduction of material owned by or licensed to us is prohibited.\n• Any dispute arising out of use of our website and/or purchase is subject to the laws of India.`
                            },
                            {
                                id: 'privacy',
                                title: 'Privacy Policy',
                                content: `Last updated on Aug 30th 2024\n\nBlue Pearl is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, then you can be assured that it will only be used in accordance with this privacy statement.\n\nWe may collect:\n• Name and Contact information\n• Demographic information\n• Other relevant survey/offer info\n\nWhat we do with information:\n• Internal record keeping\n• To improve products and services\n• Periodically send promotional emails`
                            },
                            {
                                id: 'shipping',
                                title: 'Shipping & Delivery Policy',
                                content: `Last updated on Aug 30th 2024\n\n• International buyers: Orders are delivered through registered international courier companies.\n• Domestic buyers: Orders are shipped through registered domestic courier companies/speed post.\n• Timeline: Orders are shipped within 8-14 days from the date of the order and payment.\n• Delay: Blue Pearl is not liable for any delay by courier company/postal authorities.`
                            },
                            {
                                id: 'refund',
                                title: 'Cancellation & Refund Policy',
                                content: `Last updated on Aug 30th 2024\n\n• Cancellations: Considered only if request is made within same day of placing order.\n• Perishables: No cancellation request for perishable items.\n• Damaged Items: Please report to Customer Service within same day of receipt.\n• Refunds: Approval will take 6-8 days to be processed to the end customer.`
                            },
                            {
                                id: 'return',
                                title: 'Return Policy',
                                content: `At Maviinci, we are dedicated to providing high-quality custom-tailored clothing.\n\nEligibility:\n• Not as per Your Chosen Style/Fabric\n• Damaged Product on arrival\n• Late Delivery (>3 days after scheduled date)\n• After Two Alterations still not meeting expectations\n\nReturn Window: Report issue within 24 hours of receiving order.\nRefund Process: Approved returns receive purchase price refund subject to 2% deduction.`
                            },
                            {
                                id: 'contact',
                                title: 'Contact Us',
                                content: `Merchant Legal entity name: Blue Pearl\n\nRegistered/Operational Address:\nWard 15 indira para, shanti nagar bhilai Durg CHATTISGARH 490021\n\nEmail: connect@bluepearlindustries.com\nPhone: +91-8871081395`
                            }
                        ].map((policy) => (
                            <View key={policy.id} style={styles.policyItem}>
                                <TouchableOpacity 
                                    style={styles.policyItemHeader}
                                    onPress={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.policyItemTitle}>{policy.title}</Text>
                                    <Ionicons 
                                        name={expandedPolicy === policy.id ? "remove" : "add"} 
                                        size={20} 
                                        color="#64748B" 
                                    />
                                </TouchableOpacity>
                                {expandedPolicy === policy.id && (
                                    <View style={styles.policyItemContent}>
                                        <Text style={styles.policyItemText}>{policy.content}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>





                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            <BlurView intensity={85} tint="light" style={styles.bottomActions}>
                <View style={styles.bottomActionsTop}>
                    <View style={styles.topActionsLeft}>
                        <TouchableOpacity style={styles.iconAction} onPress={handleShare}>
                            <Ionicons
                                name="share-social-outline"
                                size={20}
                                color="#18130F"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconAction} onPress={() => setIsFavorite(!isFavorite)}>
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={22}
                                color={isFavorite ? '#EF4444' : '#18130F'}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cartAction} onPress={() => alert('Added to cart.')}>
                        <Ionicons name="cart-outline" size={18} color="#18130F" />
                        <Text style={styles.cartActionText}>ADD TO CART</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomActionsBottom}>
                    <TouchableOpacity style={styles.orderAction} onPress={() => alert('Starting order.')}>
                        <Text style={styles.orderActionText}>ORDER NOW</Text>
                    </TouchableOpacity>

                    {customizationAvailable && (
                        <TouchableOpacity style={styles.primaryAction} onPress={handleCustomize}>
                            <Text style={styles.primaryActionText}>CUSTOMIZE NOW</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>

            <Modal
                visible={isFullScreenVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsFullScreenVisible(false)}
            >
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={styles.fullScreenModal}>
                        <StatusBar hidden />
                        <TouchableOpacity 
                            style={styles.closeModalBtn} 
                            onPress={() => setIsFullScreenVisible(false)}
                        >
                            <Ionicons name="close" size={normalize(32)} color="#fff" />
                        </TouchableOpacity>

                        <FlatList
                            data={modalImages}
                            horizontal
                            pagingEnabled
                            scrollEnabled={!isPinching}
                            initialScrollIndex={modalInitialIndex}
                            getItemLayout={(_, index) => ({
                                length: width,
                                offset: width * index,
                                index,
                            })}
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={[styles.fullScreenImageContainer, { width }]}>
                                    <ZoomableImage uri={item} onZoomChange={setIsPinching} />
                                </View>
                            )}
                            keyExtractor={(item, index) => `${item}-${index}`}
                        />
                    </View>
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F1E8',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    heroContainer: {
        backgroundColor: '#E8DFD1',
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroShade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(19, 15, 11, 0.30)',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(248, 242, 232, 0.92)',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoShell: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(248, 242, 232, 0.90)',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
    },
    heroDetails: {
        position: 'absolute',
        bottom: 28,
        gap: 12,
    },
    liveBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(248, 242, 232, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(248, 242, 232, 0.28)',
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#C6933F',
    },
    liveBadgeText: {
        color: '#FFF7EB',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.1,
    },
    heroCategory: {
        color: '#F7EFE2',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.4,
    },
    heroTitle: {
        color: '#FFF9F1',
        fontWeight: '900',
        lineHeight: 36,
        maxWidth: width * 0.7,
    },
    heroFooterRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
    },
    priceCluster: {
        flex: 1,
        gap: 4,
    },
    heroPrice: {
        color: '#FFF9F1',
        fontSize: 28,
        fontWeight: '900',
    },
    heroDiscount: {
        color: '#F6D59F',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    statBadge: {
        minWidth: 104,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 22,
        backgroundColor: 'rgba(248, 242, 232, 0.88)',
    },
    statBadgeLabel: {
        color: '#7A6752',
        fontSize: 11,
        fontWeight: '700',
    },
    statBadgeValue: {
        color: '#18130F',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 4,
    },
    galleryRailSection: {
        marginTop: 16,
    },
    galleryRailLabel: {
        color: '#7C6A58',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    galleryRailHint: {
        color: '#8B7662',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    singlePreviewCard: {
        width: 112,
        height: 138,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#E3D7C6',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
    },
    singlePreviewImage: {
        width: '100%',
        height: '100%',
    },
    galleryRailContent: {
        paddingRight: 24,
        paddingVertical: 8,
        gap: 12,
    },
    thumbnailCard: {
        position: 'relative',
        width: 88,
        height: 108,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#E3D7C6',
        borderWidth: 2,
        borderColor: 'rgba(24, 19, 15, 0.12)',
    },
    thumbnailCardActive: {
        borderColor: '#C6933F',
        borderWidth: 2,
        transform: [{ translateY: -2 }],
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    content: {
        marginTop: 22,
        gap: 24,
    },
    summaryCard: {
        backgroundColor: '#FCF8F1',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
        gap: 16,
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
    },
    summaryHeadingWrap: {
        flex: 1,
        gap: 6,
    },
    summaryPriceWrap: {
        alignItems: 'flex-end',
        gap: 4,
    },
    summaryTitle: {
        color: '#18130F',
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 28,
    },
    summaryPrice: {
        color: '#18130F',
        fontSize: 20,
        fontWeight: '900',
    },
    summaryDiscount: {
        color: '#8A5A12',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    sectionEyebrow: {
        color: '#8A5A12',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },
    sectionSubtitle: {
        color: '#7A6752',
        fontSize: 14,
        lineHeight: 21,
        marginTop: 6,
        marginBottom: 14,
    },
    customizeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: '#FFF4DE',
        borderWidth: 1,
        borderColor: '#F0D4A4',
    },
    customizeBadgeText: {
        color: '#8A5A12',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    summaryDescription: {
        color: '#4B3F34',
        fontSize: 15,
        lineHeight: 26,
    },
    itemIncludedSection: {
        gap: 12,
    },
    itemIncludedLabel: {
        color: '#8A5A12',
        fontWeight: '900',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },
    itemIncludedText: {
        color: '#18130F',
        marginTop: 2,
        fontWeight: '700',
    },

    summaryAttributesSection: {
        marginTop: 10,
        gap: 6,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(24, 19, 15, 0.05)',
    },
    summaryAttributeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    summaryAttributeLabel: {
        color: '#8A5A12',
        fontSize: 13,
        fontWeight: '800',
    },
    summaryAttributeValue: {
        color: '#4B3F34',
        fontSize: 13,
        fontWeight: '500',
    },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    deliveryText: {
        color: '#8A5A12',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: -0.2,
    },

    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    paymentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentTitle: {
        color: '#18130F',
        fontSize: 15,
        fontWeight: '800',
    },
    paymentContent: {
        marginTop: 16,
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(24, 19, 15, 0.05)',
    },
    paymentLogosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    paymentIconBox: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F1EDE5',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentIconText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#4B3F34',
    },
    plusMore: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8A5A12',
        marginLeft: 4,
    },
    prepaidOfferBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    prepaidOfferText: {
        color: '#15803D',
        fontSize: 13,
        fontWeight: '700',
    },
    paymentNote: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    razorpayBranding: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    poweredByText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
    },
    razorpayLogoText: {
        color: '#3395FF',
        fontSize: 13,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    paymentSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    paymentLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(24, 19, 15, 0.05)',
    },
    paymentOrText: {
        marginHorizontal: 12,
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '700',
    },
    codBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 8,
    },
    codText: {
        color: '#4B3F34',
        fontSize: 14,
        fontWeight: '700',
    },

    policiesContainer: {
        marginTop: 12,
        paddingHorizontal: 4,
    },
    policiesHeading: {
        color: '#18130F',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 16,
        paddingLeft: 4,
    },
    policyItem: {
        backgroundColor: '#FFFDF9',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
        marginBottom: 10,
        overflow: 'hidden',
    },
    policyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    policyItemTitle: {
        color: '#18130F',
        fontSize: 14,
        fontWeight: '700',
    },
    policyItemContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(24, 19, 15, 0.05)',
    },
    policyItemText: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
    },
    codInfoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF8ED',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(138, 90, 18, 0.1)',
        marginTop: 4,
    },
    codNoteText: {
        flex: 1,
        color: '#8A5A12',
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '500',
    },

    customizerFabricTabsRow: {
        flexDirection: 'row',
        backgroundColor: '#E8E1D5',
        borderRadius: 16,
        padding: 5,
        gap: 5,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    customizerFabricTab: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: 'transparent',
        borderWidth: 0,
        minWidth: 64,
        alignItems: 'center',
    },
    customizerFabricTabActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#18130F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 4,
        zIndex: 1,
    },
    customizerFabricTabText: {
        color: '#8B7662',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    customizerFabricTabTextActive: {
        color: '#18130F',
    },

    customizerBrandBanner: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        height: 38,
        marginBottom: 14,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
        borderRadius: 4,
    },
    customizerBrandLogoPanel: {
        width: 132,
        height: '100%',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRightWidth: 1,
        borderRightColor: 'rgba(24, 19, 15, 0.05)',
    },
    customizerBrandLogoImage: {
        width: '100%',
        height: '100%',
    },
    customizerBrandFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    customizerBrandFallbackText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    customizerBrandNamePanel: {
        backgroundColor: '#FFFFFF',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    customizerBrandNameText: {
        color: '#18130F',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    customizerBrandSubText: {
        marginTop: 2,
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    customizerInfoImageWrap: {
        marginBottom: 14,
    },
    customizerInfoImage: {
        width: '100%',
        height: 198,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    customizerInfoImageControls: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    customizerInfoImageNav: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    customizerInfoImageNavText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#18130F',
        marginTop: -2,
    },
    customizerInfoImageCounter: {
        fontSize: 11,
        fontWeight: '800',
        color: '#18130F',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        overflow: 'hidden',
    },
    customizerInfoDetailsCard: {
        marginTop: 4,
        backgroundColor: '#FFFDF9',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
    },
    customizerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    customizerInfoRowMultiline: {
        alignItems: 'flex-start',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 6,
    },
    customizerInfoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '44%',
        minWidth: 116,
        paddingRight: 10,
    },
    customizerInfoRowLeftMultiline: {
        width: '100%',
        minWidth: 0,
        paddingRight: 0,
    },
    customizerInfoIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    customizerInfoLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    customizerInfoValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 12,
        color: '#14213D',
        fontWeight: '600',
        lineHeight: 17,
    },
    customizerInfoValueMultiline: {
        width: '100%',
        textAlign: 'left',
        flex: 0,
        fontSize: 13,
        lineHeight: 20,
    },
    customizerInfoLinkBtn: {
        marginTop: 14,
        alignSelf: 'center',
        backgroundColor: '#D4A106',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    customizerInfoLinkText: {
        color: '#14213D',
        fontWeight: '800',
        fontSize: 12,
    },
    sectionBlock: {
        gap: 2,
    },

    pillPanel: {
        gap: 10,
    },
    detailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FCF8F1',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
    },
    detailPillText: {
        flex: 1,
        color: '#4B3F34',
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '700',
    },
    detailCard: {
        backgroundColor: '#FFFDF9',
        borderRadius: 24,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(24, 19, 15, 0.14)',
    },
    detailRowLast: {
        borderBottomWidth: 0,
    },
    detailLabel: {
        width: 108,
        color: '#8B7662',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    detailValue: {
        flex: 1,
        color: '#1D1712',
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '700',
    },
    bottomSpacer: {
        height: 20,
    },
    bottomActions: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'column',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 32,
        gap: 12,
        backgroundColor: 'rgba(246, 241, 232, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(24, 19, 15, 0.05)',
    },
    bottomActionsTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    topActionsLeft: {
        flexDirection: 'row',
        gap: 8,
    },
    bottomActionsBottom: {
        flexDirection: 'row',
        gap: 8,
    },
    iconAction: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFDF9',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.1)',
        borderRadius: 12,
    },
    cartAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFDF9',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.1)',
        borderRadius: 12,
        height: 48,
        gap: 8,
    },
    cartActionText: {
        color: '#18130F',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    orderAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFDF9',
        borderWidth: 2,
        borderColor: '#18130F',
        borderRadius: 12,
        height: 52,
    },
    orderActionText: {
        color: '#18130F',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    primaryAction: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#18130F',
        borderRadius: 12,
        height: 52,
    },
    primaryActionText: {
        color: '#F6F1E8',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    loaderContainer: {
        flex: 1,
        backgroundColor: '#F6F1E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 14,
        color: '#7C6A58',
        fontSize: 14,
        fontWeight: '700',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#F6F1E8',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    errorTitle: {
        color: '#18130F',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 20,
    },
    errorBody: {
        color: '#7C6A58',
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        marginTop: 10,
        maxWidth: 320,
    },
    errorActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 26,
    },
    secondaryErrorBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#FFFDF9',
        borderWidth: 1,
        borderColor: 'rgba(24, 19, 15, 0.08)',
    },
    secondaryErrorBtnText: {
        color: '#18130F',
        fontSize: 14,
        fontWeight: '800',
    },
    primaryErrorBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#18130F',
    },
    primaryErrorBtnText: {
        color: '#F6F1E8',
        fontSize: 14,
        fontWeight: '800',
    },
    backBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#000',
    },
    closeModalBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImageContainer: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
});
