import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { KURTA_STYLES, PAJAMA_STYLES, SADRI_STYLES, COAT_STYLES } from '../../../../Data/styleData';

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#14213D',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    styleOption: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 5,
    },
    activeStyleOption: {
        borderColor: '#FCA311',
        borderWidth: 2,
        backgroundColor: '#fef9ec',
    },
    optionLabel: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
    },
    buttonBanner: {
        backgroundColor: '#14213D',
        paddingVertical: 4,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
        borderRadius: 4,
        marginBottom: 15,
    },
    buttonBannerText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    buttonIconWrapper: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#14213D',
        marginHorizontal: 3,
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
        <View key={`${section.key}-${section.title}`} style={[{ marginBottom: 25 }, isCoatLapelJodhpuri ? { opacity: 0.35 } : null]}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{section.title}</Text>
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
                        <View key={opt.value} style={{ width: '48%', marginBottom: 15 }}>
                            <TouchableOpacity
                                style={[
                                    styles.styleOption,
                                    isActive && styles.activeStyleOption,
                                    isDisabledOption && { opacity: 0.35 }
                                ]}
                                disabled={isDisabledOption}
                                onPress={() => {
                                    if (isDisabledOption) return;
                                    if (isCoatLapelJodhpuri) return;
                                    handleStyleChange(section.key, opt.value);
                                }}
                            >
                                {IconComponent ? <IconComponent size={120} /> : <Text>Icon</Text>}
                            </TouchableOpacity>
                            <Text style={[styles.optionLabel, { color: isDisabledOption ? '#94a3b8' : isActive ? '#000' : '#555' }]}>{opt.label}</Text>
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
            <View style={{ marginBottom: 15 }}>
                <View style={styles.buttonBanner}>
                    <Text style={styles.buttonBannerText}>Kurta</Text>
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Button</Text>
                <View style={styles.optionRow}>
                    <View style={{ width: '48%', marginBottom: 10 }}>
                        <View style={styles.buttonIconWrapper}>
                            {props.selectedButton && props.selectedButton.icon ? (
                                <Image source={props.selectedButton.icon} style={{ width: 100, height: 100 }} resizeMode="contain" />
                            ) : (
                                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#888' }} />
                            )}
                        </View>
                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]} numberOfLines={1}>
                            {props.selectedButton?.name || 'Selected'}
                        </Text>
                    </View>
                    <View style={{ width: '48%', marginBottom: 10 }}>
                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => props.setButtonModalOpen(true)}>
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
            <View style={{ marginBottom: 15 }}>
                <View style={styles.buttonBanner}>
                    <Text style={styles.buttonBannerText}>Sadri</Text>
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Sadri Button</Text>
                <View style={styles.optionRow}>
                    <View style={{ width: '48%', marginBottom: 10 }}>
                        <View style={styles.buttonIconWrapper}>
                            {props.selectedSadriButton && props.selectedSadriButton.icon ? (
                                <Image source={props.selectedSadriButton.icon} style={{ width: 70, height: 70 }} resizeMode="contain" />
                            ) : (
                                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#888' }} />
                            )}
                        </View>
                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]} numberOfLines={1}>
                            {props.selectedSadriButton?.name || 'Selected'}
                        </Text>
                    </View>
                    <View style={{ width: '48%', marginBottom: 10 }}>
                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => props.setSadriButtonModalOpen(true)}>
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
            {SADRI_STYLES.map(section => (
                <StyleSection key={`${section.key}-${section.title}`} section={section} {...props} />
            ))}
        </View>
    );
};

export const CoatStylePanel = (props) => {
    return (
        <View>
            <View style={{ marginBottom: 15 }}>
                <View style={styles.buttonBanner}>
                    <Text style={styles.buttonBannerText}>Coat</Text>
                </View>
                <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Coat Button</Text>
                <View style={styles.optionRow}>
                    <View style={{ width: '48%', marginBottom: 10 }}>
                        <View style={styles.buttonIconWrapper}>
                            {props.selectedCoatButton && props.selectedCoatButton.icon ? (
                                <Image source={props.selectedCoatButton.icon} style={{ width: 70, height: 70 }} resizeMode="contain" />
                            ) : (
                                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#888' }} />
                            )}
                        </View>
                        <Text style={[styles.optionLabel, { color: '#14213D', fontSize: 13, fontWeight: 'bold', marginTop: 5 }]} numberOfLines={1}>
                            {props.selectedCoatButton?.name || 'Selected'}
                        </Text>
                    </View>
                    <View style={{ width: '48%', marginBottom: 10 }}>
                        <TouchableOpacity style={styles.buttonIconWrapper} onPress={() => props.setCoatButtonModalOpen(true)}>
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
            {COAT_STYLES.map(section => (
                <StyleSection key={`${section.key}-${section.title}`} section={section} {...props} />
            ))}
        </View>
    );
};
