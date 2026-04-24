import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Image,
    ImageBackground,
    TextInput,
    Animated
} from 'react-native';
import { router } from 'expo-router';
import { useResponsive } from '../../hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';
import HintOverlay from '../../components/HintOverlay';
import { useSharedValue } from 'react-native-reanimated';
import { fetchTrendingPresets } from '../../src/firebase/TrendingApi';
import { TESTIMONIALS_DATA } from '../../src/Data/testimonials';
import SidebarDrawer from '../../components/SidebarDrawer';
import AppLogo from '../../assets/images/bussiness/only logo-01.svg';
import { ProductCard } from '../../components/ProductCard';

const THEME = {
    background: '#0a0a0a',
    cardBg: '#1a1a1a',
    accent: '#ffffff',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    gold: '#D4A843',
};

const CATEGORY_TABS = ['SUIT', 'ETHINICS', 'FORMAL'];

const CATEGORIES_DATA = [
    // SUIT
    { id: '1', title: 'SUIT SET', type: 'SUIT', image: require('../../assets/images/cat_wedding.jpg'), route: '/outfit' },
    { id: '2', title: 'BANDGALA SUIT', type: 'SUIT', image: require('../../assets/images/bandgala_suit.jpg'), route: '/outfit' },
    { id: '3', title: 'BLAZER', type: 'SUIT', image: require('../../assets/images/hero_banner.jpg'), route: '/outfit' },
    { id: '4', title: 'DOUBLE BRESTED', type: 'SUIT', image: require('../../assets/images/double_breasted.jpg'), route: '/outfit' },
    { id: '5', title: '3 PIECE SUIT', type: 'SUIT', image: require('../../assets/images/three_piece_suit.jpg'), route: '/outfit' },
    { id: '17', title: 'VEST COAT', type: 'SUIT', image: require('../../assets/images/vest_coat.jpg'), route: '/outfit' },
    
    // ETHINICS
    { id: '6', title: 'KURTA SET', type: 'ETHINICS', image: require('../../assets/images/cat_wedding.jpg'), route: '/outfit' },
    { id: '7', title: 'KURTA', type: 'ETHINICS', image: require('../../assets/images/cat_kurta.jpg'), route: '/kurta' },
    { id: '8', title: 'PAJAMA', type: 'ETHINICS', image: require('../../assets/images/cat_kurta.jpg'), route: '/kurta' },
    { id: '9', title: 'SADRI', type: 'ETHINICS', image: require('../../assets/images/cat_kurta.jpg'), route: '/kurta' },
    { id: '10', title: 'PATHANI', type: 'ETHINICS', image: require('../../assets/images/pathani.jpg'), route: '/kurta' },
    { id: '11', title: 'KURTA SADRI', type: 'ETHINICS', image: require('../../assets/images/cat_kurta.jpg'), route: '/kurta' },
    { id: '12', title: 'DHOTI KURTA', type: 'ETHINICS', image: require('../../assets/images/dhoti_kurta.jpg'), route: '/kurta' },
    
    // FORMAL
    { id: '13', title: 'PANT SHIRT', type: 'FORMAL', image: require('../../assets/images/hero_shirt.jpg'), route: '/outfit' },
    { id: '14', title: 'SHIRT', type: 'FORMAL', image: require('../../assets/images/hero_shirt.jpg'), route: '/outfit' },
    { id: '15', title: 'PANT', type: 'FORMAL', image: require('../../assets/images/cat_wedding.jpg'), route: '/outfit' },
    { id: '16', title: 'HALF SHIRT', type: 'FORMAL', image: require('../../assets/images/half_shirt.jpg'), route: '/outfit' },
];

const HERO_SLIDES = [
    { id: '1', title: 'LUXURY TAILORING', price: '$299', image: require('../../assets/images/hero_banner.jpg') },
    { id: '2', title: 'DESIGNER KURTAS', price: '$199', image: require('../../assets/images/cat_kurta.jpg') },
    { id: '3', title: 'WEDDING EXCLUSIVE', price: '$499', image: require('../../assets/images/cat_wedding.jpg') },
    { id: '4', title: 'PREMIUM SHIRTS', price: '$149', image: require('../../assets/images/hero_shirt.jpg') },
    { id: '5', title: '3D EXPERIENCE', price: 'FREE', image: require('../../assets/images/how_it_works.jpg') },
];

// D-pad focusable button — uses Pressable for native Android focus support
const FocusableButton = ({ style, focusStyle, children, onPress, ...props }: any) => {
    return (
        <Pressable
            focusable={true}
            accessible={true}
            accessibilityRole="button"
            onPress={onPress}
            style={({ focused, pressed }: any) => [
                style,
                focused && (focusStyle || tvFocusStyles.focusRing),
                pressed && tvFocusStyles.pressed,
            ]}
            {...props}
        >
            {children}
        </Pressable>
    );
};

