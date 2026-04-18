import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    Pressable,
    useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomTheme } from '../../../../constants/theme';

function formatInr(n) {
    const v = Number(n);
    const rupee = '₹';
    if (!Number.isFinite(v) || v <= 0) return `${rupee}0`;
    return `${rupee}${Math.round(v).toLocaleString('en-IN')}`;
}

/**
 * Full-screen style picker: Kurta embroidery vs Sadri embroidery collections (admin + dummy).
 */
export default function EmbroideryCollectionModal({
    visible,
    onClose,
    mode,
    items,
    selectedId,
    onSelect,
    embroideryRenders,
}) {
    const { width: winW } = useWindowDimensions();
    const horizontalPad = 20;
    const gap = 10;
    const cols = 3;
    const cellW = Math.floor((winW - horizontalPad * 2 - gap * (cols - 1)) / cols);

    const headerTitle = mode === 'Sadri' ? 'Style · Sadri' : 'Style · Kurta';
    const subtitle =
        mode === 'Sadri'
            ? 'Sadri chest embroidery'
            : 'Kurta embroidery (chest, collar, sleeve)';

    const list = useMemo(() => {
        if (!Array.isArray(items)) return [];
        if (mode === 'Sadri') {
            return items.filter((e) => e?.id && embroideryRenders?.[e.id]?.sadriChestLeft);
        }
        return items.filter((e) => e?.id);
    }, [items, mode, embroideryRenders]);

    const thumbFor = (emb) => {
        if (mode === 'Sadri') {
            return emb.profileImageSadri || emb.profileImage;
        }
        return emb.profileImage;
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.root}>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.headerTitle}>{headerTitle}</Text>
                            <Text style={styles.headerSubtitle}>{subtitle}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                            <MaterialIcons name="close" size={26} color={CustomTheme.textBrand} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPad }]}
                        showsVerticalScrollIndicator
                    >
                        <View style={styles.grid}>
                            <TouchableOpacity
                                style={[
                                    styles.cell,
                                    { width: cellW },
                                    !selectedId && styles.cellSelected,
                                ]}
                                onPress={() => {
                                    onSelect(null);
                                    onClose();
                                }}
                                activeOpacity={0.85}
                            >
                                <View style={styles.imageWrap}>
                                    <View style={[styles.image, styles.placeholder]}>
                                        <Text style={styles.placeholderText}>None</Text>
                                    </View>
                                    {!selectedId ? (
                                        <View style={styles.checkBadge}>
                                            <MaterialIcons name="check" size={16} color="#fff" />
                                        </View>
                                    ) : null}
                                </View>
                                <Text style={styles.price}>{formatInr(0)}</Text>
                                <Text style={styles.caption} numberOfLines={1}>
                                    No embroidery
                                </Text>
                            </TouchableOpacity>

                            {list.map((emb) => {
                                const thumb = thumbFor(emb);
                                const active = selectedId === emb.id;
                                return (
                                    <TouchableOpacity
                                        key={emb.id}
                                        style={[styles.cell, { width: cellW }, active && styles.cellSelected]}
                                        onPress={() => {
                                            onSelect(emb.id);
                                            onClose();
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <View style={styles.imageWrap}>
                                            {thumb ? (
                                                <Image source={thumb} style={styles.image} resizeMode="cover" />
                                            ) : (
                                                <View style={[styles.image, styles.placeholder]} />
                                            )}
                                            {active ? (
                                                <View style={styles.checkBadge}>
                                                    <MaterialIcons name="check" size={16} color="#fff" />
                                                </View>
                                            ) : null}
                                        </View>
                                        <Text style={styles.price}>{formatInr(emb.price)}</Text>
                                        <Text style={styles.caption} numberOfLines={2}>
                                            {emb.name || emb.id}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.doneBar} onPress={onClose} activeOpacity={0.9}>
                        <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        width: '92%',
        maxWidth: 520,
        maxHeight: '88%',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    headerTextWrap: { flex: 1, paddingRight: 8 },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: CustomTheme.textBrand,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: 13,
        color: CustomTheme.textSecondary,
        fontWeight: '500',
    },
    closeBtn: { padding: 4 },
    scroll: { maxHeight: '100%' },
    scrollContent: { paddingBottom: 16, paddingTop: 14 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 14,
    },
    cell: {
        marginBottom: 4,
    },
    cellSelected: {
        opacity: 1,
    },
    imageWrap: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e8e8e8',
        backgroundColor: '#fafafa',
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f3f4f6',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    price: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '800',
        color: '#111',
    },
    caption: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        lineHeight: 14,
    },
    doneBar: {
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: CustomTheme.accentGold,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    doneText: {
        fontSize: 16,
        fontWeight: '800',
        color: CustomTheme.textPrimary,
    },
});
