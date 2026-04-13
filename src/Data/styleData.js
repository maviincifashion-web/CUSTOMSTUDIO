// src/Data/styleData.js

import {
    IconLenLong, IconLenShort, IconCutRound, IconCutStraight, IconPlacketNotch, IconPlacketSquare,
    IconPocket0, IconPocket1, IconPocket2, IconFlap0, IconFlap1, IconTypeRound, IconTypeNotch, IconTypeSquare,
    IconEpNo, IconEpYes, IconColRound, IconColMandarin, IconColChinese, IconColShirtRound, IconColButtonDown,
    IconColStandard, IconColSemiSpread, IconColSpread, IconSleeveNocuff, IconSleeveCuff, IconCuffRound1, IconCuffNotch1, IconCuffSquare1, IconCuffRound2, IconCuffNotch2, IconCuffSquare2
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
            { label: "Salwar", value: "PS", icon: IconCutRound },
            { label: "Dhoti", value: "PD", icon: IconCutStraight },
            { label: "Pajama", value: "PJ", icon: IconLenLong },
            { label: "Chudidar", value: "PC", icon: IconLenShort },
            { label: "Patiala", value: "PT", icon: IconPlacketNotch },
            { label: "Aligarhi", value: "PA", icon: IconPlacketSquare },
            { label: "Pant", value: "PP", icon: IconTypeRound },
            { label: "Bellbottom", value: "PB", icon: IconTypeSquare }
        ]
    },
    {
        title: "Belt Type", key: "beltType",
        dependency: { key: "pajamaType", notValue: "PP", andNotValue: "PB" },
        options: [
            { label: "Rope", value: "R", icon: IconEpYes },
            { label: "Elastic", value: "E", icon: IconEpNo }
        ]
    },
    {
        title: "Sadri Style", key: "sadriType",
        dependency: { isContextItem: "sadri" },
        options: [
            { label: "Style SR", value: "SR", icon: IconLenLong },
            { label: "Style RR", value: "RR", icon: IconLenShort },
            { label: "Style SS", value: "SS", icon: IconCutRound },
            { label: "Style AA", value: "AA", icon: IconCutStraight },
            { label: "Style BB", value: "BB", icon: IconPlacketNotch },
            { label: "Style CC", value: "CC", icon: IconPlacketSquare },
            { label: "Style DD", value: "DD", icon: IconPocket0 },
            { label: "Style EE", value: "EE", icon: IconPocket1 },
            { label: "Style FF", value: "FF", icon: IconPocket2 },
            { label: "Style GG", value: "GG", icon: IconFlap0 },
            { label: "Style HH", value: "HH", icon: IconFlap1 },
            { label: "Style KK", value: "KK", icon: IconTypeRound },
            { label: "Heritage V", value: "L", icon: IconTypeNotch },
            { label: "Classic Lapel", value: "M", icon: IconTypeSquare },
            { label: "Urban Safari", value: "N", icon: IconEpNo }
        ]
    },
    {
        title: "Single Brested", key: "coatType",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Single Button", value: "1B", icon: IconLenLong },
            { label: "Double Button", value: "2B", icon: IconLenShort },
        ]
    },
    {
        title: "Jodhpuri", key: "coatType",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Seamless", value: "JH", icon: IconCutRound },
            { label: "Round", value: "JR", icon: IconTypeRound },
            { label: "Straight", value: "JS", icon: IconCutStraight },
            { label: "Open Coat", value: "JO", icon: IconPlacketNotch }
        ]
    },
    {
        title: "Lapel", key: "coatLapel",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Notch", value: "N", icon: IconFlap0 },
            { label: "Peak", value: "P", icon: IconFlap1 }
        ]
    },
    {
        title: "Back Style", key: "coatBackStyle",
        dependency: { isContextItem: "coat" },
        options: [
            { label: "Non Vent", value: "NV", icon: IconPocket0 },
            { label: "Single Vent", value: "SV", icon: IconPocket1 },
            { label: "Double Vent", value: "DV", icon: IconPocket2 }
        ]
    }
];