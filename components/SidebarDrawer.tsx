import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    Image,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';



interface SidebarDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const MENU_ITEMS = [
    { id: '1', label: 'Profile', icon: 'person-outline', route: '/profile' },
    { id: '2', label: 'Settings', icon: 'settings-outline', route: '/settings' },
    { id: '3', label: 'Refer A Friend', icon: 'person-add-outline', route: null },
    { id: '4', label: 'Tutorials', icon: 'play-circle-outline', route: null },
    { id: '5', label: 'FAQ & Support', icon: 'help-circle-outline', route: null },
    { id: '6', label: 'Terms & Conditions', icon: 'document-text-outline', route: null },
    { id: '7', label: 'About Us', icon: 'information-circle-outline', route: null },
];

export default function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
    const { width } = useWindowDimensions();
    const drawerWidth = width * 0.75;
    const translateX = useSharedValue(-drawerWidth);

    React.useEffect(() => {
        if (isOpen) {
            translateX.value = withTiming(0, { duration: 300 });
        } else {
            translateX.value = withTiming(-drawerWidth, { duration: 300 });
        }
    }, [isOpen, drawerWidth]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const handleNavigation = (route: string | null) => {
        if (route) {
            onClose();
            router.push(route as any);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal transparent visible={isOpen} animationType="none" onRequestClose={onClose}>
            <View style={styles.container}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                </Pressable>

                <Animated.View style={[styles.drawer, { width: drawerWidth }, animatedStyle]}>
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    
                    <View style={styles.header}>
                        <View style={styles.profileImageContainer}>
                            <Image 
                                source={require('../assets/images/profile_placeholder.jpg')} 
                                style={styles.profileImage}
                            />
                        </View>
                        <Text style={styles.userName}>Siju Subhakumar</Text>
                        <Text style={styles.userPhone}>9899912739</Text>
                    </View>

                    <View style={styles.menuList}>
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.menuItem}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <View style={styles.menuItemLeft}>
                                    <Ionicons name={item.icon as any} size={22} color="#fff" style={styles.menuIcon} />
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>V 1.0.0</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    drawer: {
        height: '100%',
        backgroundColor: '#1F1F1F',
        paddingTop: 60,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#A3E635', // Lime Green
        padding: 4,
        marginBottom: 15,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
    },
    userName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        fontFamily: 'serif', // Matching the mockup's serif font
    },
    userPhone: {
        color: '#888',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
    menuList: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        width: 30,
        marginRight: 15,
    },
    menuLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    versionText: {
        color: '#444',
        fontSize: 12,
        fontWeight: '700',
    }
});
