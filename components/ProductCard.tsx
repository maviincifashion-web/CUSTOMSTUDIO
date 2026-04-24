import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WrenchIcon from '../assets/images/extra_icons/settings-wrench-svgrepo-com.svg';

const { width } = Dimensions.get('window');

const CustomizableBadge = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.customizableBadge, { transform: [{ scale: pulseAnim }] }]}>
            <WrenchIcon width={12} height={12} fill="#fff" />
        </Animated.View>
    );
};

interface ProductCardProps {
    product: any;
    cardWidth?: any;
    style?: any;
}

export const ProductCard = ({ product, cardWidth, style }: ProductCardProps) => {
    const router = useRouter();

    return (
        <TouchableOpacity 
            style={[styles.productCard, cardWidth ? { width: cardWidth } : null, style]}
            activeOpacity={0.9}
            onPress={() => router.push(`/product/${product.id}`)}
        >
            <View style={styles.imageContainer}>
                <Image 
                    source={product.image ? { uri: product.image } : require('../assets/images/hero_banner.jpg')} 
                    style={styles.productImage} 
                />
                {product.customize && <CustomizableBadge />}
            </View>
            <View style={styles.productContent}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <View style={styles.productFooter}>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>
                            ₹{Math.round(Number(product.price || 0) * (1 - Number(product.discount || 0) / 100))}
                        </Text>
                        {Number(product.discount) > 0 && (
                            <Text style={styles.priceDiscountText}>{product.discount}% OFF</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    productCard: {
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
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
    productContent: {
        padding: 10,
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
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    productPrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1e293b',
    },
    priceDiscountText: {
        color: '#27ae60',
        fontSize: 11,
        fontWeight: '800',
    },
    originalPrice: {
        fontSize: 12,
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },
    customizableBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#D4A843',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D4A843',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 5,
    },
});
