import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { KURTA_STYLES, PAJAMA_STYLES, SADRI_STYLES, COAT_STYLES } from '../../../../Data/styleData';
import { CustomTheme } from '../../../../../constants/theme';

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    styleOption: {
        width: '100%',
        aspectRatio: 0.85, // Taller boxes
        backgroundColor: '#F5F1E8',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        borderWidth: 0.5,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    activeStyleOption: {
        borderColor: CustomTheme.accentGold,
        borderWidth: 2.5,
        backgroundColor: '#FFFFFF', // White background to make it pop
        borderRadius: 4,
        shadowColor: CustomTheme.accentGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    optionLabel: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '600',
        color: '#475569',
        textTransform: 'capitalize',
    },
    buttonBanner: {
        backgroundColor: '#000000',
        paddingVertical: 8,
        paddingHorizontal: 24,
        alignSelf: 'center',
        borderRadius: 4,
        marginBottom: 28,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonBannerText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    buttonIconWrapper: {
        width: '100%',
        aspectRatio: 0.85,
        backgroundColor: '#F5F1E8',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#14213D',
        marginHorizontal: 3,
        opacity: 0.6,
    }
});

const areEqual = (prevProps, nextProps) => {
    // 1. Check if the value for this specific section changed
    if (prevProps.selections[nextProps.section.key] !== nextProps.selections[nextProps.section.key]) return false;
    
    // 2. Check if the dependency value changed
    if (nextProps.section.dependency && nextProps.section.dependency.key) {
        if (prevProps.selections[nextProps.section.dependency.key] !== nextProps.selections[nextProps.section.dependency.key]) return false;
    }
    
    // 3. Check blockers for pockets
    if (nextProps.section.key === 'sadriUpperPocket') {
        if (prevProps.isSadriUpperPocketBlocked !== nextProps.isSadriUpperPocketBlocked) return false;
        if (prevProps.sadriRightBaseActive !== nextProps.sadriRightBaseActive) return false;
    }
    if (nextProps.section.key === 'coatUpperPocket') {
        if (prevProps.coatRightBaseActive !== nextProps.coatRightBaseActive) return false;
    }
    
    // 4. Check Jodhpuri mode for coat lapel
    if (nextProps.section.key === 'coatLapel') {
        if (prevProps.isJodhpuriMode !== nextProps.isJodhpuriMode) return false;
    }

    return true; // No relevant changes, skip re-render
};

