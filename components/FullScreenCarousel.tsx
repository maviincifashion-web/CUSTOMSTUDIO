import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTheme } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';


interface CarouselProps {
    data: React.ReactNode[];
    onIndexChange?: (index: number) => void;
    carouselWidth?: number;
}

export interface CarouselRef {
    scrollToIndex: (index: number) => void;
}

const FullScreenCarousel = forwardRef<CarouselRef, CarouselProps>(({ data, onIndexChange, carouselWidth }, ref) => {
    const { width: fullScreenWidth } = useResponsive();
    const width = carouselWidth || fullScreenWidth;
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

    useImperativeHandle(ref, () => ({
        scrollToIndex: (index: number) => {
            if (flatListRef.current && index >= 0 && index < data.length) {
                flatListRef.current.scrollToIndex({ index, animated: true });
                setCurrentIndex(index);
                onIndexChangeRef.current?.(index);
            }
        }
    }));

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            setCurrentIndex(newIndex);
            onIndexChangeRef.current?.(newIndex);
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
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                removeClippedSubviews
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                renderItem={({ item, index }) => {
                    const shouldRender = Math.abs(index - currentIndex) <= 1;
                    return (
                        <View style={[styles.slide, { width }]}>
                            {shouldRender ? item : null}
                        </View>
                    );
                }}
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

FullScreenCarousel.displayName = 'FullScreenCarousel';

export default FullScreenCarousel;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        position: 'relative'
    },
    slide: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
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
