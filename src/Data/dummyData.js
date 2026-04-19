// src/Data/dummyData.js
import { FABRIC_PROFILES } from './fabrics';
import { KURTA_RENDERS as KURTA_RENDERS_SOURCE } from './kurtaRenders';

export const DUMMY_FABRICS = FABRIC_PROFILES;

export const DUMMY_BUTTONS = [
    {
        id: "BTN_001",
        name: "Standard Plastic",
        material: "Plastic",
        icon: null,
        renders: {
            "BKC-F": null, "BKN-F": null, "BKT-F": null, "BPR-F": null, "BPL-F": null, "BE-F": null, "CBB-F": null, "BC2-F": null, "BC4-F": null,
            "BKC-S": null, "BKN-S": null, "BKT-S": null, "BPR-S": null, "BPL-S": null, "BE-S": null, "CBB-S": null, "BC2-S": null, "BC4-S": null,
        }
    },
    {
        id: "BTN_002",
        name: "Classic Metal",
        material: "Metal",
        icon: null,
        renders: {}
    },
    {
        id: "BTN_003",
        name: "Oak Wood",
        material: "Wood",
        icon: null,
        renders: {}
    },
    {
        id: "BTN_004",
        name: "Standard Ring",
        material: "Ring",
        icon: null,
        renders: {}
    },
    {
        id: "BTN_005",
        name: "Matching Fabric",
        material: "Fabric",
        linkedFabricID: "FAB_001",
        icon: require('../../assets/images/buttons/fabric_button/button_icon/button_001.png'),
        renders: {
            "BKC-F": require('../../assets/images/buttons/fabric_button/render/button_001/BKC-F.webp'),
            "BKN-F": require('../../assets/images/buttons/fabric_button/render/button_001/BKN-F.webp'),
            "BKT-F": require('../../assets/images/buttons/fabric_button/render/button_001/BKT-F.webp'),
            "BPR-F": require('../../assets/images/buttons/fabric_button/render/button_001/BPR-F.webp'),
            "BPL-F": require('../../assets/images/buttons/fabric_button/render/button_001/BPL-F.webp'),
            "BE-F": require('../../assets/images/buttons/fabric_button/render/button_001/BE-F.webp'),
            "CBB-F": require('../../assets/images/buttons/fabric_button/render/button_001/CBB-F.webp'),
            "BC2-F": null,
            "BC4-F": null,

            "BKC-S": require('../../assets/images/buttons/fabric_button/render/button_001/BKC-S.webp'),
            "BKN-S": require('../../assets/images/buttons/fabric_button/render/button_001/BKN-S.webp'),
            "BKT-S": null,
            "BPR-S": require('../../assets/images/buttons/fabric_button/render/button_001/BPR-S.webp'),
            "BPL-S": require('../../assets/images/buttons/fabric_button/render/button_001/BPL-S.webp'),
            "BE-S": require('../../assets/images/buttons/fabric_button/render/button_001/BE-S.webp'),
            "CBB-S": require('../../assets/images/buttons/fabric_button/render/button_001/CBB-S.webp'),
            "BC2-S": require('../../assets/images/buttons/fabric_button/render/button_001/BC2-S.webp'),
            "BC4-S": require('../../assets/images/buttons/fabric_button/render/button_001/BC4-S.webp'),
        }
    }
];

