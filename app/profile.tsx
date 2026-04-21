import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useResponsive } from '../hooks/useResponsive';

export default function ProfileScreen() {
    const { normalize } = useResponsive();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={24} color="#A3E635" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Ionicons name="pencil-outline" size={22} color="#A3E635" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Picture */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={require('../assets/images/profile_placeholder.jpg')} 
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Ionicons name="pencil" size={16} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>Siju Subhakumar</Text>
                </View>

                {/* Edit Button Label */}
                <TouchableOpacity style={styles.editLabelRow}>
                    <Ionicons name="create-outline" size={18} color="#A3E635" />
                    <Text style={styles.editLabelText}>Edit</Text>
                </TouchableOpacity>

                {/* Info Cards */}
                <View style={styles.infoContainer}>
                    <InfoRow icon="person-outline" label="Name" value="Siju Subhakumar" />
                    <InfoRow icon="at-outline" label="Email" value="siju@gmail.com" />
                    <InfoRow icon="call-outline" label="Phone" value="9899912739" />
                    <InfoRow icon="location-outline" label="Location" value="Bangalore" />
                </View>

                {/* TV Controller */}
                <TouchableOpacity
                    style={styles.controllerBtn}
                    onPress={() => router.push('/scan')}
                >
                    <View style={styles.controllerBtnInner}>
                        <Ionicons name="tv-outline" size={24} color="#000" />
                        <View style={styles.controllerTextWrap}>
                            <Text style={styles.controllerTitle}>Make Controller</Text>
                            <Text style={styles.controllerSub}>Connect phone to TV as remote</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#000" />
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
                <Ionicons name={icon} size={20} color="#888" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
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
    avatarSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    avatarContainer: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 3,
        borderColor: '#A3E635',
        padding: 5,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#A3E635',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#121212',
    },
    profileName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        fontFamily: 'serif',
        marginTop: 15,
    },
    editLabelRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 10,
        gap: 5,
    },
    editLabelText: {
        color: '#A3E635',
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        backgroundColor: '#1F1F1F',
        marginHorizontal: 20,
        borderRadius: 15,
        padding: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        marginRight: 12,
    },
    infoLabel: {
        color: '#888',
        fontSize: 15,
        fontWeight: '500',
    },
    infoValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    controllerBtn: {
        marginHorizontal: 20,
        marginTop: 25,
        borderRadius: 15,
        overflow: 'hidden',
    },
    controllerBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#A3E635',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 15,
        gap: 14,
    },
    controllerTextWrap: {
        flex: 1,
    },
    controllerTitle: {
        color: '#000',
        fontSize: 17,
        fontWeight: '800',
    },
    controllerSub: {
        color: 'rgba(0,0,0,0.55)',
        fontSize: 13,
        marginTop: 2,
    },
});
