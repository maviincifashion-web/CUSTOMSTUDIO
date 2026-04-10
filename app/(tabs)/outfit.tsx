import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOutfit, AVAILABLE_ITEMS, OutfitItemId } from '../../src/context/OutfitContext';

const ITEM_ICONS: Record<OutfitItemId, React.ComponentProps<typeof MaterialIcons>['name']> = {
    kurta: 'checkroom',
    pajama: 'hotel',
    coat: 'layers',
    sadri: 'verified',
};

export default function OutfitScreen() {
    const { selectedItems, toggleItem } = useOutfit();

    const handleProceed = () => {
        router.push('/kurta');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Build Your Outfit</Text>
                <Text style={styles.subText}>Choose which pieces you want to customize</Text>
            </View>

            <View style={styles.itemsContainer}>
                {(Object.keys(AVAILABLE_ITEMS) as OutfitItemId[]).map((id) => {
                    const item = AVAILABLE_ITEMS[id];
                    const isSelected = selectedItems.includes(id);
                    const iconName = ITEM_ICONS[id];

                    return (
                        <TouchableOpacity
                            key={id}
                            style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                            onPress={() => toggleItem(id)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.itemTopRow}>
                                <Text style={[styles.itemName, isSelected && styles.itemTextSelected]}>{item.name}</Text>
                                <View style={[styles.badge, isSelected ? styles.badgeSelected : styles.badgeUnselected]}>
                                    <MaterialIcons
                                        name={isSelected ? 'check-circle' : 'add-circle-outline'}
                                        size={22}
                                        color={isSelected ? '#16a34a' : '#6b7280'}
                                    />
                                </View>
                            </View>

                            <View style={styles.previewArea}>
                                <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                                    <MaterialIcons name={iconName} size={40} color={isSelected ? '#1d4ed8' : '#9ca3af'} />
                                </View>
                            </View>

                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.proceedButton} onPress={handleProceed} activeOpacity={0.85}>
                    <Text style={styles.proceedButtonText}>Proceed to Customize</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827' },
    subText: { fontSize: 15, color: '#6b7280', marginTop: 6, lineHeight: 22 },

    itemsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    itemCard: {
        width: '48%',
        minHeight: 180,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 16,
        padding: 18,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 5,
    },
    itemCardSelected: {
        borderWidth: 2,
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    itemTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    itemTextSelected: { color: '#1d4ed8' },

    badge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeSelected: {
        backgroundColor: '#d1fae5',
    },
    badgeUnselected: {
        backgroundColor: '#f3f4f6',
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
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapperSelected: {
        backgroundColor: '#dbeafe',
    },

    footer: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderTopWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    totalText: { fontSize: 17, fontWeight: '700', color: '#111827' },
    totalPrice: { fontSize: 20, fontWeight: '800', color: '#1d4ed8' },
    proceedButton: {
        backgroundColor: '#1d4ed8',
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    proceedButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});