import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchPresetById } from '../../src/firebase/TrendingApi';
import { useResponsive } from '../../hooks/useResponsive';
import { BlurView } from 'expo-blur';
import AppLogo from '../../assets/images/bussiness/only logo-01.svg';
import WrenchIcon from '../../assets/images/extra_icons/settings-wrench-svgrepo-com.svg';

const { width, height } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { normalize, isMobile, isTablet } = useResponsive();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadProduct();
        }
    }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        const data = await fetchPresetById(id as string);
        setProduct(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#D4A843" />
                <Text style={styles.loaderText}>Loading Details...</Text>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#64748b" />
                <Text style={styles.errorTitle}>Product Not Found</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleCustomize = () => {
        // Build the preset param to pass to the customizer
        const presetData = encodeURIComponent(JSON.stringify(product));
        if (product.category === 'kurta') {
            router.push({
                pathname: '/kurta',
                params: { presetParam: presetData, presetIdParam: product.id }
            });
        } else {
            router.push({
                pathname: '/outfit',
                params: { presetParam: presetData, presetIdParam: product.id }
            });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} bounceless>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image 
                        source={product.image ? { uri: product.image } : require('../../assets/images/hero_banner.jpg')} 
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    
                    {/* Header Overlay */}
                    <SafeAreaView style={styles.headerOverlay}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <AppLogo width={normalize(100)} height={normalize(34)} />
                        </View>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="share-outline" size={24} color="#000" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Image Footer Label */}
                    <View style={styles.imageLabel}>
                        <Text style={styles.imageLabelText}>PREMIUM COLLECTION</Text>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.categoryText}>{product.category?.toUpperCase()}</Text>
                            <Text style={styles.productName}>{product.name}</Text>
                        </View>
                        <View style={styles.priceTag}>
                            <Text style={styles.priceText}>₹{product.price}</Text>
                            {product.discount > 0 && (
                                <Text style={styles.discountText}>{product.discount}% OFF</Text>
                            )}
                        </View>
                    </View>

                    {product.customize && (
                        <View style={styles.customizableBadgeRow}>
                            <WrenchIcon width={16} height={16} fill="#D4A843" />
                            <Text style={styles.customizableText}>FULL CUSTOMIZATION AVAILABLE</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Product Description</Text>
                    <Text style={styles.descriptionText}>
                        This exquisite {product.category} design represents the pinnacle of bespoke tailoring. 
                        Handcrafted with precision and premium fabrics, it features unique details that 
                        can be further customized to your personal preference in our 3D experience.
                    </Text>

                    <View style={styles.featuresRow}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-seal-outline" size={24} color="#D4A843" />
                            <Text style={styles.featureText}>Premium Fabric</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="color-palette-outline" size={24} color="#D4A843" />
                            <Text style={styles.featureText}>Custom Fit</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="cube-outline" size={24} color="#D4A843" />
                            <Text style={styles.featureText}>3D Preview</Text>
                        </View>
                    </View>

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <BlurView intensity={80} tint="dark" style={styles.bottomActions}>
                <TouchableOpacity style={styles.cartBtn}>
                    <Ionicons name="bag-add-outline" size={20} color="#fff" />
                    <Text style={styles.cartBtnText}>ADD TO CART</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.customizeBtn} onPress={handleCustomize}>
                    <Text style={styles.customizeBtnText}>CUSTOMIZE NOW</Text>
                    <Ionicons name="chevron-forward" size={18} color="#000" />
                </TouchableOpacity>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    heroContainer: {
        height: height * 0.6,
        width: '100%',
        backgroundColor: '#f8fafc',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    imageLabel: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    imageLabelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    content: {
        padding: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    categoryText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    productName: {
        color: '#0f172a',
        fontSize: 26,
        fontWeight: '900',
    },
    priceTag: {
        alignItems: 'flex-end',
    },
    priceText: {
        color: '#000',
        fontSize: 22,
        fontWeight: '900',
    },
    discountText: {
        color: '#27ae60',
        fontSize: 12,
        fontWeight: '800',
        marginTop: 2,
    },
    customizableBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff9e6',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffecb3',
        gap: 8,
    },
    customizableText: {
        color: '#D4A843',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f1f1',
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 12,
    },
    descriptionText: {
        color: '#64748b',
        fontSize: 14,
        lineHeight: 24,
        marginBottom: 30,
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    featureItem: {
        alignItems: 'center',
        flex: 1,
    },
    featureText: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 8,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    cartBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        gap: 8,
    },
    cartBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '800',
    },
    customizeBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        borderRadius: 15,
        gap: 8,
    },
    customizeBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loaderText: {
        marginTop: 12,
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorTitle: {
        color: '#0f172a',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 20,
        marginBottom: 24,
    },
    backBtn: {
        backgroundColor: '#000',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },
    backBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
});
