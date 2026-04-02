// src/Functions/layerEngine.js

export const getKurtaLayerCodes = (selections, hasCoat = false, hasSadri = false) => {
    
    // --- 1. EXTREME SAFETY CHECKS ---
    if (!selections) return []; 

    // Agar koi value undefined hai, toh use default de do taaki crash na ho
    const collar = selections.collar || "CM";
    const bottomCut = selections.bottomCut || "R";
    const lengthStr = selections.length || "K";
    const placketStyle = selections.placketStyle || "NS";
    const pocketQty = selections.pocketQty || "00";
    const pocketShape = selections.pocketShape || "R";
    const flapYes = selections.flapYes || "0";
    const flapShape = selections.flapShape || "R";
    const epaulette = selections.epaulette || "0";
    const sleeve = selections.sleeve || "SN";
    const cuffStyle = selections.cuffStyle || "US1";

    const shirt_collars = ["CR", "CB", "CT", "CS", "CE"];
    const isShirtCollar = shirt_collars.includes(collar);
    
    const isLongLength = lengthStr === 'K';
    const isRoundCut = bottomCut === 'R';

    let layersToRender = []; 

    // --- 2. BASE LAYER ---
    let baseCode = "R"; // Default
    if (isShirtCollar) {
        if (isLongLength) {
            baseCode = isRoundCut ? "D" : "T";
            if (hasCoat || hasSadri) baseCode += "0"; 
        } else {
            baseCode = isRoundCut ? "P" : "Q";
            if (hasCoat || hasSadri) baseCode += "0"; 
        }
    } else {
        if (isLongLength) {
            baseCode = isRoundCut ? "R" : "S";
        } else {
            baseCode = isRoundCut ? "K" : "L";
        }
    }
    layersToRender.push({ code: baseCode, zIndex: 10 }); 

    // --- 3. PLACKET ---
    let placketCode = placketStyle;
    if (hasCoat || hasSadri) {
        // Under outerwear, neck plackets switch to NT3 / QT3
        const prefix = placketStyle.charAt(0); // N or Q
        placketCode = `${prefix}T3`;
    } else {
        placketCode = placketCode + (isShirtCollar ? "3" : "4");
    }
    layersToRender.push({ code: placketCode, zIndex: 20 });

    // --- 4. POCKETS & FLAPS ---
    if (pocketQty !== "00") {
        layersToRender.push({ code: `R${pocketShape}`, zIndex: 30 });
        if (flapYes === "1") layersToRender.push({ code: `FR${flapShape}`, zIndex: 31 });

        if (pocketQty === "11") {
            layersToRender.push({ code: `L${pocketShape}`, zIndex: 32 });
            if (flapYes === "1") layersToRender.push({ code: `FL${flapShape}`, zIndex: 33 });
        }
    }

    // --- 5. EPAULETTE (Shoulder) ---
    if (epaulette === "SE") {
        layersToRender.push({ code: hasSadri ? "SE0" : "SE", zIndex: 35 });
    }

    // --- 6. SLEEVES & CUFFS ---
    let sleeveCode = hasCoat ? "SS" : sleeve;
    layersToRender.push({ code: sleeveCode, zIndex: 40 });
    
    if (sleeve === "SC") {
        layersToRender.push({ code: cuffStyle, zIndex: 41 }); 
    }

    // --- 7. COLLAR ---
    layersToRender.push({ code: collar, zIndex: 50 });

    return layersToRender;
};