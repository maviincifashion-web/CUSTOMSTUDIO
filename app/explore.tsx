import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    ActivityIndicator,
    Pressable,
    LayoutAnimation,
    Platform,
    UIManager,
    Modal,
    FlatList,
    Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { fetchAllPresets } from '../src/firebase/TrendingApi';
import { CustomTheme } from '../constants/theme';
import { ProductCard } from '../components/ProductCard';

// Removed CATEGORIES constant as per user request

const FocusableButton = ({ style, focusStyle, children, onPress, ...props }: any) => {
    return (
        <Pressable
            focusable={true}
            accessible={true}
            accessibilityRole="button"
            onPress={onPress}
            style={({ focused, pressed }: any) => [
                style,
                focused && (focusStyle || styles.focusRing),
                pressed && styles.pressed,
            ]}
            {...props}
        >
            {children}
        </Pressable>
    );
};

export default function ExploreScreen() {
    const { normalize, width, isMobile, isTablet } = useResponsive();
    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    // Filter States
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedItemType, setSelectedItemType] = useState('ALL');
    const [selectedCustomStatus, setSelectedCustomStatus] = useState('ALL');
    const [selectedOccasion, setSelectedOccasion] = useState('ALL');
    
    // Modal State
    const [isSmartFilterVisible, setIsSmartFilterVisible] = useState(false);

    const CATEGORY_OPTIONS = ['ALL', 'SUIT', 'KURTA', 'FORMAL'];
    const TYPE_OPTIONS = ['ALL', 'SINGLE ITEM', 'SET'];
    const STATUS_OPTIONS = ['ALL', 'CUSTOMIZABLE', 'STANDARD'];
    const OCCASION_OPTIONS = [
        'ALL', 'HALDI', 'MEHENDI', 'SANGEET', 'WEDDING', 
        'RECEPTION', 'EID', 'DIWALI', 'PARTY', 'CASUAL', 
        'FORMAL', 'INTERVIEW'
    ];

    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterResults();
    }, [searchQuery, products, selectedCategory, selectedItemType, selectedCustomStatus]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await fetchAllPresets();
        setProducts(data);
        setLoading(false);
    };

    const filterResults = () => {
        let filtered = products;
        
        // 1. Category Filter
        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter(p => p.category === selectedCategory.toLowerCase());
        }

        // 2. Item Type Filter
        if (selectedItemType !== 'ALL') {
            const type = selectedItemType === 'SET' ? 'set' : 'single';
            filtered = filtered.filter(p => p.itemType === type);
        }

        // 3. Custom Status Filter
        if (selectedCustomStatus !== 'ALL') {
            const isCustom = selectedCustomStatus === 'CUSTOMIZABLE';
            filtered = filtered.filter(p => p.customize === isCustom);
        }

        // 4. Occasion Filter
        if (selectedOccasion !== 'ALL') {
            filtered = filtered.filter(p => 
                (p.occasion || '').toLowerCase().includes(selectedOccasion.toLowerCase())
            );
        }

        // 5. Search Query
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Row 1: Page Header */}
            <View style={styles.pageHeader}>
                <TouchableOpacity 
                    style={styles.headerBackBtn} 
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Explore Designs</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Row 2: Interaction Row (Smart Filter + Search) */}
            <View style={styles.interactionRow}>
                <View style={styles.smartInteractionContainer}>
                    <TouchableOpacity 
                        style={styles.smartFilterBtn}
                        onPress={() => setIsSmartFilterVisible(true)}
                    >
                        <Ionicons name="options-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.smartFilterText}>Smart Filter</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.smartSearchContainer}>
                        <Ionicons name="search-outline" size={18} color="#64748b" />
                        <TextInput
                            style={styles.smartSearchInput}
                            placeholder="Search styles..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <Modal
                transparent={true}
                visible={isSmartFilterVisible}
                animationType="slide"
                onRequestClose={() => setIsSmartFilterVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable 
                        style={StyleSheet.absoluteFill} 
                        onPress={() => setIsSmartFilterVisible(false)} 
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Smart Filters</Text>
                            <TouchableOpacity onPress={() => setIsSmartFilterVisible(false)}>
                                <Ionicons name="close" size={24} color="#0f172a" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.filterScrollView}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Category</Text>
                                <View style={styles.filterOptionsRow}>
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <TouchableOpacity 
                                            key={option}
                                            style={[styles.chip, selectedCategory === option && styles.chipSelected]}
                                            onPress={() => setSelectedCategory(option)}
                                        >
                                            <Text style={[styles.chipText, selectedCategory === option && styles.chipTextSelected]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Item Type</Text>
                                <View style={styles.filterOptionsRow}>
                                    {TYPE_OPTIONS.map((option) => (
                                        <TouchableOpacity 
                                            key={option}
                                            style={[styles.chip, selectedItemType === option && styles.chipSelected]}
                                            onPress={() => setSelectedItemType(option)}
                                        >
                                            <Text style={[styles.chipText, selectedItemType === option && styles.chipTextSelected]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Status</Text>
                                <View style={styles.filterOptionsRow}>
                                    {STATUS_OPTIONS.map((option) => (
                                        <TouchableOpacity 
                                            key={option}
                                            style={[styles.chip, selectedCustomStatus === option && styles.chipSelected]}
                                            onPress={() => setSelectedCustomStatus(option)}
                                        >
                                            <Text style={[styles.chipText, selectedCustomStatus === option && styles.chipTextSelected]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Occasion</Text>
                                <View style={styles.filterOptionsRow}>
                                    {OCCASION_OPTIONS.map((option) => (
                                        <TouchableOpacity 
                                            key={option}
                                            style={[styles.chip, selectedOccasion === option && styles.chipSelected]}
                                            onPress={() => setSelectedOccasion(option)}
                                        >
                                            <Text style={[styles.chipText, selectedOccasion === option && styles.chipTextSelected]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.resetAllBtn}
                                onPress={() => {
                                    setSelectedCategory('ALL');
                                    setSelectedItemType('ALL');
                                    setSelectedCustomStatus('ALL');
                                    setSelectedOccasion('ALL');
                                }}
                            >
                                <Text style={styles.resetAllText}>Reset All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.applyBtn}
                                onPress={() => setIsSmartFilterVisible(false)}
                            >
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Results Grid */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={CustomTheme.accentGold} />
                    <Text style={styles.loaderText}>Loading Catalog...</Text>
                </View>
            ) : (
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.gridContainer}
                >
                    {filteredProducts.length > 0 ? (
                        <View style={styles.grid}>
                            {filteredProducts.map((product) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    cardWidth="48%" 
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={60} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No Results Found</Text>
                            <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
                            <TouchableOpacity 
                                style={styles.resetBtn}
                                onPress={() => { setSearchQuery(''); }}
                            >
                                <Text style={styles.resetBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    pageTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 0.5,
    },
    headerBackBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    interactionRow: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    smartInteractionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    smartFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18130F',
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    smartFilterText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    smartSearchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 48,
    },
    smartSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    gridContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '85%',
        minHeight: '50%',
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
    },
    filterScrollView: {
        flex: 1,
        padding: 20,
    },
    filterSection: {
        marginBottom: 32,
    },
    filterSectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#18130F',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    filterOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    chip: {
        width: '47%',
        margin: '1.5%',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    chipSelected: {
        backgroundColor: '#18130F',
        borderColor: '#18130F',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.4,
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    modalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    applyBtn: {
        flex: 2,
        backgroundColor: '#18130F',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    resetAllBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    resetAllText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
    },
    resetBtn: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#0f172a',
        borderRadius: 12,
    },
    resetBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    focusRing: {
        borderWidth: 4,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
});