export const DUMMY_SADRI_BUTTONS = [
    {
        id: "SBTN_0001",
        name: "Standard Plastic",
        material: "Plastic",
        icon: null,
        renders: {}
    },
    {
        id: "SBTN_0002",
        name: "Classic Metal",
        material: "Metal",
        icon: null,
        renders: {}
    },
    {
        id: "SBTN_0003",
        name: "Oak Wood",
        material: "Wood",
        icon: null,
        renders: {}
    },
    {
        id: "SBTN_0004",
        name: "Standard Ring",
        material: "Ring",
        icon: null,
        renders: {}
    },
    {
        id: "SBTN_001",
        name: "Sadri Fabric Button",
        material: "Fabric",
        linkedFabricID: "FAB_001",
        icon: require('../../assets/images/button_sadri/fabric_button/button_icon/button_001.png'),
        renders: {
            "BSR": require('../../assets/images/button_sadri/fabric_button/render/button_001/BSR.webp'),
            "BRR": require('../../assets/images/button_sadri/fabric_button/render/button_001/BRR.webp'),
            "BSS": require('../../assets/images/button_sadri/fabric_button/render/button_001/BSS.webp'),
            "BAA": require('../../assets/images/button_sadri/fabric_button/render/button_001/BAA.webp'),
            "BBB": require('../../assets/images/button_sadri/fabric_button/render/button_001/BBB.webp'),
            "BCC": require('../../assets/images/button_sadri/fabric_button/render/button_001/BCC.webp'),
            "BDD": require('../../assets/images/button_sadri/fabric_button/render/button_001/BDD.webp'),
            "BEE": require('../../assets/images/button_sadri/fabric_button/render/button_001/BEE.webp'),
            "BFF": require('../../assets/images/button_sadri/fabric_button/render/button_001/BFF.webp'),
            "BGG": require('../../assets/images/button_sadri/fabric_button/render/button_001/BGG.webp'),
            "BHH": require('../../assets/images/button_sadri/fabric_button/render/button_001/BHH.webp'),
            "BKK": null,
            "BLR": require('../../assets/images/button_sadri/fabric_button/render/button_001/BLR.webp'),
            "BLS": require('../../assets/images/button_sadri/fabric_button/render/button_001/BLS.webp'),
            "BLC": require('../../assets/images/button_sadri/fabric_button/render/button_001/BLC.webp'),
            "BMR": require('../../assets/images/button_sadri/fabric_button/render/button_001/BMR.webp'),
            "BMS": require('../../assets/images/button_sadri/fabric_button/render/button_001/BMS.webp'),
            "BMC": require('../../assets/images/button_sadri/fabric_button/render/button_001/BMC.webp'),
            "BNR": require('../../assets/images/button_sadri/fabric_button/render/button_001/BNR.webp'),
            "BNS": require('../../assets/images/button_sadri/fabric_button/render/button_001/BNS.webp'),
            "BNC": require('../../assets/images/button_sadri/fabric_button/render/button_001/BNC.webp')
        }
    }
];

export const DUMMY_COAT_BUTTONS = [
    {
        id: "CBTN_0001",
        name: "Standard Plastic",
        material: "Plastic",
        icon: null,
        renders: {}
    },
    {
        id: "CBTN_0002",
        name: "Classic Metal",
        material: "Metal",
        icon: null,
        renders: {}
    },
    {
        id: "CBTN_0003",
        name: "Oak Wood",
        material: "Wood",
        icon: null,
        renders: {}
    },
    {
        id: "CBTN_0004",
        name: "Standard Ring",
        material: "Ring",
        icon: null,
        renders: {}
    },
    {
        id: "CBTN_001",
        name: "Coat Fabric Button",
        material: "Fabric",
        linkedFabricID: "FAB_001",
        icon: require('../../assets/images/buttons/fabric_button/button_icon/button_coat_001.png'),
        renders: {
            "BC-1B-F": require('../../assets/images/buttons/fabric_button/render/button_001/BC-1B-F.webp'),
            "BC-1B-S": require('../../assets/images/buttons/fabric_button/render/button_001/BC-1B-S.webp'),
            "BC-2B-F": require('../../assets/images/buttons/fabric_button/render/button_001/BC-2B-F.webp'),
            "BC-2B-S": require('../../assets/images/buttons/fabric_button/render/button_001/BC-2B-S.webp'),
            "BC-JH-F": require('../../assets/images/buttons/fabric_button/render/button_001/BC-JH-F.webp'),
            "BC-JH-S": require('../../assets/images/buttons/fabric_button/render/button_001/BC-JH-S.webp'),
            "BCS-B": require('../../assets/images/buttons/fabric_button/render/button_001/BCS-B.webp'),
            "BCS-S": require('../../assets/images/buttons/fabric_button/render/button_001/BCS-S.webp')
        }
    }
];

