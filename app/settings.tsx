import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';

export default function SettingsScreen() {
    const { normalize, isTV } = useResponsive();
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={normalize(24)} color="#A3E635" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontSize: normalize(18) }]}>Settings</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, isTV && { maxWidth: 600, alignSelf: 'center', width: '100%' }]}>
                {/* Account Section */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionCard}>
                    <SettingsItem icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
                    <SettingsItem icon="language-outline" label="Language" />
                    <SettingsItem icon="shield-outline" label="Security" />
                    <SettingsItem icon="lock-closed-outline" label="Privacy" />
                </View>

                {/* Notifications Section */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.sectionCard}>
                    <SettingsItem icon="notifications-outline" label="Notification Preferences" />
                    <SettingsItem icon="volume-high-outline" label="Notification Sounds" />
                </View>

                {/* Help & Support Section */}
                <Text style={styles.sectionTitle}>Help & Support</Text>
                <View style={styles.sectionCard}>
                    <SettingsItem icon="help-circle-outline" label="FAQ" />
                    <SettingsItem icon="chatbubble-outline" label="Contact Support" />
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={20} color="#888" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingsItem({ icon, label, onPress }: { icon: any, label: string, onPress?: () => void }) {
    return (
        <TouchableOpacity style={styles.itemRow} onPress={onPress}>
            <View style={styles.itemLeft}>
                <Ionicons name={icon} size={20} color="#fff" style={styles.itemIcon} />
                <Text style={styles.itemLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginTop: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 25,
        marginTop: 25,
        marginBottom: 10,
    },
    sectionCard: {
        backgroundColor: '#1F1F1F',
        marginHorizontal: 20,
        borderRadius: 15,
        paddingHorizontal: 5,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemIcon: {
        marginRight: 15,
    },
    itemLabel: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginTop: 40,
        gap: 10,
    },
    logoutText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '700',
    },
});
