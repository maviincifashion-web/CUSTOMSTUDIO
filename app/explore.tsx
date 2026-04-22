import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { fetchAllPresets } from '../src/firebase/TrendingApi';
import { CustomTheme } from '../constants/theme';

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
    
    // Modal State
    const [activeModal, setActiveModal] = useState<null | 'CATEGORY' | 'TYPE' | 'STATUS'>(null);

    const CATEGORY_OPTIONS = ['ALL', 'SUIT', 'KURTA', 'FORMAL'];
    const TYPE_OPTIONS = ['ALL', 'SINGLE ITEM', 'SET'];
    const STATUS_OPTIONS = ['ALL', 'CUSTOMIZABLE', 'STANDARD'];

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

        // 4. Search Query
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

            {/* Row 2: Interaction Row (Filters + Search) */}
            <View style={styles.interactionRow}>
                {!isSearchFocused ? (
                    <View style={styles.combinedRow}>
                        <View style={styles.filtersGroup}>
                            <TouchableOpacity 
                                style={styles.smallFilterBtn}
                                onPress={() => setActiveModal('CATEGORY')}
                            >
                                <Text 
                                    style={styles.smallFilterText} 
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.8}
                                >
                                    {selectedCategory}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#64748b" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.smallFilterBtn}
                                onPress={() => setActiveModal('TYPE')}
                            >
                                <Text 
                                    style={styles.smallFilterText} 
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.8}
                                >
                                    {selectedItemType}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#64748b" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.smallFilterBtn}
                                onPress={() => setActiveModal('STATUS')}
                            >
                                <Text 
                                    style={styles.smallFilterText} 
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.8}
                                >
                                    {selectedCustomStatus}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.searchInitiator}
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setIsSearchFocused(true);
                            }}
                        >
                            <Ionicons name="search-outline" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.searchContainerFull}>
                        <View style={styles.searchInnerMain}>
                            <Ionicons name="search-outline" size={20} color="#64748b" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInputField}
                                placeholder="Search for styles..."
                                placeholderTextColor="#94a3b8"
                                autoFocus={true}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <TouchableOpacity 
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setIsSearchFocused(false);
                                    setSearchQuery('');
                                }}
                            >
                                <Ionicons name="close-circle" size={22} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Filter Selection Modal */}
            <Modal
                transparent={true}
                visible={!!activeModal}
                animationType="slide"
                onRequestClose={() => setActiveModal(null)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setActiveModal(null)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {activeModal === 'CATEGORY' ? 'Select Category' : 
                                 activeModal === 'TYPE' ? 'Select Item Type' : 'Select Status'}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)}>
                                <Ionicons name="close" size={24} color="#0f172a" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.optionsList}>
                            {(activeModal === 'CATEGORY' ? CATEGORY_OPTIONS : 
                              activeModal === 'TYPE' ? TYPE_OPTIONS : STATUS_OPTIONS).map((option) => {
                                const isSelected = (activeModal === 'CATEGORY' && selectedCategory === option) ||
                                                 (activeModal === 'TYPE' && selectedItemType === option) ||
                                                 (activeModal === 'STATUS' && selectedCustomStatus === option);
                                
                                return (
                                    <TouchableOpacity 
                                        key={option}
                                        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                                        onPress={() => {
                                            if (activeModal === 'CATEGORY') setSelectedCategory(option);
                                            if (activeModal === 'TYPE') setSelectedItemType(option);
                                            if (activeModal === 'STATUS') setSelectedCustomStatus(option);
                                            setActiveModal(null);
                                        }}
                                    >
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                            {option}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={CustomTheme.accentGold} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </Pressable>
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
                            {filteredProducts.map(product => (
                                <TouchableOpacity 
                                    key={product.id}
                                    style={styles.productCard}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(product.category === 'kurta' ? '/kurta' : '/outfit')}
                                >
                                    <View style={styles.imageContainer}>
                                        <Image 
                                            source={product.image ? { uri: product.image } : require('../assets/images/hero_banner.jpg')} 
                                            style={styles.productImage} 
                                        />
                                        {product.discount > 0 && (
                                            <View style={styles.discountBadge}>
                                                <Text style={styles.discountText}>{product.discount}% OFF</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.productContent}>
                                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                        <View style={styles.productFooter}>
                                            <Text style={styles.productPrice}>₹{product.price}</Text>
                                            <View style={styles.customizeBtn}>
                                                <Text style={styles.customizeBtnText}>
                                                    {product.customize ? 'CUSTOMIZE' : 'BUY'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={60} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No Results Found</Text>
                            <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
                            <TouchableOpacity 
                                style={styles.resetBtn}
                                onPress={() => { setSearchQuery(''); setIsSearchFocused(false); }}
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
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    combinedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    filtersGroup: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
    },
     smallFilterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 2,
    },
    smallFilterText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#334155',
    },
    searchInitiator: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainerFull: {
        width: '100%',
    },
    searchInnerMain: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInputField: {
        flex: 1,
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '600',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
    },
    optionsList: {
        padding: 16,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    optionItemSelected: {
        backgroundColor: '#f8fafc',
    },
    optionText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'capitalize',
    },
    optionTextSelected: {
        color: '#0f172a',
    },
    productCard: {
        width: '48%',
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        height: 180,
        backgroundColor: '#f8fafc',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: CustomTheme.accentGold,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    discountText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
    },
    productContent: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    productFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    productPrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1e293b',
    },
    customizeBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    customizeBtnText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0f172a',
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
