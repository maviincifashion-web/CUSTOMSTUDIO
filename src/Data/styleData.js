// src/Data/styleData.js

import {
    IconLenLong, IconLenShort, IconCutRound, IconCutStraight, IconPlacketNotch, IconPlacketSquare,
    IconPocket0, IconPocket1, IconPocket2, IconFlap0, IconFlap1, IconTypeRound, IconTypeNotch, IconTypeSquare,
    IconEpNo, IconEpYes, IconColRound, IconColMandarin, IconColChinese, IconColShirtRound, IconColButtonDown,
    IconColStandard, IconColSemiSpread, IconColSpread, IconSleeveNocuff, IconSleeveCuff, IconCuffRound1, IconCuffNotch1, IconCuffSquare1, IconCuffRound2, IconCuffNotch2, IconCuffSquare2,
    IconSadriEssentialNehru, IconSadriSignatureCurve, IconSadriCommand, IconSadriRanger, IconSadriEliteMinimal,
    IconSadriMetroUtility, IconSadriAvantEdge, IconSadriOfficer, IconSadriRoyalWrap, IconSadriModernRoyal,
    IconSadriRoyalAsym, IconSadriImperialSeamless, IconSadriClassicLapel, IconSadriHeritage, IconSadriUrbanSafari,
    IconPajamaSalwar, IconPajamaDhoti, IconPajamaPajama, IconPajamaChudidar,
    IconPajamaPatiala, IconPajamaAligarhi, IconPajamaPant, IconPajamaBellbottom,
    IconPajamaRope, IconPajamaElastic,
    IconCoatSingleButton, IconCoatDoubleButton, IconCoatSeamlessJodhpuri, IconCoatRoundJodhpuri,
    IconCoatStraightJodhpuri, IconCoatOpenJodhpuri, IconCoatNotchLapel, IconCoatPeakLapel,
    IconCoatNonVent, IconCoatSingleVent, IconCoatSideVent
} from '../icons/KurtaIcons';

