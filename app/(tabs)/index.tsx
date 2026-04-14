import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useResponsive } from '../../hooks/useResponsive';
import { CustomTheme } from '../../constants/theme';

export default function HomeScreen() {
    const { isTablet, isDesktop, normalize } = useResponsive();
    const isLargeScreen = isTablet || isDesktop;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={[styles.header, isLargeScreen && styles.headerLarge]}>
                <Text style={[styles.logoText, { fontSize: normalize(32) }]}>MAVIINCI</Text>
                <Text style={[styles.subText, { fontSize: normalize(14) }]}>Bespoke Tailoring</Text>
            </View>

            <View style={[
                styles.optionsContainer, 
                isLargeScreen && { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30 }
            ]}>
                {/* BUTTON 1: KURTA */}
                <TouchableOpacity 
                    style={[styles.card, isLargeScreen && { width: 300, minHeight: 200 }]} 
                    onPress={() => router.push('/outfit')} 
                    activeOpacity={0.8}
                >
                    <Text style={[styles.cardTitle, { fontSize: normalize(22) }]}>Custom Kurta Set</Text>
                    <Text style={[styles.cardSub, { fontSize: normalize(14) }]}>Design Now {'>'}</Text>
                </TouchableOpacity>

                {/* BUTTON 2: SUIT (Abhi khali hai) */}
                <TouchableOpacity 
                    style={[styles.card, { opacity: 0.5 }, isLargeScreen && { width: 300, minHeight: 200 }]} 
                    onPress={() => alert('Suit Customizer Coming Soon!')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.cardTitle, { fontSize: normalize(22) }]}>Custom Suit Set</Text>
                    <Text style={[styles.cardSub, { fontSize: normalize(14) }]}>Coming Soon</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CustomTheme.backgroundPrimary },
    header: { padding: 30, alignItems: 'center', marginTop: 50 },
    headerLarge: { marginTop: 80, marginBottom: 40 },
    logoText: { fontWeight: 'bold', letterSpacing: 4, color: CustomTheme.textPrimary },
    subText: { color: CustomTheme.textSecondary, marginTop: 5 },
    
    optionsContainer: { padding: 20, flex: 1, justifyContent: 'center' },
    card: { 
        backgroundColor: CustomTheme.glassBgLight, 
        padding: 30, 
        borderRadius: 20, 
        marginBottom: 20,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: CustomTheme.glassBorderHeavy,
        overflow: 'hidden',
        shadowColor: CustomTheme.shadowDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 
    },
    cardTitle: { fontWeight: '800', color: CustomTheme.textPrimary, zIndex: 2 },
    cardSub: { color: CustomTheme.accentGold, marginTop: 10, fontWeight: 'bold', zIndex: 2 }
});