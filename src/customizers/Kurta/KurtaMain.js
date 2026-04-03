import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Animated, Easing, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';

import { DUMMY_FABRICS, INITIAL_SELECTION } from '../../Data/dummyData';
import { KURTA_STYLE_OPTIONS } from '../../Data/styleData';

// --- YAHAN MODEL COMPONENT IMPORT HUA HAI ---
import KurtaModel from './components/KurtaModel';
import KurtaFolded from './components/KurtaFolded';
import FullScreenCarousel from '../../../components/FullScreenCarousel';

import { IconFabric, IconStyle, IconEmbroidery, IconExtras } from '../../icons/ExtraIcons';

const { width } = Dimensions.get('window');

export default function KurtaMain() {
    const [activePanel, setActivePanel] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // STATE MANAGEMENT
    const [selectedFabric, setSelectedFabric] = useState(DUMMY_FABRICS ? DUMMY_FABRICS[0] : {});
    const [selections, setSelections] = useState(INITIAL_SELECTION || {
        bottomCut: 'R', length: 'K', placketStyle: 'NS', pocketQty: '00', pocketShape: 'R', flapYes: '0', flapShape: 'R', epaulette: '0', collar: 'CM', sleeve: 'SN', cuffStyle: 'US1'
    });

    const slideAnim = useRef(new Animated.Value(-width)).current;

    const togglePanel = (panelName) => {
        if (activePanel === panelName && isPanelOpen) closePanel();
        else {
            setActivePanel(panelName); setIsPanelOpen(true);
            Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
        }
    };

    const closePanel = () => {
        Animated.timing(slideAnim, { toValue: -width, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
            setIsPanelOpen(false); setActivePanel(null);
        });
    };

    const handleStyleChange = (type, value) => {
        setSelections(prev => ({ ...prev, [type]: value }));
    };

    const renderPanelContent = () => {
        if (activePanel === 'Fabric') {
            if (!DUMMY_FABRICS) return <Text>Loading Fabrics...</Text>;

            return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                    {DUMMY_FABRICS.map((fabric) => (
                        <TouchableOpacity key={fabric.fabricID} style={[styles.fabricCard, selectedFabric?.fabricID === fabric.fabricID && styles.fabricCardActive]} onPress={() => { setSelectedFabric(fabric); closePanel(); }}>
                            <Image source={fabric.thumbnail} style={styles.fabricImage} />
                            <View style={styles.fabricInfo}>
                                <Text style={styles.fabricName}>{fabric.name}</Text>
                                <Text style={styles.fabricBrand}>{fabric.brand}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        if (activePanel === 'Style') {
            if (!KURTA_STYLE_OPTIONS) return <Text>Loading Styles...</Text>;

            return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 }}>
                    {KURTA_STYLE_OPTIONS.map((section, idx) => {
                        if (section.dependency) {
                            const depValue = selections[section.dependency.key];
                            if (section.dependency.notValue && depValue === section.dependency.notValue) return null;
                            if (section.dependency.value && depValue !== section.dependency.value) return null;
                        }

                        return (
                            <View key={idx} style={{ marginBottom: 25 }}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <View style={styles.optionRow}>
                                    {section.options.map((opt) => {
                                        const IconComponent = opt.icon?.default || opt.icon;
                                        const isActive = selections[section.key] === opt.value;
                                        return (
                                            <View key={opt.value} style={{ width: '48%', marginBottom: 15 }}>
                                                <TouchableOpacity style={[styles.styleOption, isActive && styles.activeStyleOption]} onPress={() => handleStyleChange(section.key, opt.value)}>
                                                    {IconComponent ? <IconComponent size={65} /> : <Text>Icon</Text>}
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
            );
        }
        return <Text style={styles.panelContent}>Select a category to customize.</Text>;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>←</Text></TouchableOpacity>
                <Text style={styles.brandText}>MAVIINCI</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* --- LAYER 1: 3D MODEL ENGINE --- */}
            <View style={styles.modelContainer}>
                <FullScreenCarousel
                    data={[
                        <View key="full" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                            <KurtaModel selections={selections} selectedFabric={selectedFabric} />
                            <View style={[styles.previewLabel, { top: 60, left: 20 }]}>
                                <Text style={styles.previewLabelText}>Full Body</Text>
                            </View>
                        </View>,
                        <View key="folded" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                            <KurtaFolded selections={selections} selectedFabric={selectedFabric} />
                            <View style={[styles.previewLabel, { top: 60, left: 20 }]}>
                                <Text style={styles.previewLabelText}>Folded View</Text>
                            </View>
                        </View>
                    ]}
                />
            </View>

            <View style={styles.rightMenu}>
                {[IconFabric, IconStyle, IconEmbroidery, IconExtras].map((IconComponent, index) => {
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
            </View>

            {isPanelOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closePanel} />}

            <Animated.View style={[styles.sidePanel, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Select {activePanel}</Text>
                    <TouchableOpacity onPress={closePanel}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.panelContentArea}>{renderPanelContent()}</View>
            </Animated.View>

            <View style={styles.bottomBar}>
                <View style={styles.priceContainer}>
                    <Text style={styles.productName}>Your custom kurta set</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.price}>₹ {(selectedFabric?.price || 0) + 4500}</Text>
                        <Text style={styles.discount}> Base + Fabric</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => alert('Measurements Screen!')}><Text style={styles.checkoutText}>Lets Dressup {'>'}</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E5e5e5' },
    modelContainer: { flex: 1, zIndex: 1, position: 'relative', marginTop: -60 },
    previewLabel: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(20,33,61,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    previewLabelText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
    backButton: { padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    backText: { fontSize: 18, fontWeight: 'bold', color: '#14213D' },
    brandText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: '#14213D' },
    rightMenu: { position: 'absolute', right: 20, top: '25%', zIndex: 100, alignItems: 'center' },
    iconButton: { width: 60, height: 60, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
    iconButtonActive: { backgroundColor: '#14213D', shadowColor: '#14213D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
    iconText: { fontSize: 11, color: '#14213D', fontWeight: 'bold', textAlign: 'center' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 20 },
    sidePanel: { position: 'absolute', left: 0, top: 0, bottom: 90, width: width * 0.6, backgroundColor: 'rgba(249, 249, 249, 0.2)', zIndex: 5000, elevation: 5000, paddingTop: 60, shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15, borderTopRightRadius: 2, borderBottomRightRadius: 2, overflow: 'hidden' },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 10, marginTop: -10 },
    panelTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    closeBtn: { fontSize: 24, color: '#999', padding: 10 },
    panelContentArea: { flex: 1 },
    panelContent: { fontSize: 16, color: '#666', paddingHorizontal: 20 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between', paddingBottom: 20 },
    fabricCard: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 18, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(200, 200, 200, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
    fabricCardActive: { borderColor: '#14213D', shadowColor: '#14213D', shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
    fabricImage: { width: '100%', height: 100, backgroundColor: '#ddd' },
    fabricInfo: { padding: 10 },
    fabricName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    fabricBrand: { fontSize: 10, color: '#888', marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    styleOption: { width: '100%', aspectRatio: .8, backgroundColor: 'rgba(245, 245, 245, 0.8)', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    activeStyleOption: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
    optionLabel: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 8 },
    bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 90, backgroundColor: 'rgba(255, 255, 255, 0.85)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderTopWidth: 1, borderColor: 'rgba(230, 230, 230, 0.5)', zIndex: 40 },
    priceContainer: { justifyContent: 'center' },
    productName: { fontSize: 13, color: '#555', marginBottom: 2 },
    price: { fontSize: 22, fontWeight: '900', color: '#14213D' },
    discount: { fontSize: 12, color: '#666', fontWeight: 'bold' },
    checkoutBtn: { backgroundColor: '#14213D', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 40, shadowColor: '#14213D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});