export const KURTA_STYLE_OPTIONS = [
    {
        title: "Length", key: "length",
        options: [
            { label: "Long", value: "K", icon: IconLenLong },
            { label: "Short", value: "L", icon: IconLenShort }
        ]
    },
    {
        title: "Bottom Cut", key: "bottomCut",
        options: [
            { label: "Round", value: "R", icon: IconCutRound },
            { label: "Straight", value: "S", icon: IconCutStraight }
        ]
    },

    {
        title: "Neck Placket", key: "placketStyle",
        options: [
            { label: "Notch", value: "NS", icon: IconPlacketNotch },
            { label: "Square", value: "QS", icon: IconPlacketSquare }
        ]
    },
    {
        title: "Pocket", key: "pocketQty",
        options: [
            { label: "No Pocket", value: "00", icon: IconPocket0 },
            { label: "1 Pocket", value: "01", icon: IconPocket1 },
            { label: "2 Pocket", value: "11", icon: IconPocket2 }
        ]
    },
    {
        title: "Pocket Type", key: "pocketShape",
        dependency: { key: "pocketQty", notValue: "00" },
        options: [
            { label: "Round", value: "R", icon: IconTypeRound },
            { label: "Notch", value: "N", icon: IconTypeNotch },
            { label: "Square", value: "S", icon: IconTypeSquare }
        ]
    },
    {
        title: "Flap", key: "flapYes",
        dependency: { key: "pocketQty", notValue: "00" },
        options: [
            { label: "No Flap", value: "0", icon: IconFlap0 },
            { label: "Flap", value: "1", icon: IconFlap1 }
        ]
    },
    {
        title: "Flap Type", key: "flapShape",
        dependency: { key: "flapYes", value: "1" },
        options: [
            { label: "Round", value: "R", icon: IconTypeRound },
            { label: "Notch", value: "N", icon: IconTypeNotch },
            { label: "Square", value: "S", icon: IconTypeSquare }
        ]
    },
    {
        title: "Shoulder Epaulette", key: "epaulette",
        options: [
            { label: "NO", value: "0", icon: IconEpNo },
            { label: "YES", value: "SE", icon: IconEpYes }
        ]
    },
    {
        title: "Chinese Collar", key: "collar",
        options: [
            { label: "Round", value: "CN", icon: IconColRound },
            { label: "Mandarin", value: "CM", icon: IconColMandarin },
            { label: "Chinese", value: "CC", icon: IconColChinese }
        ]
    },
    {
        title: "Shirt Collar", key: "collar",
        options: [
            { label: "Round", value: "CR", icon: IconColShirtRound },
            { label: "Button Down", value: "CB", icon: IconColButtonDown },
            { label: "Standard", value: "CT", icon: IconColStandard },
            { label: "Semi Spread", value: "CS", icon: IconColSemiSpread },
            { label: "Spread", value: "CE", icon: IconColSpread }
        ]
    },
    {
        title: "Sleeve", key: "sleeve",
        options: [
            { label: "No Cuff", value: "SN", icon: IconSleeveNocuff },
            { label: "Cuff", value: "SC", icon: IconSleeveCuff }
        ]
    },
    {
        title: "Cuff Style", key: "cuffStyle",
        dependency: { key: "sleeve", value: "SC" },
        options: [
            { label: "Round", value: "UR1", icon: IconCuffRound1 },
            { label: "Notch", value: "UN1", icon: IconCuffNotch1 },
            { label: "Square", value: "US1", icon: IconCuffSquare1 },
            { label: "Round 2", value: "UR2", icon: IconCuffRound2 },
            { label: "Notch 2", value: "UN2", icon: IconCuffNotch2 },
            { label: "Square 2", value: "US2", icon: IconCuffSquare2 }
        ]
    },
    {
        title: "Pajama Type", key: "pajamaType",
        options: [
            { label: "Salwar", value: "PS", icon: IconPajamaSalwar },
            { label: "Dhoti", value: "PD", icon: IconPajamaDhoti },
            { label: "Pajama", value: "PJ", icon: IconPajamaPajama },
            { label: "Chudidar", value: "PC", icon: IconPajamaChudidar },
            { label: "Patiala", value: "PT", icon: IconPajamaPatiala },
            { label: "Aligarhi", value: "PA", icon: IconPajamaAligarhi },
            { label: "Pant", value: "PP", icon: IconPajamaPant },
            { label: "Bellbottom", value: "PB", icon: IconPajamaBellbottom }
        ]
    },
    {
        title: "Belt Type", key: "beltType",
        dependency: { key: "pajamaType", notValue: "PP", andNotValue: "PB" },
        options: [
            { label: "Rope", value: "R", icon: IconPajamaRope },
            { label: "Elastic", value: "E", icon: IconPajamaElastic }
        ]
    },
    {
        title: "Sadri Style", key: "sadriType",
        dependency: { isContextItem: "sadri" },
        options: [
            { label: "Essential Nehru", value: "SR", icon: IconSadriEssentialNehru },
            { label: "Signature Curve", value: "RR", icon: IconSadriSignatureCurve },
            { label: "Command", value: "SS", icon: IconSadriCommand },
            { label: "Ranger", value: "AA", icon: IconSadriRanger },
            { label: "Elite Minimal", value: "BB", icon: IconSadriEliteMinimal },
            { label: "Metro Utility", value: "CC", icon: IconSadriMetroUtility },
            { label: "Avant Edge", value: "DD", icon: IconSadriAvantEdge },
            { label: "Officer", value: "EE", icon: IconSadriOfficer },
            { label: "Royal Wrap", value: "FF", icon: IconSadriRoyalWrap },
            { label: "Modern Royal", value: "GG", icon: IconSadriModernRoyal },
            { label: "Royal Asym", value: "HH", icon: IconSadriRoyalAsym },
            { label: "Imperial Seamless", value: "KK", icon: IconSadriImperialSeamless },
            { label: "Classic Lapel", value: "M", icon: IconSadriClassicLapel },
            { label: "Heritage", value: "L", icon: IconSadriHeritage },
            { label: "Urban Safari", value: "N", icon: IconSadriUrbanSafari }
        ]
    },
    {
        title: "Single Brested", key: "coatType",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Single Button", value: "1B", icon: IconCoatSingleButton },
            { label: "Double Button", value: "2B", icon: IconCoatDoubleButton },
        ]
    },
    {
        title: "Jodhpuri", key: "coatType",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Seamless", value: "JH", icon: IconCoatSeamlessJodhpuri },
            { label: "Round", value: "JR", icon: IconCoatRoundJodhpuri },
            { label: "Straight", value: "JS", icon: IconCoatStraightJodhpuri },
            { label: "Open Coat", value: "JO", icon: IconCoatOpenJodhpuri }
        ]
    },
    {
        title: "Lapel", key: "coatLapel",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Notch", value: "N", icon: IconCoatNotchLapel },
            { label: "Peak", value: "P", icon: IconCoatPeakLapel }
        ]
    },
    {
        title: "Back Style", key: "coatBackStyle",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Non Vent", value: "NV", icon: IconCoatNonVent },
            { label: "Single Vent", value: "SV", icon: IconCoatSingleVent },
            { label: "Double Vent", value: "DV", icon: IconCoatSideVent }
        ]
    }
];