import { useWindowDimensions, PixelRatio, Platform } from 'react-native';

export function useResponsive() {
    const { width, height } = useWindowDimensions();

    // Orientation checking
    const isPortrait = height >= width;
    const isLandscape = width > height;

    // TV detection: Android TV / Google TV typically has low density + large screen
    // Expo Go on Google TV reports PixelRatio ~1.33 (density 213) and ~541x962 dp in portrait
    const isTV = Platform.isTV || (Platform.OS === 'android' && PixelRatio.get() <= 1.5 && Math.max(width, height) >= 920);

    // Breakpoints
    // Mobile: typical phones up to large phablets
    const isMobile = !isTV && width < 768;
    
    // Tablet: iPad size
    const isTablet = !isTV && width >= 768 && width < 1024;
    
    // Desktop/Commercial Screen: Huge screens, 4K setups, or TV
    const isDesktop = width >= 1024 || isTV;

    // Scale factors: these help in adjusting font sizes or padding based on screen size
    // Base width we design against is 375 (iPhone X etc.)
    // For TV: use a smaller base (300) so normalize produces ~1.8x scale for couch-distance viewing
    const baseWidth = isTV ? 300 : 375;
    const scale = width / baseWidth;
    
    // Function to calculate responsive sizes based on screen width
    // Capping the maximum scale so things don't get absurdly huge on 4K screens unless we want them to
    const normalize = (size: number, maxScale = 2.5) => {
        const newSize = size * Math.min(scale, maxScale);
        if (Platform.OS === 'ios') {
            return Math.round(PixelRatio.roundToNearestPixel(newSize));
        } else {
            return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
        }
    };

    return {
        width,
        height,
        isPortrait,
        isLandscape,
        isMobile,
        isTablet,
        isDesktop,
        isTV,
        normalize,
        // Helper percentages
        vw: (percentage: number) => (width * percentage) / 100,
        vh: (percentage: number) => (height * percentage) / 100,
    };
}
