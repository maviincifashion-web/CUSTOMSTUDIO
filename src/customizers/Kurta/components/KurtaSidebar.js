import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { KURTA_STYLE_OPTIONS } from '../../../Data/styleData';
import { DUMMY_FABRICS } from '../../../Data/dummyData';

// Ye component 4 cheezein as a prop lega:
// 1. activePanel (Kahan khula hai: 'Fabric' ya 'Style')
// 2. selections (User ne abhi kya-kya chun rakha hai)
// 3. onStyleChange (Jab user koi button dabaye toh kya ho)
// 4. onFabricSelect (Jab user fabric chune toh kya ho)

export default function KurtaSidebar({ activePanel, selections, onStyleChange, selectedFabric, onFabricSelect }) {
    
    // --- 1. RENDER FABRIC LIST ---
    if (activePanel === 'Fabric') {
        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                {DUMMY_FABRICS.map((fabric) => (
                    <TouchableOpacity 
                        key={fabric.fabricID} 
                        style={[styles.fabricCard, selectedFabric.fabricID === fabric.fabricID && styles.activeCard]}
                        onPress={() => onFabricSelect(fabric)}
                    >
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

    // --- 2. RENDER STYLE OPTIONS ---
    if (activePanel === 'Style') {
        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 }}>
                {KURTA_STYLE_OPTIONS.map((section, idx) => {
                    
                    // DEPENDENCY LOGIC (Hide if dependency not met)
                    if (section.dependency) {
                        const depValue = selections[section.dependency.key];
                        if (section.dependency.notValue && depValue === section.dependency.notValue) return null;
                        if (section.dependency.value && depValue !== section.dependency.value) return null;
                    }

                    return (
                        <View key={idx} style={{ marginBottom: 25 }}>
                            {/* Section Heading */}
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            
                            {/* Options Buttons */}
                            <View style={styles.optionRow}>
                                {section.options.map((opt) => {
                                    const IconComponent = opt.icon;
                                    const isActive = selections[section.key] === opt.value;

                                    return (
                                        <View key={opt.value} style={{ width: '48%', marginBottom: 15 }}>
                                            <TouchableOpacity
                                                style={[styles.styleOption, isActive && styles.activeStyleOption]}
                                                onPress={() => onStyleChange(section.key, opt.value)}
                                            >
                                                {IconComponent && (
                                                    <IconComponent color={isActive ? '#ffffff' : '#14213D'} size={50} />
                                                )}
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

    // --- 3. RENDER EMBROIDERY (Coming Soon) ---
    if (activePanel === 'Embroidery') {
        return (
            <View style={{ padding: 20 }}>
                <Text style={styles.sectionTitle}>Embroidery Designs</Text>
                <Text style={{color: '#666'}}>Premium handwork and machine designs will appear here.</Text>
            </View>
        );
    }

    return null; // Agar koi panel open nahi hai toh kuch mat dikhao
}

const styles = StyleSheet.create({
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between', paddingBottom: 20 },
    fabricCard: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderRadius: 18, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(200, 200, 200, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
    activeCard: { borderColor: '#14213D', shadowColor: '#14213D', shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
    fabricImage: { width: '100%', height: 100, backgroundColor: '#ddd' },
    fabricInfo: { padding: 10 },
    fabricName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    fabricBrand: { fontSize: 10, color: '#888', marginTop: 2 },
    
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    styleOption: { width: '100%', aspectRatio: 1, backgroundColor: 'rgba(245, 245, 245, 0.8)', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    activeStyleOption: { backgroundColor: '#14213D' },
    optionLabel: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 8 },
});