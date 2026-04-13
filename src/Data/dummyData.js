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
            "BSR-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BSR.webp'),
            "BRR-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BRR.webp'),
            "BSS-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BSS.webp'),
            "BAA-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BAA.webp'),
            "BBB-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BBB.webp'),
            "BCC-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BCC.webp'),
            "BDD-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BDD.webp'),
            "BEE-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BEE.webp'),
            "BFF-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BFF.webp'),
            "BGG-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BGG.webp'),
            "BHH-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BHH.webp'),
            "BKK-F": null,
            "BLR-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BLR.webp'),
            "BLS-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BLS.webp'),
            "BLC-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BLC.webp'),
            "BMR-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BMR.webp'),
            "BMS-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BMS.webp'),
            "BMC-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BMC.webp'),
            "BNR-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BNR.webp'),
            "BNS-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BNS.webp'),
            "BNC-F": require('../../assets/images/button_sadri/fabric_button/render/button_001/BNC.webp')
        }
    }
];

export const EMBROIDERY_COLLECTIONS = [
    {
        id: "DDF01",
        name: "Naqsh E Darbaar",
        price: 3500,
        profileImage: require('../../assets/kurta/Embroidery/Profiles/DDF01.jpg'),
        profileImageSadri: null,
        availableRegions: ["Chest", "Collar", "Sleeve"]
    },
    {
        id: "DDF02",
        name: "Sadri Chest Embroidery",
        price: 3500,
        profileImage: require('../../assets/Sadri/Embroidery/Profiles/DDF02.jpg'),
        profileImageSadri: require('../../assets/Sadri/Embroidery/Profiles/DDF02.jpg'),
        availableRegions: ["Chest"]
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
    sadriEmbroideryID: null, // Sadri chest (left+right asset folders)
    pajamaType: 'PJ',
    beltType: 'R',
    sadriType: 'SR'
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
// Sadri chest layer codes: `E-{finalSadriCode}` — only styles listed here have embroidery (LEFT+RIGHT both required on disk).
// If a sadri style is missing from these maps, no embroidery is shown for that style (see layerEngine).

const DDF02_SADRI_LEFT_CORE = {
    'E-SR': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/ESR.webp'),
    'E-RR': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/ERR.webp'),
    'E-BB': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EBB.webp'),
    'E-FF': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EFF.webp'),
    'E-GG': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EGG.webp'),
    'E-HH': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EHH.webp'),
    'E-KK': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EKK.webp'),
    'E-LR': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/ELR.webp'),
    'E-LS': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/ELS.webp'),
    'E-LC': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/ELC.webp'),
    'E-MR': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EMR.webp'),
    'E-MS': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EMS.webp'),
    'E-MC': require('../../assets/Sadri/Embroidery/Renders/DDF02/LEFT/EMC.webp')
};
const DDF02_SADRI_RIGHT_CORE = {
    'E-SR': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/ESR.webp'),
    'E-RR': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/ERR.webp'),
    'E-BB': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EBB.webp'),
    'E-FF': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EFF.webp'),
    'E-GG': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EGG.webp'),
    'E-HH': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EHH.webp'),
    'E-KK': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EKK.webp'),
    'E-LR': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/ELR.webp'),
    'E-LS': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/ELS.webp'),
    'E-LC': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/ELC.webp'),
    'E-MR': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EMR.webp'),
    'E-MS': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EMS.webp'),
    'E-MC': require('../../assets/Sadri/Embroidery/Renders/DDF02/RIGHT/EMC.webp')
};

export const EMBROIDERY_RENDERS = {
    "DDF01": {
        display: {
            "E-D-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-D-F.webp'),
            "E-D0-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-D0-F.webp'),
            "E-K-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-K-F.webp'),
            "E-L-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-L-F.webp'),
            "E-P-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-P-F.webp'),
            "E-P0-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-P0-F.webp'),
            "E-Q-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-Q-F.webp'),
            "E-Q0-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-Q0-F.webp'),
            "E-R-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-R-F.webp'),
            "E-S-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-S-F.webp'),
            "E-T-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-T-F.webp'),
            "E-T0-F": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-T0-F.webp')
        },
        folded: {
            "E-BASE-S": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-BASE-S.webp'),
            "E-BASE_C-S": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-BASE-S.webp'),
            "E-BASE_M-S": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-BASE-S.webp'),
            "E-BASE_R-S": require('../../assets/kurta/Embroidery/Renders/DDF01/Chest/E-BASE_R-S.webp')
        }
    },
    "DDF02": {
        display: {},
        sadriChestLeft: DDF02_SADRI_LEFT_CORE,
        sadriChestRight: DDF02_SADRI_RIGHT_CORE,
        folded: {}
    }
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
