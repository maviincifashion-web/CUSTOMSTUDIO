// src/Data/pajamaFabrics.js

export const PAJAMA_FABRIC_PROFILES = [
    {
        fabricID: "PFAB_001",
        name: "Manila 970",
        brand: "Siyarams",
        description: "Premium ethnic wear fabric with a smooth finish.",
        colors: ["Spicy Pink", "Grey"],
        hexCodes: ["#c18b95", "#808080"],
        weave: "plain",
        composition: "Poly Viscose",
        pattern: "Solid",
        width: "58 inches",
        weight: "120 GSM",
        stock: 100,
        price: 4200,
        thumbnail: require('../../assets/images/fabrics/manila970.jpg')
    },
    {
        fabricID: "PFAB_002",
        name: "Genius 61",
        brand: "MAVIINCI",
        description: "Vibrant and lightweight for summer weddings.",
        colors: ["Mint Green"],
        hexCodes: ["#4ade80"],
        weave: "twill",
        composition: "100% Cotton",
        pattern: "Textured",
        width: "60 inches",
        weight: "140 GSM",
        stock: 50,
        price: 2800,
        thumbnail: require('../../assets/images/fabrics/genius61.jpg')
    }
];