export const INITIAL_SELECTION = {
    button: DUMMY_BUTTONS[0],
    length: 'K',
    bottomCut: 'R',
    placketStyle: 'NS',
    pocketQty: '00',
    pocketShape: 'R',
    flapYes: '0',
    flapShape: 'R',
    epaulette: '0',
    collar: 'CM',
    sleeve: 'SN',
    cuffStyle: 'US1',
    embroideryID: null, // Kurta embroidery
    embroideryCollection: null, // Selected kurta embroidery collection doc
    sadriEmbroideryID: null, // Sadri chest (left+right asset folders)
    sadriEmbroideryCollection: null, // Selected sadri embroidery collection doc
    pajamaType: 'PJ',
    beltType: 'R',
    sadriType: 'SR',
    coatType: '1B',
    coatBackStyle: 'NV',
    coatLapel: 'N'
};

export const KURTA_RENDERS = KURTA_RENDERS_SOURCE;

// ------- PAJAMA RENDERS -------
// Same fabric ID system as KURTA_RENDERS.
// Folder: assets/Pajama/Render/{fabricID}/display/ and /style/
// DISPLAY file names: "{pajamaType}-{baseCode}"  e.g. "PJ-D", "PB-R"
// STYLE file names:   "{pajamaType}-{beltType}"    e.g. "PA-E", "PJ-R" (PB, PP are single)
export const PAJAMA_RENDERS = {
    "FAB_001": {
        display: {
            "PA-D": require('../../assets/Pajama/Render/FAB_001/display/PA-D.webp'), "PA-D0": require('../../assets/Pajama/Render/FAB_001/display/PA-D0.webp'), "PA-K": require('../../assets/Pajama/Render/FAB_001/display/PA-K.webp'), "PA-L": require('../../assets/Pajama/Render/FAB_001/display/PA-L.webp'), "PA-P": require('../../assets/Pajama/Render/FAB_001/display/PA-P.webp'), "PA-P0": require('../../assets/Pajama/Render/FAB_001/display/PA-P0.webp'), "PA-Q": require('../../assets/Pajama/Render/FAB_001/display/PA-Q.webp'), "PA-Q0": require('../../assets/Pajama/Render/FAB_001/display/PA-Q0.webp'), "PA-R": require('../../assets/Pajama/Render/FAB_001/display/PA-R.webp'), "PA-S": require('../../assets/Pajama/Render/FAB_001/display/PA-S.webp'), "PA-T": require('../../assets/Pajama/Render/FAB_001/display/PA-T.webp'), "PA-T0": require('../../assets/Pajama/Render/FAB_001/display/PA-T0.webp'),
            "PB-D": require('../../assets/Pajama/Render/FAB_001/display/PB-D.webp'), "PB-D0": require('../../assets/Pajama/Render/FAB_001/display/PB-D0.webp'), "PB-K": require('../../assets/Pajama/Render/FAB_001/display/PB-K.webp'), "PB-L": require('../../assets/Pajama/Render/FAB_001/display/PB-L.webp'), "PB-P": require('../../assets/Pajama/Render/FAB_001/display/PB-P.webp'), "PB-P0": require('../../assets/Pajama/Render/FAB_001/display/PB-P0.webp'), "PB-Q": require('../../assets/Pajama/Render/FAB_001/display/PB-Q.webp'), "PB-Q0": require('../../assets/Pajama/Render/FAB_001/display/PB-Q0.webp'), "PB-R": require('../../assets/Pajama/Render/FAB_001/display/PB-R.webp'), "PB-S": require('../../assets/Pajama/Render/FAB_001/display/PB-S.webp'), "PB-T": require('../../assets/Pajama/Render/FAB_001/display/PB-T.webp'), "PB-T0": require('../../assets/Pajama/Render/FAB_001/display/PB-T0.webp'),
            "PC-D": require('../../assets/Pajama/Render/FAB_001/display/PC-D.webp'), "PC-D0": require('../../assets/Pajama/Render/FAB_001/display/PC-D0.webp'), "PC-K": require('../../assets/Pajama/Render/FAB_001/display/PC-K.webp'), "PC-L": require('../../assets/Pajama/Render/FAB_001/display/PC-L.webp'), "PC-P": require('../../assets/Pajama/Render/FAB_001/display/PC-P.webp'), "PC-P0": require('../../assets/Pajama/Render/FAB_001/display/PC-P0.webp'), "PC-Q": require('../../assets/Pajama/Render/FAB_001/display/PC-Q.webp'), "PC-Q0": require('../../assets/Pajama/Render/FAB_001/display/PC-Q0.webp'), "PC-R": require('../../assets/Pajama/Render/FAB_001/display/PC-R.webp'), "PC-S": require('../../assets/Pajama/Render/FAB_001/display/PC-S.webp'), "PC-T": require('../../assets/Pajama/Render/FAB_001/display/PC-T.webp'), "PC-T0": require('../../assets/Pajama/Render/FAB_001/display/PC-T0.webp'),
            "PD-D": require('../../assets/Pajama/Render/FAB_001/display/PD-D.webp'), "PD-D0": require('../../assets/Pajama/Render/FAB_001/display/PD-D0.webp'), "PD-K": require('../../assets/Pajama/Render/FAB_001/display/PD-K.webp'), "PD-L": require('../../assets/Pajama/Render/FAB_001/display/PD-L.webp'), "PD-P": require('../../assets/Pajama/Render/FAB_001/display/PD-P.webp'), "PD-P0": require('../../assets/Pajama/Render/FAB_001/display/PD-P0.webp'), "PD-Q": require('../../assets/Pajama/Render/FAB_001/display/PD-Q.webp'), "PD-Q0": require('../../assets/Pajama/Render/FAB_001/display/PD-Q0.webp'), "PD-R": require('../../assets/Pajama/Render/FAB_001/display/PD-R.webp'), "PD-S": require('../../assets/Pajama/Render/FAB_001/display/PD-S.webp'), "PD-T": require('../../assets/Pajama/Render/FAB_001/display/PD-T.webp'), "PD-T0": require('../../assets/Pajama/Render/FAB_001/display/PD-T0.webp'),
            "PJ-D": require('../../assets/Pajama/Render/FAB_001/display/PJ-D.webp'), "PJ-D0": require('../../assets/Pajama/Render/FAB_001/display/PJ-D0.webp'), "PJ-K": require('../../assets/Pajama/Render/FAB_001/display/PJ-K.webp'), "PJ-L": require('../../assets/Pajama/Render/FAB_001/display/PJ-L.webp'), "PJ-P": require('../../assets/Pajama/Render/FAB_001/display/PJ-P.webp'), "PJ-P0": require('../../assets/Pajama/Render/FAB_001/display/PJ-P0.webp'), "PJ-Q": require('../../assets/Pajama/Render/FAB_001/display/PJ-Q.webp'), "PJ-Q0": require('../../assets/Pajama/Render/FAB_001/display/PJ-Q0.webp'), "PJ-R": require('../../assets/Pajama/Render/FAB_001/display/PJ-R.webp'), "PJ-S": require('../../assets/Pajama/Render/FAB_001/display/PJ-S.webp'), "PJ-T": require('../../assets/Pajama/Render/FAB_001/display/PJ-T.webp'), "PJ-T0": require('../../assets/Pajama/Render/FAB_001/display/PJ-T0.webp'),
            "PP-D": require('../../assets/Pajama/Render/FAB_001/display/PP-D.webp'), "PP-D0": require('../../assets/Pajama/Render/FAB_001/display/PP-D0.webp'), "PP-K": require('../../assets/Pajama/Render/FAB_001/display/PP-K.webp'), "PP-L": require('../../assets/Pajama/Render/FAB_001/display/PP-L.webp'), "PP-P": require('../../assets/Pajama/Render/FAB_001/display/PP-P.webp'), "PP-P0": require('../../assets/Pajama/Render/FAB_001/display/PP-P0.webp'), "PP-Q": require('../../assets/Pajama/Render/FAB_001/display/PP-Q.webp'), "PP-Q0": require('../../assets/Pajama/Render/FAB_001/display/PP-Q0.webp'), "PP-R": require('../../assets/Pajama/Render/FAB_001/display/PP-R.webp'), "PP-S": require('../../assets/Pajama/Render/FAB_001/display/PP-S.webp'), "PP-T": require('../../assets/Pajama/Render/FAB_001/display/PP-T.webp'), "PP-T0": require('../../assets/Pajama/Render/FAB_001/display/PP-T0.webp'),
            "PS-D": require('../../assets/Pajama/Render/FAB_001/display/PS-D.webp'), "PS-D0": require('../../assets/Pajama/Render/FAB_001/display/PS-D0.webp'), "PS-K": require('../../assets/Pajama/Render/FAB_001/display/PS-K.webp'), "PS-L": require('../../assets/Pajama/Render/FAB_001/display/PS-L.webp'), "PS-P": require('../../assets/Pajama/Render/FAB_001/display/PS-P.webp'), "PS-P0": require('../../assets/Pajama/Render/FAB_001/display/PS-P0.webp'), "PS-Q": require('../../assets/Pajama/Render/FAB_001/display/PS-Q.webp'), "PS-Q0": require('../../assets/Pajama/Render/FAB_001/display/PS-Q0.webp'), "PS-R": require('../../assets/Pajama/Render/FAB_001/display/PS-R.webp'), "PS-S": require('../../assets/Pajama/Render/FAB_001/display/PS-S.webp'), "PS-T": require('../../assets/Pajama/Render/FAB_001/display/PS-T.webp'), "PS-T0": require('../../assets/Pajama/Render/FAB_001/display/PS-T0.webp'),
            "PT-D": require('../../assets/Pajama/Render/FAB_001/display/PT-D.webp'), "PT-D0": require('../../assets/Pajama/Render/FAB_001/display/PT-D0.webp'), "PT-K": require('../../assets/Pajama/Render/FAB_001/display/PT-K.webp'), "PT-L": require('../../assets/Pajama/Render/FAB_001/display/PT-L.webp'), "PT-P": require('../../assets/Pajama/Render/FAB_001/display/PT-P.webp'), "PT-P0": require('../../assets/Pajama/Render/FAB_001/display/PT-P0.webp'), "PT-Q": require('../../assets/Pajama/Render/FAB_001/display/PT-Q.webp'), "PT-Q0": require('../../assets/Pajama/Render/FAB_001/display/PT-Q0.webp'), "PT-R": require('../../assets/Pajama/Render/FAB_001/display/PT-R.webp'), "PT-S": require('../../assets/Pajama/Render/FAB_001/display/PT-S.webp'), "PT-T": require('../../assets/Pajama/Render/FAB_001/display/PT-T.webp'), "PT-T0": require('../../assets/Pajama/Render/FAB_001/display/PT-T0.webp'),
        },
        style: {
            "PA-E": require('../../assets/Pajama/Render/FAB_001/style/PA-E.webp'), "PA-R": require('../../assets/Pajama/Render/FAB_001/style/PA-R.webp'),
            "PB": require('../../assets/Pajama/Render/FAB_001/style/PB.webp'),
            "PC-E": require('../../assets/Pajama/Render/FAB_001/style/PC-E.webp'), "PC-R": require('../../assets/Pajama/Render/FAB_001/style/PC-R.webp'),
            "PD-E": require('../../assets/Pajama/Render/FAB_001/style/PD-E.webp'), "PD-R": require('../../assets/Pajama/Render/FAB_001/style/PD-R.webp'),
            "PJ-E": require('../../assets/Pajama/Render/FAB_001/style/PJ-E.webp'), "PJ-R": require('../../assets/Pajama/Render/FAB_001/style/PJ-R.webp'),
            "PP": require('../../assets/Pajama/Render/FAB_001/style/PP.webp'),
            "PS-E": require('../../assets/Pajama/Render/FAB_001/style/PS-E.webp'), "PS-R": require('../../assets/Pajama/Render/FAB_001/style/PS-R.webp'),
            "PT-E": require('../../assets/Pajama/Render/FAB_001/style/PT-E.webp'), "PT-R": require('../../assets/Pajama/Render/FAB_001/style/PT-R.webp'),
        }
    },
    "FAB_002": {
        display: {},
        style: {}
    },
};

