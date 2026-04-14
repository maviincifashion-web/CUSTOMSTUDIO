import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOutfit, AVAILABLE_ITEMS, OutfitItemId } from '../../src/context/OutfitContext';
import { useResponsive } from '../../hooks/useResponsive';
import { BlurView } from 'expo-blur';
import { CustomTheme } from '../../constants/theme';

const ITEM_ICONS: Record<OutfitItemId, React.ComponentProps<typeof MaterialIcons>['name']> = {
    kurta: 'checkroom',
    pajama: 'hotel',
    coat: 'layers',
    sadri: 'verified',
};

export default function OutfitScreen() {
    const { selectedItems, toggleItem } = useOutfit();
    const { normalize, isMobile, isTablet, isDesktop } = useResponsive();
    const isLargeScreen = isTablet || isDesktop;

    // Yahan aap apne screens ke hisab se Card ka width aur layout set kar sakte hain
    const getDynamicCardStyle = () => {
        // # MOBILE SCREEN
        if (isMobile) {
            return {
                width: '48%',
                minHeight: 180,
                padding: 18
            };
        }
        // # TABLET SCREEN
        if (isTablet) {
            return {
                width: '48%',
                minHeight: normalize(200),
                padding: normalize(20)
            };
        }
        // # TV SCREEN (Commercial Display)
        if (isDesktop) {
            return {
                width: '48%', // Aap chahein to ise '23%' kar sakte hain agar ek row mein 4 items chahiye
                minHeight: normalize(240),
                padding: normalize(24)
            };
        }
        return {};
    };

    const dynamicCardStyle = getDynamicCardStyle();

    const handleProceed = () => {
        router.push('/kurta');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, isLargeScreen && { paddingTop: 40, paddingBottom: 30 }]}>
                <Text style={[styles.title, { fontSize: normalize(28) }]}>Build Your Outfit</Text>
                <Text style={[styles.subText, { fontSize: normalize(15) }]}>Choose which pieces you want to customize</Text>
            </View>

            <View style={styles.itemsContainer}>
                {(Object.keys(AVAILABLE_ITEMS) as OutfitItemId[]).map((id) => {
                    const item = AVAILABLE_ITEMS[id];
                    const isSelected = selectedItems.includes(id);
                    const iconName = ITEM_ICONS[id];

                    return (
                        <TouchableOpacity
                            key={id}
                            style={[
                                styles.itemCard,
                                isSelected && styles.itemCardSelected,
                                dynamicCardStyle
                            ]}
                            onPress={() => toggleItem(id)}
                            activeOpacity={0.85}
                        >
                            <BlurView tint="light" intensity={60} style={StyleSheet.absoluteFill} />
                            <View style={styles.itemTopRow}>
                                <Text style={[styles.itemName, isSelected && styles.itemTextSelected, { fontSize: normalize(16) }]}>{item.name}</Text>
                                <View style={[
                                    styles.badge,
                                    isSelected ? styles.badgeSelected : styles.badgeUnselected,
                                    { width: normalize(32), height: normalize(32), borderRadius: normalize(16) }
                                ]}>
                                    <MaterialIcons
                                        name={isSelected ? 'check-circle' : 'add-circle-outline'}
                                        size={normalize(22)}
                                        color={isSelected ? '#000000' : '#A1A1AA'}
                                    />
                                </View>
                            </View>

                            <View style={styles.previewArea}>
                                <View style={[
                                    styles.iconWrapper,
                                    isSelected && styles.iconWrapperSelected,
                                    { width: normalize(78), height: normalize(78), borderRadius: normalize(22) }
                                ]}>
                                    <MaterialIcons name={iconName} size={normalize(40)} color={isSelected ? CustomTheme.accentGold : CustomTheme.textSecondary} />
                                </View>
                            </View>

                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={[styles.footer, isLargeScreen && { paddingVertical: 24 }]}>
                <TouchableOpacity style={[
                    styles.proceedButton,
                    isLargeScreen && { paddingVertical: 20, borderRadius: 18 }
                ]} onPress={handleProceed} activeOpacity={0.85}>
                    <Text style={[styles.proceedButtonText, { fontSize: normalize(16) }]}>Proceed to Customize</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CustomTheme.backgroundPrimary },
    header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', color: CustomTheme.textPrimary },
    subText: { fontSize: 15, color: CustomTheme.textSecondary, marginTop: 6, lineHeight: 22 },

    itemsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    // Default itemCard style, isko upar dynamicCardStyle se overwrite kiya jayega
    itemCard: {
        width: '48%',
        minHeight: 180,
        backgroundColor: CustomTheme.glassBgLight,
        borderRadius: 20,
        marginBottom: 16,
        padding: 18,
        position: 'relative',
        borderWidth: 1,
        borderColor: CustomTheme.glassBorderHeavy,
        overflow: 'hidden',
        shadowColor: CustomTheme.shadowDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 5,
    },
    itemCardSelected: {
        borderColor: CustomTheme.accentGold,
        backgroundColor: 'rgba(252, 157, 3, 0.1)',
        shadowColor: CustomTheme.accentGold,
        shadowOpacity: 0.2,
    },
    itemTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: { fontSize: 16, fontWeight: '700', color: CustomTheme.textPrimary, zIndex: 2 },
    itemTextSelected: { color: CustomTheme.accentGold },

    badge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
    },
    badgeSelected: {
        backgroundColor: CustomTheme.accentGold,
    },
    badgeUnselected: {
        backgroundColor: CustomTheme.glassBgMedium,
    },

    previewArea: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        flex: 1,
    },
    iconWrapper: {
        width: 78,
        height: 78,
        borderRadius: 22,
        backgroundColor: CustomTheme.glassBgLight,
        borderWidth: 1,
        borderColor: CustomTheme.glassBorderHeavy,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapperSelected: {
        borderColor: CustomTheme.accentGold,
        backgroundColor: 'rgba(252, 157, 3, 0.15)',
    },

    footer: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderTopWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        backgroundColor: '#ffffff',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    totalText: { fontSize: 17, fontWeight: '700', color: CustomTheme.textPrimary },
    totalPrice: { fontSize: 20, fontWeight: '800', color: CustomTheme.accentGold },
    proceedButton: {
        backgroundColor: CustomTheme.accentGold,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    proceedButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
});