const StyleSection = memo(({ section, selections, handleStyleChange, isJodhpuriMode, isSadriUpperPocketBlocked, sadriRightBaseActive, coatRightBaseActive }) => {
    // Check dependencies
    if (section.dependency) {
        const depValue = selections[section.dependency.key];
        if (section.dependency.notValue && depValue === section.dependency.notValue) return null;
        if (section.dependency.andNotValue && depValue === section.dependency.andNotValue) return null;
        if (section.dependency.value && depValue !== section.dependency.value) return null;
    }

    if (section.key === 'sadriUpperPocket' && isSadriUpperPocketBlocked) {
        return null;
    }

    const disableUpperPocket = (section.key === 'sadriUpperPocket' && sadriRightBaseActive) ||
                               (section.key === 'coatUpperPocket' && coatRightBaseActive);

    const isCoatLapelJodhpuri = section.key === 'coatLapel' && isJodhpuriMode;

    return (
        <View key={`${section.key}-${section.title}`} style={[{ marginBottom: 32 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9', marginLeft: 12, opacity: 0.6 }} />
            </View>
            <View style={styles.optionRow}>
                {section.options.map((opt) => {
                    const IconComponent = opt.icon?.default || opt.icon;
                    let currentVal = selections[section.key];
                    if (currentVal == null) {
                        if (section.key === 'coatUpperPocket' || section.key === 'sadriUpperPocket') {
                            currentVal = '1';
                        }
                    }
                    const isActive = String(currentVal) === String(opt.value);
                    const isDisabledOption = disableUpperPocket && opt.value !== '0';

                    return (
                        <View key={opt.value} style={{ width: '47%', marginBottom: 18 }}>
                            <TouchableOpacity
                                style={[
                                    styles.styleOption,
                                    isActive && styles.activeStyleOption
                                ]}
                                disabled={isDisabledOption}
                                onPress={() => {
                                    if (isDisabledOption) return;
                                    if (isCoatLapelJodhpuri) return;
                                    handleStyleChange(section.key, opt.value);
                                }}
                            >
                                {IconComponent ? <IconComponent size={110} /> : <Text style={{ color: '#94a3b8' }}>Icon</Text>}
                                {isActive && (
                                    <View style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: CustomTheme.accentGold }} />
                                )}
                            </TouchableOpacity>
                            <Text style={[
                                styles.optionLabel, 
                                isActive && { color: CustomTheme.accentGold, fontWeight: '900', fontSize: 12.5 }
                            ]}>
                                {opt.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
});

export const KurtaStylePanel = (props) => {
    return (
        <View>
            <View style={{ marginBottom: 24 }}>
                <View style={styles.buttonBanner}>
                    <Text style={styles.buttonBannerText}>Kurta</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>Button Style</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9', marginLeft: 12, opacity: 0.6 }} />
                </View>
                <View style={styles.optionRow}>
                    <View style={{ width: '47%', marginBottom: 10 }}>
                        <View style={styles.buttonIconWrapper}>
                            {props.selectedButton && props.selectedButton.icon ? (
                                <Image source={props.selectedButton.icon} style={{ width: 90, height: 90 }} resizeMode="contain" />
                            ) : (
                                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9' }} />
                            )}
                        </View>
                        <Text style={[styles.optionLabel, { color: '#0f172a', fontSize: 12, fontWeight: '700', marginTop: 8 }]} numberOfLines={1}>
                            {props.selectedButton?.name || 'Selected'}
                        </Text>
                    </View>
                    <View style={{ width: '47%', marginBottom: 10 }}>
                        <TouchableOpacity style={[styles.buttonIconWrapper, { backgroundColor: '#f8fafc', borderStyle: 'dashed' }]} onPress={() => props.setButtonModalOpen(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.optionLabel, { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 8 }]}>
                            Browse All
                        </Text>
                    </View>
                </View>
            </View>
            {KURTA_STYLES.map(section => (
                <StyleSection key={`${section.key}-${section.title}`} section={section} {...props} />
            ))}
        </View>
    );
};

export const PajamaStylePanel = (props) => {
    return (
        <View>
            <View style={styles.buttonBanner}>
                <Text style={styles.buttonBannerText}>Pajama</Text>
            </View>
            {PAJAMA_STYLES.map(section => (
                <StyleSection key={`${section.key}-${section.title}`} section={section} {...props} />
            ))}
        </View>
    );
};

export const SadriStylePanel = (props) => {
    return (
        <View>
            <View style={{ marginBottom: 24 }}>
                <View style={styles.buttonBanner}>
                    <Text style={styles.buttonBannerText}>Sadri</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>Outerwear Buttons</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9', marginLeft: 12, opacity: 0.6 }} />
                </View>
                <View style={styles.optionRow}>
                    <View style={{ width: '47%', marginBottom: 10 }}>
                        <View style={styles.buttonIconWrapper}>
                            {props.selectedSadriButton && props.selectedSadriButton.icon ? (
                                <Image source={props.selectedSadriButton.icon} style={{ width: 70, height: 70 }} resizeMode="contain" />
                            ) : (
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9' }} />
                            )}
                        </View>
                        <Text style={[styles.optionLabel, { color: '#0f172a', fontSize: 12, fontWeight: '700', marginTop: 8 }]} numberOfLines={1}>
                            {props.selectedSadriButton?.name || 'Selected'}
                        </Text>
                    </View>
                    <View style={{ width: '47%', marginBottom: 10 }}>
                        <TouchableOpacity style={[styles.buttonIconWrapper, { backgroundColor: '#f8fafc', borderStyle: 'dashed' }]} onPress={() => props.setSadriButtonModalOpen(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.optionLabel, { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 8 }]}>
                            Change
                        </Text>
                    </View>
                </View>
            </View>
            {SADRI_STYLES.map(section => (
                <StyleSection key={`${section.key}-${section.title}`} section={section} {...props} />
            ))}
        </View>
    );
};

export const CoatStylePanel = (props) => {
    return (
        <View>
            <View style={{ marginBottom: 24 }}>
                <View style={styles.buttonBanner}>
                    <Text style={styles.buttonBannerText}>Coat</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>Coat Buttons</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9', marginLeft: 12, opacity: 0.6 }} />
                </View>
                <View style={styles.optionRow}>
                    <View style={{ width: '47%', marginBottom: 10 }}>
                        <View style={styles.buttonIconWrapper}>
                            {props.selectedCoatButton && props.selectedCoatButton.icon ? (
                                <Image source={props.selectedCoatButton.icon} style={{ width: 70, height: 70 }} resizeMode="contain" />
                            ) : (
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9' }} />
                            )}
                        </View>
                        <Text style={[styles.optionLabel, { color: '#0f172a', fontSize: 12, fontWeight: '700', marginTop: 8 }]} numberOfLines={1}>
                            {props.selectedCoatButton?.name || 'Selected'}
                        </Text>
                    </View>
                    <View style={{ width: '47%', marginBottom: 10 }}>
                        <TouchableOpacity style={[styles.buttonIconWrapper, { backgroundColor: '#f8fafc', borderStyle: 'dashed' }]} onPress={() => props.setCoatButtonModalOpen(true)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.optionLabel, { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 8 }]}>
                            Change
                        </Text>
                    </View>
                </View>
            </View>
            {COAT_STYLES.map(section => (
                <StyleSection key={`${section.key}-${section.title}`} section={section} {...props} />
            ))}
        </View>
    );
};
