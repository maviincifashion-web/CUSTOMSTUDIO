import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <Text style={styles.logoText}>MAVIINCI</Text>
                <Text style={styles.subText}>Bespoke Tailoring</Text>
            </View>

            <View style={styles.optionsContainer}>
                {/* BUTTON 1: KURTA */}
                <TouchableOpacity 
                    style={styles.card} 
                    onPress={() => router.push('/outfit')} // Ye pehle outfit selection screen par le jayega
                >
                    <Text style={styles.cardTitle}>Custom Kurta Set</Text>
                    <Text style={styles.cardSub}>Design Now {'>'}</Text>
                </TouchableOpacity>

                {/* BUTTON 2: SUIT (Abhi khali hai) */}
                <TouchableOpacity 
                    style={[styles.card, { opacity: 0.5 }]} 
                    onPress={() => alert('Suit Customizer Coming Soon!')}
                >
                    <Text style={styles.cardTitle}>Custom Suit Set</Text>
                    <Text style={styles.cardSub}>Coming Soon</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 30, alignItems: 'center', marginTop: 50 },
    logoText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 4, color: '#14213D' },
    subText: { fontSize: 14, color: '#666', marginTop: 5 },
    
    optionsContainer: { padding: 20, flex: 1, justifyContent: 'center' },
    card: { 
        backgroundColor: '#fff', 
        padding: 30, 
        borderRadius: 15, 
        marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 
    },
    cardTitle: { fontSize: 22, fontWeight: '600', color: '#14213D' },
    cardSub: { fontSize: 14, color: '#e6a100', marginTop: 10, fontWeight: 'bold' }
});