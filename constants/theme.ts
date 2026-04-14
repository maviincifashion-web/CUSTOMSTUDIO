/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const CustomTheme = {
  // Main Backgrounds
  backgroundPrimary: '#f3f4f6', // App default bg
  backgroundSecondary: '#cebfacff', // Studio bg

  // Text Colors
  textPrimary: '#000000',
  textSecondary: '#6b7280',
  textBrand: '#14213D',

  // Accent & Active Colors
  accentGold: '#ffc811ff', // Primary brand accent

  // Glassmorphism (Light Mode)
  glassBgLight: 'rgba(255, 255, 255, 0.4)',
  glassBgMedium: 'rgba(255, 255, 255, 0.7)',
  glassBgHeavy: 'rgba(255, 255, 255, 0.9)',
  glassBgFaint: 'rgba(255, 255, 255, 0.05)',

  // Glassmorphism Borders
  glassBorderLight: 'rgba(255, 255, 255, 0.1)',
  glassBorderMedium: 'rgba(255, 255, 255, 0.4)',
  glassBorderHeavy: 'rgba(255, 255, 255, 0.8)',
  glassBorderSolid: 'rgba(255, 255, 255, 1)',

  // Shadows
  shadowDark: '#000',
  shadowLight: '#14213D',

  // Overlays
  overlayDark: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
