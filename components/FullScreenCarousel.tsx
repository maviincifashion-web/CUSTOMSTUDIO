import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTheme } from '../constants/theme';

interface CarouselProps {
    data: React.ReactNode[];
}

export interface CarouselRef {
    scrollToIndex: (index: number) => void;
}

import { useWindowDimensions } from 'react-native';

const FullScreenCarousel = forwardRef<CarouselRef, CarouselProps>(({ data }, ref) => {
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useImperativeHandle(ref, () => ({
        scrollToIndex: (index: number) => {
            if (flatListRef.current && index >= 0 && index < data.length) {
                flatListRef.current.scrollToIndex({ index, animated: true });
                setCurrentIndex(index);
            }
        }
    }));

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < data.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
        }
    };

    return (
        <View style={[styles.container, { width }]}>
            <FlatList
                ref={flatListRef}
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width }]}>
                        {item}
                    </View>
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                bounces={false}
            />

            {/* Left Arrow (Hide if on first slide) */}
            {currentIndex > 0 && (
                <TouchableOpacity style={[styles.arrowButton, styles.leftArrow]} onPress={handlePrev} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={CustomTheme.textBrand} />
                </TouchableOpacity>
            )}

            {/* Right Arrow (Hide if on last slide) */}
            {currentIndex < data.length - 1 && (
                <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={24} color={CustomTheme.textBrand} />
                </TouchableOpacity>
            )}

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {data.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot
                        ]}
                    />
                ))}
            </View>
        </View>
    );
});

export default FullScreenCarousel;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: CustomTheme.backgroundSecondary, // Matching KurtaMain
        position: 'relative'
    },
    slide: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
    },
    arrowButton: {
        position: 'absolute',
        bottom: 160, // Keep arrows near lower area
        width: 28,
        height: 28,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    leftArrow: {
        left: 20,
    },
    rightArrow: {
        right: 20,
    },
    pagination: {
        position: 'absolute',
        bottom: 110,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: CustomTheme.accentGold,
        width: 14,
        height: 14,
        borderRadius: 7,
    }
});
