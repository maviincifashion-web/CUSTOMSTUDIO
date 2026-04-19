import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { CustomTheme } from '../../../../constants/theme';
import { getFirestoreDb } from '../../../firebase/config';
import { fetchEmbroideryUploadedCollectionsForStyleId } from '../../../firebase/catalogApi';

/**
 * Summary-style overlay: same **uploaded collections** as website admin (`kurta_collections`, etc. + `values[]`).
 */
export default function EmbroideryPreviewModal({ visible, onClose, embroidery, panelMode, onApply, selectedCollectionId }) {
    const [designCatalog, setDesignCatalog] = useState([]);
    const [designsLoading, setDesignsLoading] = useState(false);

    useEffect(() => {
        if (!visible || !embroidery?.id) {
            setDesignCatalog([]);
            setDesignsLoading(false);
            return;
        }
        let cancelled = false;
        setDesignsLoading(true);
        setDesignCatalog([]);
        (async () => {
            try {
                const db = getFirestoreDb();
                if (!db) {
                    if (!cancelled) setDesignsLoading(false);
                    return;
                }
                const list = await fetchEmbroideryUploadedCollectionsForStyleId(db, embroidery.id, panelMode);
                if (!cancelled) setDesignCatalog(Array.isArray(list) ? list : []);
            } catch {
                if (!cancelled) setDesignCatalog([]);
            } finally {
                if (!cancelled) setDesignsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [visible, embroidery?.id, panelMode]);

    const heroSource = useMemo(() => {
        if (!embroidery) return null;
        if (panelMode === 'Sadri') {
            return embroidery.profileImageSadri || embroidery.profileImage || null;
        }
        if (panelMode === 'Kurta') {
            return embroidery.profileImageKurta || embroidery.profileImage || null;
        }
        return embroidery.profileImage || embroidery.profileImageSadri || null;
    }, [embroidery, panelMode]);

    if (!visible || !embroidery) return null;

    const hasDesignCards = designCatalog.length > 0;
    const applyCollection = (collection) => {
        if (typeof onApply === 'function' && embroidery?.id && collection) {
            onApply(collection, embroidery, panelMode);
        }
        onClose?.();
    };

    return (
        <View style={styles.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
            <View style={styles.sheet}>
                <View style={styles.header}>
                    <View style={styles.headerTextCol}>
                        <Text style={styles.headerTitle} numberOfLines={2}>
                            {embroidery.name || embroidery.id}
                        </Text>
                        {!designsLoading && hasDesignCards ? (
                            <Text style={styles.headerBadge}>
                                {designCatalog.length} collection{designCatalog.length === 1 ? '' : 's'}
                            </Text>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={onClose} hitSlop={12}>
                        <Text style={styles.closeBtn}>×</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
                    {designsLoading ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color={CustomTheme.accentGold} />
                            <Text style={styles.loadingText}>Loading collection…</Text>
                        </View>
                    ) : null}

                    {hasDesignCards ? (
                        <>
                            <Text style={styles.sectionTitle}>Collection</Text>
                            <View style={styles.designGrid}>
                                {designCatalog.map((d) => (
                                    <TouchableOpacity
                                        key={`${d.segment}-${d.id}`}
                                        style={[styles.designCard, selectedCollectionId === d.id && styles.designCardSelected]}
                                        activeOpacity={0.86}
                                        onPress={() => applyCollection(d)}
                                    >
                                        <View style={styles.designImageWrap}>
                                            {d.imageUri ? (
                                                <Image
                                                    source={{ uri: d.imageUri }}
                                                    style={styles.designImage}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <View style={[styles.designImage, styles.designImagePlaceholder]}>
                                                    <Text style={styles.designImagePlaceholderText}>No image</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.designTitle} numberOfLines={2}>
                                            {d.name}
                                        </Text>
                                        <Text style={styles.designPrice}>
                                            {d.price > 0
                                                ? `\u20B9${Math.round(d.price).toLocaleString('en-IN')}`
                                                : '—'}
                                        </Text>
                                        <Text style={styles.applyHint}>Tap to apply</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <>
                            {!designsLoading ? (
                                <>
                                    <Text style={styles.sectionTitle}>Style catalog</Text>
                                    {heroSource ? (
                                        <Image source={heroSource} style={styles.hero} resizeMode="contain" />
                                    ) : (
                                        <View style={[styles.hero, styles.heroPlaceholder]}>
                                            <Text style={styles.heroPlaceholderText}>No catalog image</Text>
                                        </View>
                                    )}

                                    {typeof embroidery.price === 'number' || embroidery.price ? (
                                        <Text style={styles.price}>
                                            ₹{Math.round(Number(embroidery.price) || 0).toLocaleString('en-IN')}
                                        </Text>
                                    ) : null}
                                </>
                            ) : null}
                        </>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: CustomTheme.overlayLight,
        zIndex: 9999,
        elevation: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheet: {
        width: '92%',
        maxHeight: '82%',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#dbe3ee',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTextCol: { flex: 1, paddingRight: 12 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: CustomTheme.textBrand,
    },
    headerBadge: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    closeBtn: {
        fontSize: 28,
        color: CustomTheme.accentGold,
        lineHeight: 30,
        paddingHorizontal: 4,
    },
    scroll: {
        maxHeight: 480,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    loadingText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    designGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    designCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 12,
        overflow: 'hidden',
        paddingBottom: 12,
    },
    designCardSelected: {
        borderColor: CustomTheme.accentGold,
        backgroundColor: '#fffdf8',
    },
    designImageWrap: {
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    designImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#f3f4f6',
    },
    designImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    designImagePlaceholderText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94a3b8',
    },
    designTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f172a',
        paddingHorizontal: 10,
        paddingTop: 8,
        minHeight: 36,
    },
    designPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111',
        paddingHorizontal: 10,
        paddingTop: 4,
    },
    applyHint: {
        fontSize: 11,
        fontWeight: '700',
        color: CustomTheme.accentGold,
        paddingHorizontal: 10,
        paddingTop: 6,
    },
    hero: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    heroPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroPlaceholderText: {
        color: '#64748b',
        fontWeight: '600',
    },
    price: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
    },
});
