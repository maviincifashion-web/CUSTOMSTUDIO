import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CarouselProps {
    data: React.ReactNode[];
}

export default function FullScreenCarousel({ data }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

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
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
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
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
            )}

            {/* Right Arrow (Hide if on last slide) */}
            {currentIndex < data.length - 1 && (
                <TouchableOpacity style={[styles.arrowButton, styles.rightArrow]} onPress={handleNext} activeOpacity={0.7}>
                    <Ionicons name="chevron-forward" size={24} color="#333" />
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
}

const styles = StyleSheet.create({
    container: {
        width: width,
        flex: 1,
        backgroundColor: '#E5e5e5', // Matches KurtaMain background completely
        position: 'relative'
    },
    slide: {
        width: width,
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
    },
    arrowButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -20, // Center vertically
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
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
        backgroundColor: '#14213D', // Maviinci brand color
        width: 14,
        height: 14,
        borderRadius: 7,
    }
});
