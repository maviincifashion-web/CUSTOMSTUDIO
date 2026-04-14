import { useWindowDimensions, PixelRatio, Platform } from 'react-native';

export function useResponsive() {
    const { width, height } = useWindowDimensions();

    // Orientation checking
    const isPortrait = height >= width;
    const isLandscape = width > height;

    // Breakpoints
    // Mobile: typical phones up to large phablets
    const isMobile = width < 768;
    
    // Tablet: iPad size
    const isTablet = width >= 768 && width < 1024;
    
    // Desktop/Commercial Screen: Huge screens or 4K setups
    const isDesktop = width >= 1024;

    // Scale factors: these help in adjusting font sizes or padding based on screen size
    // Base width we design against is 375 (iPhone X etc.)
    const scale = width / 375;
    
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
        normalize,
        // Helper percentages
        vw: (percentage: number) => (width * percentage) / 100,
        vh: (percentage: number) => (height * percentage) / 100,
    };
}