export const SADRI_RENDERS = {
    "FAB_001": {
        display: {
            // CATEGORY A (Closed Neck)
            "SR-F": require('../../assets/Sadri/renders/FAB_001/Display/SR.webp'), "SR-S": null,
            "RR-F": require('../../assets/Sadri/renders/FAB_001/Display/RR.webp'), "RR-S": null,
            "SS-F": require('../../assets/Sadri/renders/FAB_001/Display/SS.webp'), "SS-S": null,
            "AA-F": require('../../assets/Sadri/renders/FAB_001/Display/AA.webp'), "AA-S": null,
            "BB-F": require('../../assets/Sadri/renders/FAB_001/Display/BB.webp'), "BB-S": null,
            "CC-F": require('../../assets/Sadri/renders/FAB_001/Display/CC.webp'), "CC-S": null,
            "DD-F": require('../../assets/Sadri/renders/FAB_001/Display/DD.webp'), "DD-S": null,
            "EE-F": require('../../assets/Sadri/renders/FAB_001/Display/EE.webp'), "EE-S": null,
            "FF-F": require('../../assets/Sadri/renders/FAB_001/Display/FF.webp'), "FF-S": null,
            "GG-F": require('../../assets/Sadri/renders/FAB_001/Display/GG.webp'), "GG-S": null,
            "HH-F": require('../../assets/Sadri/renders/FAB_001/Display/HH.webp'), "HH-S": null,
            "KK-F": require('../../assets/Sadri/renders/FAB_001/Display/KK.webp'), "KK-S": null,

            // CATEGORY B (Deep V / Lapel)
            "LR-F": require('../../assets/Sadri/renders/FAB_001/Display/LR.webp'), "LR-S": null,
            "LS-F": require('../../assets/Sadri/renders/FAB_001/Display/LS.webp'), "LS-S": null,
            "LC-F": require('../../assets/Sadri/renders/FAB_001/Display/LC.webp'), "LC-S": null,
            "MR-F": require('../../assets/Sadri/renders/FAB_001/Display/MR.webp'), "MR-S": null,
            "MS-F": require('../../assets/Sadri/renders/FAB_001/Display/MS.webp'), "MS-S": null,
            "MC-F": require('../../assets/Sadri/renders/FAB_001/Display/MC.webp'), "MC-S": null,
            "NR-F": require('../../assets/Sadri/renders/FAB_001/Display/NR.webp'), "NR-S": null,
            "NS-F": require('../../assets/Sadri/renders/FAB_001/Display/NS.webp'), "NS-S": null,
            "NC-F": require('../../assets/Sadri/renders/FAB_001/Display/NC.webp'), "NC-S": null,
        }
    },
    "FAB_002": {
        display: {}
    }
};

