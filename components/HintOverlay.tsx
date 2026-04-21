import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withRepeat, 
    withSequence,
    withDelay,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';

interface HintOverlayProps {
    slideIndex: number;
    onDismiss: () => void;
    onSkip: () => void;
}

const HintOverlay: React.FC<HintOverlayProps> = ({ slideIndex, onDismiss, onSkip }) => {
    const { width, height } = useWindowDimensions();
    const fingerOpacity = useSharedValue(0);
    const fingerTranslateX = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        if (slideIndex === 0) {
            // Slide 1: Swipe Hint Animation
            fingerOpacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 500 }),
                    withTiming(1, { duration: 1000 }), // hold
                    withTiming(0, { duration: 500 })
                ),
                -1,
                false
            );

            fingerTranslateX.value = withRepeat(
                withSequence(
                    withTiming(-50, { duration: 800 }),
                    withTiming(50, { duration: 1600 }),
                    withTiming(0, { duration: 800 })
                ),
                -1,
                true
            );
        } else {
            // Pulse animation for other hints
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1,
                true
            );
        }
    }, [slideIndex]);

    const animatedFingerStyle = useAnimatedStyle(() => ({
        opacity: fingerOpacity.value,
        transform: [{ translateX: fingerTranslateX.value }]
    }));

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: withRepeat(withSequence(withTiming(0.8), withTiming(0.4)), -1, true)
    }));

    const renderHintContent = () => {
        switch (slideIndex) {
            case 0:
                return (
                    <View style={styles.centerContent}>
                        <Animated.View style={[styles.fingerIcon, animatedFingerStyle]}>
                            <Ionicons name="hand-right-outline" size={50} color="white" />
                        </Animated.View>
                        <Text style={styles.hintText}>👆 Swipe to explore customization</Text>
                    </View>
                );
            case 1:
                return (
                    <View style={styles.absoluteContent}>
                         <View style={[styles.spotlightContainer, { top: height * 0.35, left: width * 0.4 }]}>
                            <Animated.View style={[styles.glowCircle, animatedPulseStyle]} />
                            <Text style={styles.sideHintText}>Tap to change fabric</Text>
                         </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.absoluteContent}>
                         <View style={[styles.spotlightContainer, { top: height * 0.25, left: width * 0.5 }]}>
                            <Animated.View style={[styles.glowCircle, animatedPulseStyle]} />
                            <Text style={styles.sideHintText}>Try different styles</Text>
                         </View>
                    </View>
                );
            case 3:
                return (
                    <View style={styles.absoluteContent}>
                         <View style={[styles.spotlightContainer, { top: height * 0.45, left: width * 0.3 }]}>
                            <View style={styles.dotRow}>
                                <Animated.View style={[styles.miniGlow, animatedPulseStyle]} />
                                <Animated.View style={[styles.miniGlow, animatedPulseStyle, { marginHorizontal: 20 }]} />
                                <Animated.View style={[styles.miniGlow, animatedPulseStyle]} />
                            </View>
                            <Text style={styles.sideHintText}>Add buttons & embroidery</Text>
                         </View>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.bottomContent}>
                         <Animated.View style={[styles.ctaGlow, animatedPulseStyle]} />
                         <Text style={styles.hintText}>Start designing your own</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <TouchableWithoutFeedback onPress={onDismiss}>
            <Animated.View 
                entering={FadeIn.duration(400)} 
                exiting={FadeOut.duration(300)} 
                style={styles.overlay}
            >
                {/* SVG Spotlight Effect (optional, using simple overlay for now for maximum performance) */}
                
                {renderHintContent()}

                <TouchableWithoutFeedback onPress={onSkip}>
                    <View style={styles.skipContainer}>
                        <Text style={styles.skipText}>Skip</Text>
                    </View>
                </TouchableWithoutFeedback>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
    },
    absoluteContent: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomContent: {
        position: 'absolute',
        bottom: 120,
        alignItems: 'center',
        width: '100%',
    },
    fingerIcon: {
        marginBottom: 20,
    },
    hintText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    sideHintText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        textAlign: 'center',
    },
    spotlightContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(212, 168, 67, 0.4)',
        borderWidth: 2,
        borderColor: 'rgba(212, 168, 67, 0.8)',
    },
    miniGlow: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(212, 168, 67, 0.6)',
    },
    dotRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ctaGlow: {
        width: 250,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(212, 168, 67, 0.3)',
        position: 'absolute',
        bottom: -5,
    },
    skipContainer: {
        position: 'absolute',
        top: 60,
        right: 30,
        padding: 10,
    },
    skipText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});

export default HintOverlay;
