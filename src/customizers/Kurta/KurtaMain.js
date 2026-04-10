import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Animated, Easing, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

import { DUMMY_FABRICS, INITIAL_SELECTION, DUMMY_BUTTONS, DUMMY_SADRI_BUTTONS, EMBROIDERY_COLLECTIONS } from '../../Data/dummyData';
import { KURTA_STYLE_OPTIONS } from '../../Data/styleData';
import { useOutfit } from '../../context/OutfitContext';

// --- YAHAN MODEL COMPONENT IMPORT HUA HAI ---
import KurtaModel from './components/KurtaModel';
import KurtaFolded from './components/KurtaFolded';
import PajamaStylePreview from './components/PajamaStylePreview';
import FullScreenCarousel from '../../../components/FullScreenCarousel';

import { IconFabric, IconStyle, IconEmbroidery, IconExtras } from '../../icons/ExtraIcons';

const { width } = Dimensions.get('window');

export default function KurtaMain() {
    const { selectedItems } = useOutfit();
    const [activePanel, setActivePanel] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // STATE MANAGEMENT
    const [selectedFabric, setSelectedFabric] = useState(DUMMY_FABRICS ? DUMMY_FABRICS[0] : {});
    const [selections, setSelections] = useState(INITIAL_SELECTION || {
        bottomCut: 'R', length: 'K', placketStyle: 'NS', pocketQty: '00', pocketShape: 'R', flapYes: '0', flapShape: 'R', epaulette: '0', collar: 'CM', sleeve: 'SN', cuffStyle: 'US1', embroideryID: null
    });
    const [selectedButton, setSelectedButton] = useState(INITIAL_SELECTION?.button || (DUMMY_BUTTONS ? DUMMY_BUTTONS[0] : null));
    const [selectedSadriButton, setSelectedSadriButton] = useState(DUMMY_SADRI_BUTTONS ? DUMMY_SADRI_BUTTONS[0] : null);
    const [isButtonModalOpen, setButtonModalOpen] = useState(false);
    const [isSadriButtonModalOpen, setSadriButtonModalOpen] = useState(false);
    const [buttonModalTab, setButtonModalTab] = useState('Plastic');
    const [sadriButtonModalTab, setSadriButtonModalTab] = useState('Plastic');
    const [selectedPajamaFabric, setSelectedPajamaFabric] = useState(DUMMY_FABRICS ? DUMMY_FABRICS[0] : {});
    const [selectedSadriFabric, setSelectedSadriFabric] = useState(DUMMY_FABRICS ? DUMMY_FABRICS[0] : {});
    const [fabricTab, setFabricTab] = useState('Kurta'); // 'Kurta' | 'Pajama' | 'Sadri'

    const carouselRef = useRef(null);
    const slideAnim = useRef(new Animated.Value(-width)).current;

    const togglePanel = (panelName) => {
        if (activePanel === panelName && isPanelOpen) closePanel();
        else {
            setActivePanel(panelName); setIsPanelOpen(true);
            Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
        }
    };

    const closePanel = () => {
        Animated.timing(slideAnim, { toValue: -width, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
            setIsPanelOpen(false); setActivePanel(null);
        });
    };

    const handleStyleChange = (type, value) => {
        setSelections(prev => ({ ...prev, [type]: value }));
        if (type === 'cuffStyle') {
            carouselRef.current?.scrollToIndex(1);
        } else if (type === 'sadriType') {
            carouselRef.current?.scrollToIndex(0);
        }
    };

    const renderPanelContent = () => {
        return (
            <View style={{ flex: 1, position: 'relative' }}>
                {/* --- FABRIC PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Fabric' ? 1 : 0, zIndex: activePanel === 'Fabric' ? 10 : 0 }]} pointerEvents={activePanel === 'Fabric' ? 'auto' : 'none'}>
                    {/* SWITCHER TABS */}
                    <View style={styles.fabricSwitcher}>
                        {['Kurta', 'Pajama', ...(selectedItems.includes('sadri') ? ['Sadri'] : [])].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.fabricSwitcherTab, fabricTab === tab && styles.fabricSwitcherTabActive]}
                                onPress={() => setFabricTab(tab)}
                            >
                                <Text style={[styles.fabricSwitcherText, fabricTab === tab && { color: '#fff' }]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* KURTA FABRICS */}
                    {fabricTab === 'Kurta' && DUMMY_FABRICS ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                            {DUMMY_FABRICS.map((fabric) => (
                                <TouchableOpacity key={fabric.fabricID} style={[styles.fabricCard, selectedFabric?.fabricID === fabric.fabricID && styles.fabricCardActive]} onPress={() => { setSelectedFabric(fabric); closePanel(); }}>
                                    <BlurView tint="light" intensity={30} style={StyleSheet.absoluteFill} />
                                    <Image source={fabric.thumbnail} style={styles.fabricImage} />
                                    <View style={styles.fabricInfo}>
                                        <Text style={styles.fabricName}>{fabric.name}</Text>
                                        <Text style={styles.fabricBrand}>{fabric.brand}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : null}

                    {/* PAJAMA FABRICS — same fabric list as Kurta, independent selection */}
                    {fabricTab === 'Pajama' && DUMMY_FABRICS ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                            {DUMMY_FABRICS.map((fabric) => (
                                <TouchableOpacity key={fabric.fabricID} style={[styles.fabricCard, selectedPajamaFabric?.fabricID === fabric.fabricID && styles.fabricCardActive]} onPress={() => { setSelectedPajamaFabric(fabric); closePanel(); }}>
                                    <BlurView tint="light" intensity={30} style={StyleSheet.absoluteFill} />
                                    <Image source={fabric.thumbnail} style={styles.fabricImage} />
                                    <View style={styles.fabricInfo}>
                                        <Text style={styles.fabricName}>{fabric.name}</Text>
                                        <Text style={styles.fabricBrand}>{fabric.brand}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : null}

                    {/* SADRI FABRICS — same fabric list as Kurta, independent selection */}
                    {fabricTab === 'Sadri' && DUMMY_FABRICS ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                            {DUMMY_FABRICS.map((fabric) => (
                                <TouchableOpacity key={fabric.fabricID} style={[styles.fabricCard, selectedSadriFabric?.fabricID === fabric.fabricID && styles.fabricCardActive]} onPress={() => { setSelectedSadriFabric(fabric); closePanel(); }}>
                                    <BlurView tint="light" intensity={30} style={StyleSheet.absoluteFill} />
                                    <Image source={fabric.thumbnail} style={styles.fabricImage} />
                                    <View style={styles.fabricInfo}>
                                        <Text style={styles.fabricName}>{fabric.name}</Text>
                                        <Text style={styles.fabricBrand}>{fabric.brand}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : null}

                    {!DUMMY_FABRICS && <Text style={styles.panelContent}>Loading Fabrics...</Text>}
                </View>

                {/* --- STYLE PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Style' ? 1 : 0, zIndex: activePanel === 'Style' ? 10 : 0 }]} pointerEvents={activePanel === 'Style' ? 'auto' : 'none'}>
                    {KURTA_STYLE_OPTIONS ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 }}>
                            {/* BUTTON PICKER SECTION MAP TO EXACT SCREENSHOT */}
                            <View style={{ marginBottom: 15 }}>
                                <View style={styles.buttonBanner}>
                                    <Text style={styles.buttonBannerText}>Button</Text>
                                </View>
                                <View style={styles.optionRow}>
                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <View style={styles.buttonIconWrapper}>
                                            {selectedButton && selectedButton.icon ? (
                                                <Image source={selectedButton.icon} style={{ width: 45, height: 45 }} resizeMode="contain" />
                                            ) : (
                                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#888' }} />
                                            )}
                                        </View>
                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                            Button 1
                                        </Text>
                                    </View>

                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => setButtonModalOpen(true)}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                <View style={styles.dot} />
                                                <View style={styles.dot} />
                                                <View style={styles.dot} />
                                            </View>
                                        </TouchableOpacity>
                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                            More{"\n"}options
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {KURTA_STYLE_OPTIONS.map((section, idx) => {
                                if (section.dependency) {
                                    if (section.dependency.isContextItem) {
                                        if (!selectedItems.includes(section.dependency.isContextItem)) return null;
                                    } else {
                                        const depValue = selections[section.dependency.key];
                                        if (section.dependency.notValue && depValue === section.dependency.notValue) return null;
                                        if (section.dependency.andNotValue && depValue === section.dependency.andNotValue) return null;
                                        if (section.dependency.value && depValue !== section.dependency.value) return null;
                                    }
                                }

                                return (
                                    <View key={idx} style={{ marginBottom: 25 }}>
                                        {section.key === 'sadriType' && selectedItems.includes('sadri') && (
                                            <View style={{ marginBottom: 15 }}>
                                                <View style={styles.buttonBanner}>
                                                    <Text style={styles.buttonBannerText}>Sadri Button</Text>
                                                </View>
                                                <View style={styles.optionRow}>
                                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                                        <View style={styles.buttonIconWrapper}>
                                                            {selectedSadriButton && selectedSadriButton.icon ? (
                                                                <Image source={selectedSadriButton.icon} style={{ width: 45, height: 45 }} resizeMode="contain" />
                                                            ) : (
                                                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#888' }} />
                                                            )}
                                                        </View>
                                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                                            Button 1
                                                        </Text>
                                                    </View>

                                                    <View style={{ width: '48%', marginBottom: 10 }}>
                                                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => setSadriButtonModalOpen(true)}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                                <View style={styles.dot} />
                                                                <View style={styles.dot} />
                                                                <View style={styles.dot} />
                                                            </View>
                                                        </TouchableOpacity>
                                                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]}>
                                                            More{"\n"}options
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{section.title}</Text>
                                        <View style={styles.optionRow}>
                                            {section.options.map((opt) => {
                                                const IconComponent = opt.icon?.default || opt.icon;
                                                const isActive = selections[section.key] === opt.value;
                                                return (
                                                    <View key={opt.value} style={{ width: '48%', marginBottom: 15 }}>
                                                        <TouchableOpacity style={[styles.styleOption, isActive && styles.activeStyleOption]} onPress={() => handleStyleChange(section.key, opt.value)}>
                                                            <BlurView tint="light" intensity={30} style={StyleSheet.absoluteFill} />
                                                            {IconComponent ? <IconComponent size={75} /> : <Text>Icon</Text>}
                                                        </TouchableOpacity>
                                                        <Text style={[styles.optionLabel, { color: isActive ? '#000' : '#555' }]}>{opt.label}</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <Text style={styles.panelContent}>Loading Styles...</Text>
                    )}
                </View>

                {/* --- EMBROIDERY PANEL --- */}
                <View style={[StyleSheet.absoluteFill, { opacity: activePanel === 'Embroidery' ? 1 : 0, zIndex: activePanel === 'Embroidery' ? 10 : 0 }]} pointerEvents={activePanel === 'Embroidery' ? 'auto' : 'none'}>
                    {EMBROIDERY_COLLECTIONS ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                            <TouchableOpacity style={[styles.fabricCard, !selections.embroideryID && styles.fabricCardActive]} onPress={() => { handleStyleChange('embroideryID', null); closePanel(); }}>
                                <BlurView tint="light" intensity={30} style={StyleSheet.absoluteFill} />
                                <View style={[styles.fabricImage, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#555' }}>None</Text>
                                </View>
                                <View style={styles.fabricInfo}>
                                    <Text style={styles.fabricName}>No Embroidery</Text>
                                    <Text style={styles.fabricBrand}>+ ₹ 0</Text>
                                </View>
                            </TouchableOpacity>
                            {EMBROIDERY_COLLECTIONS.map((embroidery) => (
                                <TouchableOpacity key={embroidery.id} style={[styles.fabricCard, selections.embroideryID === embroidery.id && styles.fabricCardActive]} onPress={() => { handleStyleChange('embroideryID', embroidery.id); closePanel(); }}>
                                    <BlurView tint="light" intensity={30} style={StyleSheet.absoluteFill} />
                                    {embroidery.profileImage ? (
                                        <Image source={embroidery.profileImage} style={styles.fabricImage} />
                                    ) : (
                                        <View style={[styles.fabricImage, { backgroundColor: '#f0e6d2' }]} />
                                    )}
                                    <View style={styles.fabricInfo}>
                                        <Text style={styles.fabricName}>{embroidery.name}</Text>
                                        <Text style={[styles.fabricBrand, { color: '#27ae60', fontWeight: 'bold' }]}>+ ₹ {embroidery.price}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.panelContent}>Loading Embroidery...</Text>
                    )}
                </View>

                {/* --- DEFAULT PANEL --- */}
                {activePanel !== 'Fabric' && activePanel !== 'Style' && activePanel !== 'Embroidery' && (
                    <View style={[StyleSheet.absoluteFill, { opacity: 1, zIndex: 1 }]} pointerEvents="auto">
                        <Text style={styles.panelContent}>Select a category to customize.</Text>
                    </View>
                )}
            </View>
        );
    };


    const basePrice = (selectedFabric?.price || 0) + 4500;
    const pajamaFabricPrice = selectedPajamaFabric?.price || 0;
    const hasSadri = selectedItems.includes('sadri');
    const sadriFabricPrice = hasSadri ? (selectedSadriFabric?.price || 0) : 0;
    const embroideryPrice = selections.embroideryID ? (EMBROIDERY_COLLECTIONS.find(e => e.id === selections.embroideryID)?.price || 0) : 0;
    const totalPrice = basePrice + pajamaFabricPrice + sadriFabricPrice + embroideryPrice;

    const sadriCode = selections.sadriType || 'SR';

    const buildSlides = () => {
        const baseProps = { selections, selectedFabric, selectedButton, selectedSadriButton, selectedPajamaFabric, selectedSadriFabric, hasSadri, sadriCode };

        if (hasSadri) {
            return [
                <View key="full" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaModel {...baseProps} slideIndex={0} />
                </View>,
                <View key="inner" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaModel {...baseProps} slideIndex={1} />
                </View>,
                <View key="folded" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <KurtaFolded {...baseProps} />
                </View>,
                <View key="pajama_only" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <PajamaStylePreview {...baseProps} />
                </View>,

                // Zoomed view of the sadri
                <View key="zoomed" style={{ flex: 1, position: 'relative', width: '100%', height: '100%', transform: [{ scale: 1.5 }, { translateY: 100 }] }}>
                    <KurtaModel {...baseProps} slideIndex={4} />
                </View>
            ];
        }

        return [
            <View key="full" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <KurtaModel {...baseProps} slideIndex={0} />
            </View>,
            <View key="folded" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <KurtaFolded {...baseProps} />
            </View>,
            <View key="pajama_only" style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                <PajamaStylePreview {...baseProps} />
            </View>
        ];
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <BlurView tint="light" intensity={60} style={StyleSheet.absoluteFill} />
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            {/* --- LAYER 1: 3D MODEL ENGINE --- */}
            <View style={styles.modelContainer}>
                <FullScreenCarousel
                    ref={carouselRef}
                    data={buildSlides()}
                />
            </View>

            <View style={styles.rightMenu}>
                {[IconFabric, IconStyle, IconEmbroidery, IconExtras].map((IconComponent, index) => {
                    const isActive = activePanel === IconComponent.displayName;
                    return (
                        <TouchableOpacity key={index} style={[styles.iconButton, isActive && styles.iconButtonActive]} onPress={() => togglePanel(IconComponent.displayName)}>
                            <BlurView tint="light" intensity={55} style={StyleSheet.absoluteFill} />
                            <IconComponent size={28} color={isActive ? '#fff' : '#14213D'} />
                            <Text style={[styles.iconText, isActive && { color: '#fff' }, { marginTop: 4 }]}>
                                {IconComponent.displayName === 'Embroidery' ? 'EMB' : IconComponent.displayName.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {isPanelOpen && (
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closePanel}>
                    <BlurView tint="dark" intensity={15} style={StyleSheet.absoluteFill} />
                </TouchableOpacity>
            )}

            <Animated.View style={[styles.sidePanel, { transform: [{ translateX: slideAnim }] }]}>
                <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
                <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Select {activePanel}</Text>
                    <TouchableOpacity onPress={closePanel}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.panelContentArea}>{renderPanelContent()}</View>
            </Animated.View>

            {isButtonModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <BlurView tint="dark" intensity={20} style={StyleSheet.absoluteFill} />
                    <View style={styles.buttonModalContainer}>
                        <BlurView tint="light" intensity={90} style={StyleSheet.absoluteFill} />
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Select Button</Text>
                            <TouchableOpacity onPress={() => setButtonModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonModalTabs}>
                            {['Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.buttonTab, buttonModalTab === tab && styles.buttonTabActive]}
                                    onPress={() => setButtonModalTab(tab)}
                                >
                                    <Text style={[styles.buttonTabText, buttonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <ScrollView style={styles.buttonList}>
                            {require('../../Data/dummyData').DUMMY_BUTTONS
                                .filter(b => b.material === buttonModalTab)
                                .sort((a, b) => {
                                    if (a.material === 'Fabric' && b.material === 'Fabric') {
                                        if (a.linkedFabricID === selectedFabric.fabricID) return -1;
                                        if (b.linkedFabricID === selectedFabric.fabricID) return 1;
                                    }
                                    return 0;
                                })
                                .map(btn => {
                                    const isRecommended = btn.material === 'Fabric' && btn.linkedFabricID === selectedFabric.fabricID;
                                    const isSelected = selectedButton?.id === btn.id;
                                    return (
                                        <TouchableOpacity
                                            key={btn.id}
                                            style={[styles.buttonItem, isSelected && styles.buttonItemActive]}
                                            onPress={() => { setSelectedButton(btn); setButtonModalOpen(false); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.buttonItemName}>{btn.name}</Text>
                                                {isRecommended && <Text style={styles.recommendedBadge}>RECOMMENDED</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </View>
            )}

            {isSadriButtonModalOpen && (
                <View style={styles.buttonModalOverlay}>
                    <BlurView tint="dark" intensity={20} style={StyleSheet.absoluteFill} />
                    <View style={styles.buttonModalContainer}>
                        <BlurView tint="light" intensity={90} style={StyleSheet.absoluteFill} />
                        <View style={styles.buttonModalHeader}>
                            <Text style={styles.buttonModalTitle}>Select Sadri Button</Text>
                            <TouchableOpacity onPress={() => setSadriButtonModalOpen(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.buttonModalTabs}>
                            {['Plastic', 'Metal', 'Wood', 'Ring', 'Fabric'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.buttonTab, sadriButtonModalTab === tab && styles.buttonTabActive]}
                                    onPress={() => setSadriButtonModalTab(tab)}
                                >
                                    <Text style={[styles.buttonTabText, sadriButtonModalTab === tab && { color: '#fff' }]}>{tab}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <ScrollView style={styles.buttonList}>
                            {DUMMY_SADRI_BUTTONS
                                .filter(b => b.material === sadriButtonModalTab)
                                .sort((a, b) => {
                                    if (a.material === 'Fabric' && b.material === 'Fabric') {
                                        if (a.linkedFabricID === selectedSadriFabric?.fabricID) return -1;
                                        if (b.linkedFabricID === selectedSadriFabric?.fabricID) return 1;
                                    }
                                    return 0;
                                })
                                .map(btn => {
                                    const isRecommended = btn.material === 'Fabric' && btn.linkedFabricID === selectedSadriFabric?.fabricID;
                                    const isSelected = selectedSadriButton?.id === btn.id;
                                    return (
                                        <TouchableOpacity
                                            key={btn.id}
                                            style={[styles.buttonItem, isSelected && styles.buttonItemActive]}
                                            onPress={() => { setSelectedSadriButton(btn); setSadriButtonModalOpen(false); }}
                                        >
                                            {btn.icon ? (
                                                <Image source={btn.icon} style={styles.buttonItemIcon} />
                                            ) : (
                                                <View style={styles.buttonItemIcon} />
                                            )}
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.buttonItemName}>{btn.name}</Text>
                                                {isRecommended && <Text style={styles.recommendedBadge}>RECOMMENDED</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </ScrollView>
                    </View>
                </View>
            )}

            <View style={styles.bottomBar}>
                <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
                <View style={styles.priceContainer}>
                    <Text style={styles.productName}>Your custom kurta set</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.price}>₹ {totalPrice}</Text>
                        <Text style={styles.discount}> Base + Fabric {embroideryPrice > 0 ? '+ Embroidery' : ''}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => alert('Measurements Screen!')}><Text style={styles.checkoutText}>Lets Dressup {'>'}</Text></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E5e5e5' },
    modelContainer: { flex: 1, zIndex: 1, position: 'relative', marginTop: -60 },
    previewLabel: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(20,33,61,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    previewLabelText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
    backButton: { padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    backText: { fontSize: 18, fontWeight: 'bold', color: '#14213D', zIndex: 2 },
    brandText: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: '#14213D' },
    rightMenu: { position: 'absolute', right: 20, top: '25%', zIndex: 100, alignItems: 'center' },
    iconButton: { width: 60, height: 60, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, overflow: 'hidden' },
    iconButtonActive: { backgroundColor: '#14213D', shadowColor: '#14213D', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
    iconText: { fontSize: 11, color: '#14213D', fontWeight: 'bold', textAlign: 'center', zIndex: 2 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 20 },
    sidePanel: { position: 'absolute', left: 0, top: 0, bottom: 90, width: width * 0.6, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', zIndex: 5000, elevation: 5000, paddingTop: 60, shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15, borderTopRightRadius: 0, borderBottomRightRadius: 0, overflow: 'hidden' },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 10, marginTop: -10 },
    panelTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    closeBtn: { fontSize: 24, color: '#999', padding: 10 },
    panelContentArea: { flex: 1 },
    panelContent: { fontSize: 16, color: '#666', paddingHorizontal: 20 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between', paddingBottom: 20 },
    fabricCard: { width: '80%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 10, marginBottom: 15, alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    fabricCardActive: { borderColor: '#14213D', shadowColor: '#14213D', shadowOpacity: 0.2, shadowRadius: 12, elevation: 12 },
    fabricImage: { width: '100%', height: 100, backgroundColor: 'transparent' },
    fabricInfo: { padding: 5 },
    fabricName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    fabricBrand: { fontSize: 10, color: '#888', marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    styleOption: { width: '100%', aspectRatio: .8, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)', padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
    activeStyleOption: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
    optionLabel: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 8 },
    bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 90, backgroundColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderTopWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)', zIndex: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, overflow: 'hidden' },
    priceContainer: { justifyContent: 'center' },
    productName: { fontSize: 13, color: '#555', marginBottom: 2 },
    price: { fontSize: 22, fontWeight: '900', color: '#14213D' },
    discount: { fontSize: 12, color: '#666', fontWeight: 'bold' },
    checkoutBtn: { backgroundColor: '#14213D', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 40, shadowColor: '#14213D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Fabric Tab Switcher
    fabricSwitcher: { flexDirection: 'row', marginHorizontal: 15, marginTop: 10, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 25, padding: 3 },
    fabricSwitcherTab: { flex: 1, paddingVertical: 7, borderRadius: 22, alignItems: 'center' },
    fabricSwitcherTabActive: { backgroundColor: '#14213D' },
    fabricSwitcherText: { fontSize: 13, fontWeight: 'bold', color: '#14213D' },

    // Button UI Styles
    buttonBanner: { backgroundColor: '#14213d', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 15, marginHorizontal: 5 },
    buttonBannerText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    buttonIconWrapper: { width: '100%', height: 60, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#222', marginHorizontal: 3 },
    buttonModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9999, elevation: 9999, justifyContent: 'center', alignItems: 'center' },
    buttonModalContainer: { width: '85%', maxHeight: '70%', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
    buttonModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    buttonModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#14213D' },
    buttonModalTabs: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingVertical: 10 },
    buttonTab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
    buttonTabActive: { backgroundColor: '#14213D' },
    buttonTabText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    buttonList: { padding: 20 },
    buttonItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)' },
    buttonItemActive: { borderColor: '#14213D', backgroundColor: 'rgba(237, 242, 251, 0.8)' },
    buttonItemIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc', marginRight: 15 },
    buttonItemName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    recommendedBadge: { fontSize: 9, color: '#27ae60', fontWeight: 'bold', marginTop: 2 }
});