export const COAT_RENDERS = {
    "FAB_001": {
        display: {
            "1B-N-C": require('../../assets/Coat/Render/FAB_001/display/1B-N-C.webp'),
            "1B-N-R": require('../../assets/Coat/Render/FAB_001/display/1B-N-R.webp'),
            "1B-N-S": require('../../assets/Coat/Render/FAB_001/display/1B-N-S.webp'),
            "1B-P-C": require('../../assets/Coat/Render/FAB_001/display/1B-P-C.webp'),
            "1B-P-R": require('../../assets/Coat/Render/FAB_001/display/1B-P-R.webp'),
            "1B-P-S": require('../../assets/Coat/Render/FAB_001/display/1B-P-S.webp'),
            "2B-N-C": require('../../assets/Coat/Render/FAB_001/display/2B-N-C.webp'),
            "2B-N-R": require('../../assets/Coat/Render/FAB_001/display/2B-N-R.webp'),
            "2B-N-S": require('../../assets/Coat/Render/FAB_001/display/2B-N-S.webp'),
            "2B-P-C": require('../../assets/Coat/Render/FAB_001/display/2B-P-C.webp'),
            "2B-P-R": require('../../assets/Coat/Render/FAB_001/display/2B-P-R.webp'),
            "2B-P-S": require('../../assets/Coat/Render/FAB_001/display/2B-P-S.webp'),
            "C1-C": require('../../assets/Coat/Render/FAB_001/display/C1-C.webp'),
            "C1-R": require('../../assets/Coat/Render/FAB_001/display/C1-R.webp'),
            "C1-S": require('../../assets/Coat/Render/FAB_001/display/C1-S.webp'),
            "C2-C": require('../../assets/Coat/Render/FAB_001/display/C2-C.webp'),
            "C2-R": require('../../assets/Coat/Render/FAB_001/display/C2-R.webp'),
            "C2-S": require('../../assets/Coat/Render/FAB_001/display/C2-S.webp'),
            "L1-N": require('../../assets/Coat/Render/FAB_001/display/L1-N.webp'),
            "L1-P": require('../../assets/Coat/Render/FAB_001/display/L1-P.webp'),
            "L2-N": require('../../assets/Coat/Render/FAB_001/display/L2-N.webp'),
            "L2-P": require('../../assets/Coat/Render/FAB_001/display/L2-P.webp'),
            "UP1": require('../../assets/Coat/Render/FAB_001/display/UP1.webp'),
            "JO": require('../../assets/Coat/Render/FAB_001/display/JO.webp'),
            "JR": require('../../assets/Coat/Render/FAB_001/display/JR.webp'),
            "JS": require('../../assets/Coat/Render/FAB_001/display/JS.webp'),
            "JH": require('../../assets/Coat/Render/FAB_001/display/JH.webp'),
        },
        style: {
            "1B-N": require('../../assets/Coat/Render/FAB_001/style/1B-N.webp'),
            "1B-P": require('../../assets/Coat/Render/FAB_001/style/1B-P.webp'),
            "2B-N": require('../../assets/Coat/Render/FAB_001/style/2B-N.webp'),
            "2B-P": require('../../assets/Coat/Render/FAB_001/style/2B-P.webp'),
            "C1": require('../../assets/Coat/Render/FAB_001/style/C1.webp'),
            "C2": require('../../assets/Coat/Render/FAB_001/style/C2.webp'),
            "L1-N": require('../../assets/Coat/Render/FAB_001/style/L1-N.webp'),
            "L1-P": require('../../assets/Coat/Render/FAB_001/style/L1-P.webp'),
            "L2-N": require('../../assets/Coat/Render/FAB_001/style/L2-N.webp'),
            "L2-P": require('../../assets/Coat/Render/FAB_001/style/L2-P.webp'),
            "UP1": require('../../assets/Coat/Render/FAB_001/style/UP1.webp'),
            "NV": require('../../assets/Coat/Render/FAB_001/style/NV.webp'),
            "SV": require('../../assets/Coat/Render/FAB_001/style/SV.webp'),
            "DV": require('../../assets/Coat/Render/FAB_001/style/DV.webp'),
            "JO": require('../../assets/Coat/Render/FAB_001/style/JO.webp'),
            "JR": require('../../assets/Coat/Render/FAB_001/style/JR.webp'),
            "JS": require('../../assets/Coat/Render/FAB_001/style/JS.webp'),
            "JH": require('../../assets/Coat/Render/FAB_001/style/JH.webp'),
            "JH-NV": require('../../assets/Coat/Render/FAB_001/style/JH-NV.webp'),
            "JH-SV": require('../../assets/Coat/Render/FAB_001/style/JH-SV.webp'),
            "JH-DV": require('../../assets/Coat/Render/FAB_001/style/JH-DV.webp'),
        }
    },
    "FAB_002": {
        display: {},
        style: {}
    }
};
