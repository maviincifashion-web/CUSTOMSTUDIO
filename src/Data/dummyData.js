// src/Data/dummyData.js
import { FABRIC_PROFILES } from './fabrics';
import { KURTA_RENDERS as KURTA_RENDERS_SOURCE } from './kurtaRenders';

export const DUMMY_FABRICS = FABRIC_PROFILES;

export const INITIAL_SELECTION = {
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
    cuffStyle: 'US1'
};

export const KURTA_RENDERS = KURTA_RENDERS_SOURCE;
