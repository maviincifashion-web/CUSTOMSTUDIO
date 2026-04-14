// src/data/fabrics.js

export const FABRIC_PROFILES = [
    {
        fabricID: "FAB_001", // Ye wo ID hai jo render ko isse jodegi
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
        price: 9600, // Base price + Fabric price calculate karne ke liye
        // React Native mein local image load karne ke liye require() use hota hai
        thumbnail: require('../../assets/images/fabrics/manila970.jpg') 
    },
     {
        fabricID: "FAB_003", // Ye wo ID hai jo render ko isse jodegi
        name: "FAB_003",
        brand: "Raymond",
        description: "Premium ethnic wear fabric with a smooth finish.",
        colors: ["Spicy Pink", "Grey"],
        hexCodes: ["#c18b95", "#808080"],
        weave: "plain",
        composition: "Poly Viscose",
        pattern: "Solid",
        width: "58 inches",
        weight: "120 GSM",
        stock: 100,
        price: 9600, // Base price + Fabric price calculate karne ke liye
        // React Native mein local image load karne ke liye require() use hota hai
        thumbnail: require('../../assets/images/fabrics/FAB_003.jpg') 
    },
    {
        fabricID: "FAB_002",
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
        price: 5550,
        thumbnail: require('../../assets/images/fabrics/genius61.jpg')
    }
];