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
    IconCoatNonVent, IconCoatSingleVent, IconCoatSideVent,
    IconCoatNoUpperPocket, IconCoatUpperPocket, IconCoatTuxSingle, IconCoatTuxDouble
} from '../icons/KurtaIcons';

export const KURTA_STYLES = [
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
    }
];

export const PAJAMA_STYLES = [
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
    }
];

export const SADRI_STYLES = [
    {
        title: "Sadri Style", key: "sadriType",
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
        title: "UPPER POCKET", key: "sadriUpperPocket",
        options: [
            { label: "No Upper Pocket", value: "0", icon: IconCoatNoUpperPocket },
            { label: "Upper Pocket", value: "1", icon: IconCoatUpperPocket }
        ]
    }
];

export const COAT_STYLES = [
    {
        title: "SINGLE BREASTED", key: "coatType",
        options: [
            { label: "Single Button", value: "1B", icon: IconCoatSingleButton },
            { label: "Double Button", value: "2B", icon: IconCoatDoubleButton },
        ]
    },
    {
        title: "TUXEDO", key: "coatType",
        options: [
            { label: "Single Button", value: "T1", icon: IconCoatTuxSingle },
            { label: "Double Button", value: "T2", icon: IconCoatTuxDouble }
        ]
    },
    {
        title: "LAPEL", key: "coatLapel",
        options: [
            { label: "Notch", value: "N", icon: IconCoatNotchLapel },
            { label: "Peak", value: "P", icon: IconCoatPeakLapel }
        ]
    },
    {
        title: "JODHPURI", key: "coatType",
        options: [
            { label: "Seamless", value: "JH", icon: IconCoatSeamlessJodhpuri },
            { label: "Round", value: "JR", icon: IconCoatRoundJodhpuri },
            { label: "Straight", value: "JS", icon: IconCoatStraightJodhpuri },
            { label: "Open Coat", value: "JO", icon: IconCoatOpenJodhpuri }
        ]
    },
    {
        title: "UPPER POCKET", key: "coatUpperPocket",
        options: [
            { label: "No Upper Pocket", value: "0", icon: IconCoatNoUpperPocket },
            { label: "Upper Pocket", value: "1", icon: IconCoatUpperPocket }
        ]
    },
    {
        title: "BACK STYLE", key: "coatBackStyle",
        options: [
            { label: "Non Vent", value: "NV", icon: IconCoatNonVent },
            { label: "Single Vent", value: "SV", icon: IconCoatSingleVent },
            { label: "Double Vent", value: "DV", icon: IconCoatSideVent }
        ]
    }
];

export const KURTA_STYLE_OPTIONS = [
    ...KURTA_STYLES,
    ...PAJAMA_STYLES.map(s => ({ ...s, dependency: { ...s.dependency, isContextItem: 'pajama' }})),
    ...SADRI_STYLES.map(s => ({ ...s, dependency: { ...s.dependency, isContextItem: 'sadri' }})),
    ...COAT_STYLES.map(s => ({ ...s, dependency: { ...s.dependency, isContextItem: 'coat' }}))
];

export const SKIN_TONE_OPTIONS = [
    { label: "Model 1", value: 1, image: require("../../assets/images/kurta_body/face_1.jpg"), color: "#F7E2D6" },
    { label: "Model 2", value: 2, image: require("../../assets/images/kurta_body/face_2.jpg"), color: "#F3CFB6" },
    { label: "Model 3", value: 3, image: require("../../assets/images/kurta_body/face_3.jpg"), color: "#D2A181" },
    { label: "Model 4", value: 4, image: require("../../assets/images/kurta_body/face_4.jpg"), color: "#A57251" },
    { label: "Model 5", value: 5, image: require("../../assets/images/kurta_body/face_5.jpg"), color: "#634430" },
    { label: "Model 6", value: 6, image: require("../../assets/images/kurta_body/face_6.jpg"), color: "#4A3224" },
    { label: "Model 7", value: 7, image: require("../../assets/images/kurta_body/face_7.jpg"), color: "#312219" },
];