const tvFocusStyles = StyleSheet.create({
    focusRing: {
        borderWidth: 4,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        elevation: 15,
        transform: [{ scale: 1.08 }],
    },
    focusRingDark: {
        borderWidth: 4,
        borderColor: '#A3E635',
        backgroundColor: 'rgba(163, 230, 53, 0.2)',
        elevation: 15,
        transform: [{ scale: 1.08 }],
    },
    pressed: {
        opacity: 0.7,
        transform: [{ scale: 0.96 }],
    },
});

export default function HomeScreen() {
    const { normalize, width, isMobile, isTablet, isTV } = useResponsive();
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('SUIT');
    const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [showHint, setShowHint] = useState(false);
    const [hintDismissed, setHintDismissed] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Timer ref for inactivity
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const resetInactivityTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (showHint) setShowHint(false);
        
        if (!hintDismissed) {
            timerRef.current = setTimeout(() => {
                setShowHint(true);
            }, 2000);
        }
    };

    useEffect(() => {
        // Auto-redirect to TV screen if running on a TV
        if (isTV) {
            console.log('[Home] TV detected, redirecting to /tv');
            router.replace('/tv');
            return;
        }

        resetInactivityTimer();
        loadTrending();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeIndex, hintDismissed, isTV]);

    const loadTrending = async () => {
        setLoadingTrending(true);
        const data = await fetchTrendingPresets(8);
        setTrendingProducts(data);
        setLoadingTrending(false);
    };

    const handleScroll = (event: any) => {
        resetInactivityTimer();
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / (width || 1));
        setActiveIndex(index);
    };

    const onUserInteraction = () => {
        resetInactivityTimer();
    };

    const filteredCategories = CATEGORIES_DATA.filter(cat => cat.type === activeTab);

    return (
        <View style={styles.container} onTouchStart={onUserInteraction}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                bounces={false}
                onScrollBeginDrag={onUserInteraction}
            >

                {/* 1. Hero Section (Full bleed Carousel) */}
                <View style={styles.heroWrapper}>
                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                    >
                        {HERO_SLIDES.map((slide) => (
                            <ImageBackground 
                                key={slide.id}
                                source={slide.image} 
                                style={[styles.heroImage, { width: width }]}
                            >
                                <View style={styles.heroOverlay}>
                                    {/* Top Bar for Sidebar Trigger (Notifications only now) */}
                                    <View style={styles.topHeader}>
                                        <AppLogo width={normalize(120)} height={normalize(40)} />
                                        <TouchableOpacity style={styles.notificationBtn}>
                                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Hero Content */}
                                    <View style={styles.heroContent}>
                                        <Text style={[styles.heroTitle, { fontSize: normalize(32) }]}>{slide.title}</Text>
                                        <FocusableButton
                                            style={styles.pillButton}
                                            onPress={() => router.push('/outfit')}
                                        >
                                            <Text style={styles.pillText}>STARTING AT {slide.price}</Text>
                                        </FocusableButton>
                                    </View>

                                    {/* Carousel Indicators */}
                                    <View style={styles.carouselIndicators}>
                                        {HERO_SLIDES.map((_, i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.indicator,
                                                    i === activeIndex ? styles.indicatorActive : null
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </ImageBackground>
                        ))}
                    </ScrollView>
                </View>

                {/* TV Mode Button */}
                <FocusableButton
                    style={styles.tvModeBtn}
                    focusStyle={tvFocusStyles.focusRingDark}
                    onPress={() => router.push('/tv')}
                    activeOpacity={0.85}
                    hasTVPreferredFocus={true}
                >
                    <Ionicons name="tv-outline" size={20} color="#000" />
                    <Text style={styles.tvModeBtnText}>TV MODE</Text>
                    <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.4)" />
                </FocusableButton>

                {/* 2. Custom Categories Section */}
                <View style={styles.whiteSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { fontSize: normalize(16) }]}>CUSTOM CATEGORIES</Text>
                        
                        {/* CATEGORY SWITCHER */}
                        <View style={styles.tabSwitcher}>
                            {CATEGORY_TABS.map((tab) => (
                                <FocusableButton 
                                    key={tab} 
                                    onPress={() => setActiveTab(tab)}
                                    style={styles.tabButton}
                                >
                                    <Text style={[
                                        styles.tabText, 
                                        activeTab === tab && styles.tabTextActive
                                    ]}>
                                        {tab}
                                    </Text>
                                    {activeTab === tab && <View style={styles.activeUnderline} />}
                                </FocusableButton>
                            ))}
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                        snapToInterval={isMobile ? width * 0.4 : width * 0.25}
                        decelerationRate="fast"
                    >
                        {filteredCategories.map((item) => (
                            <View key={item.id} style={[styles.categoryCardWrapper, { width: isMobile ? width * 0.35 : isTablet ? width * 0.25 : width * 0.2 }]}>
                                <FocusableButton
                                    style={[styles.categoryVerticalCard, { width: isMobile ? width * 0.35 : isTablet ? width * 0.25 : width * 0.2 }]}
                                    onPress={() => router.push(item.route as any)}
                                >
                                    <Image source={item.image} style={styles.categoryImg} />
                                    <View style={styles.categoryLabelContainer}>
                                        <Text style={styles.categoryLabelText}>{item.title}</Text>
                                    </View>
                                </FocusableButton>
                                <FocusableButton 
                                    style={styles.startDesigningBtn}
                                    onPress={() => router.push(item.route as any)}
                                >
                                    <Text style={styles.startDesigningText}>START DESIGNING</Text>
                                </FocusableButton>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. How It Works - Immersive style */}
                <View style={styles.sectionHeaderDark}>
                    <Text style={[styles.sectionTitleLight, { fontSize: normalize(16) }]}>HOW IT WORKS</Text>
                </View>
                <TouchableOpacity style={styles.videoCard} activeOpacity={0.9}>
                    <ImageBackground
                        source={require('../../assets/images/how_it_works.jpg')}
                        style={styles.videoBackground}
                        imageStyle={{ borderRadius: 15 }}
                    >
                        <View style={styles.playBtnContainer}>
                            <Ionicons name="play" size={28} color="white" />
                        </View>
                    </ImageBackground>
                </TouchableOpacity>

                {/* 4. Trending Designs Section */}
                <View style={styles.trendingSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { fontSize: normalize(16) }]}>TRENDING DESIGNS</Text>
                    </View>

                    {loadingTrending ? (
                        <View style={styles.loaderContainer}>
                            <Text style={styles.loaderText}>Loading Designs...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.trendingGrid}>
                                {trendingProducts.map((product) => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        cardWidth="47%" 
                                    />
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={styles.exploreMoreBtn}
                                onPress={() => router.push('/explore')}
                            >
                                <Text style={styles.exploreMoreText}>EXPLORE MORE</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* 5. Client Experiences Section (Testimonials) */}
                <View style={styles.testimonialSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { fontSize: normalize(16) }]}>CLIENT EXPERIENCES</Text>
                    </View>

                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.testimonialScroll}
                        snapToInterval={isMobile ? width * 0.85 : width * 0.5}
                        decelerationRate="fast"
                    >
                        {TESTIMONIALS_DATA.map((item: any) => (
                            <View key={item.id} style={[styles.testimonialCard, { width: isMobile ? width * 0.82 : isTablet ? width * 0.6 : width * 0.45 }]}>
                                <View style={styles.testimonialHeader}>
                                    <View style={styles.avatarWrapper}>
                                        <Image source={item.image} style={styles.clientAvatar} />
                                        <View style={styles.avatarRing} />
                                    </View>
                                    <View style={styles.starsRow}>
                                        {[...Array(item.rating)].map((_, i) => (
                                            <Ionicons key={i} name="star" size={14} color="#D4A843" />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.testimonialQuote}>"{item.message}"</Text>
                                <View style={styles.clientInfo}>
                                    <View>
                                        <Text style={styles.clientName}>{item.name}</Text>
                                        <Text style={styles.clientLocation}>{item.location}</Text>
                                    </View>
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={12} color="#D4A843" />
                                        <Text style={styles.verifiedText}>Verified</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Bottom Bar (Mocks the one in image) */}
            <View style={styles.bottomNav}>
                <FocusableButton style={styles.navItem} onPress={() => router.push('/')}>
                    <Ionicons name="home" size={24} color={THEME.gold} />
                </FocusableButton>
                <FocusableButton style={styles.navItem}>
                    <Ionicons name="search-outline" size={24} color={THEME.textSecondary} />
                </FocusableButton>
                <FocusableButton style={styles.navItemCentral}>
                    <Text style={styles.navItemTextBold}>NEW</Text>
                </FocusableButton>
                <FocusableButton style={styles.navItem}>
                    <Ionicons name="bag-outline" size={24} color={THEME.textSecondary} />
                </FocusableButton>
                <FocusableButton 
                    style={styles.navItem}
                    onPress={() => setIsSidebarOpen(true)}
                >
                    <Ionicons name="person-outline" size={24} color={THEME.textSecondary} />
                </FocusableButton>
            </View>

            {/* {showHint && !hintDismissed && (
                <HintOverlay 
                    slideIndex={activeIndex} 
                    onDismiss={() => setShowHint(false)}
                    onSkip={() => {
                        setShowHint(false);
                        setHintDismissed(true);
                    }}
                />
            )} */}

            <SidebarDrawer 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    // Hero Styles
    heroWrapper: { height: 600, width: '100%' },
    heroImage: { flex: 1 },
    heroOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'space-between',
        paddingBottom: 20
    },

    // TV Mode Button
    tvModeBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        alignSelf: 'center' as const,
        backgroundColor: '#A3E635',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        marginTop: -24,
        marginBottom: 12,
        zIndex: 10,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    tvModeBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800' as const,
        letterSpacing: 1.5,
    },

    // Top Search Bar
    topBar: { paddingHorizontal: 20, paddingTop: 10 },

    // Hero Content
    heroContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    heroTitle: {
        color: '#fff',
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10
    },
    pillButton: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25
    },
    pillText: { color: '#000', fontWeight: '800', fontSize: 12 },

    // Indicators
    carouselIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    indicatorActive: { width: 30, backgroundColor: '#fff' },

    // Categories Section
    whiteSection: { backgroundColor: '#fff', paddingTop: 20, paddingBottom: 30 },
    sectionHeader: { paddingHorizontal: 20, marginBottom: 15, alignItems: 'flex-start' },
    sectionTitle: { color: '#000', fontWeight: '900', letterSpacing: 1 },
    tabSwitcher: { flexDirection: 'row', marginTop: 10, gap: 20 },
    tabButton: { paddingVertical: 5 },
    tabText: { color: '#888', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
    tabTextActive: { color: '#000' },
    activeUnderline: { height: 2, backgroundColor: '#000', marginTop: 2, width: '100%' },

    categoryScroll: { paddingLeft: 20, gap: 18 },
    categoryCardWrapper: {},
    categoryVerticalCard: { height: 200, backgroundColor: '#f5f5f5', borderRadius: 0 },
    categoryImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    categoryLabelContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        alignItems: 'center'
    },
    categoryLabelText: { color: '#fff', fontWeight: '700', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4 },

    startDesigningBtn: {
        marginTop: 10,
        backgroundColor: '#000',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    startDesigningText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // Dark Section (Experience)
    sectionHeaderDark: { paddingHorizontal: 20, marginTop: 30, marginBottom: 15, alignItems: 'center' },
    sectionTitleLight: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
    videoCard: { marginHorizontal: 20, height: 220, borderRadius: 15, overflow: 'hidden' },
    videoBackground: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    playBtnContainer: {
        width: 55,
        height: 55,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff'
    },

    // Bottom Nav
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 0.5,
        borderTopColor: '#eee',
        paddingBottom: 20
    },
    navItem: { alignItems: 'center', flex: 1 },
    navItemCentral: { alignItems: 'center', flex: 1 },
    navItemTextBold: { fontWeight: '900', color: '#000', fontSize: 14 },

    // Trending Section
    trendingSection: { backgroundColor: '#fff', paddingVertical: 30 },
    trendingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    trendingMiniBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    exploreMoreBtn: {
        marginHorizontal: 20,
        marginTop: 10,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: '#000',
        alignItems: 'center',
        borderRadius: 4,
    },
    exploreMoreText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    loaderContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
    loaderText: { color: '#888', fontSize: 14, fontWeight: '600' },
    // Testimonials
    testimonialSection: { backgroundColor: '#f9f9f9', paddingVertical: 40 },
    testimonialScroll: { paddingLeft: 20, paddingRight: 20 },
    testimonialCard: {
        backgroundColor: '#fff',
        padding: 25,
        marginRight: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#eee',
    },
    starsRow: { flexDirection: 'row', gap: 4 },
    testimonialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarWrapper: {
        position: 'relative',
        width: 48,
        height: 48,
    },
    clientAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
    },
    avatarRing: {
        position: 'absolute',
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: 27,
        borderWidth: 1.5,
        borderColor: '#D4A843',
        opacity: 0.3,
    },
    testimonialQuote: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: 20,
    },
    clientInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        paddingTop: 15,
    },
    clientName: { fontSize: 14, fontWeight: '700', color: '#000' },
    clientLocation: { fontSize: 11, color: '#888', marginTop: 2 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    verifiedText: { fontSize: 10, fontWeight: '700', color: '#D4A843', letterSpacing: 0.5 },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // For status bar overlap
    },
    profileTrigger: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    notificationBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
