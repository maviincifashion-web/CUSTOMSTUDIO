// src/customizers/Sadri/components/SadriFoldedEmbroidery.js

// This file contains only the Sadri folded embroidery rendering logic, separated from KurtaFolded.js for clarity and maintainability.

import { parseEmbroideryValuePlacement } from '../../Kurta/components/KurtaFolded';

/**
 * Returns embroidery layers for Sadri folded view, using parent-child propagation logic.
 * @param {object} selections - User selections (must include embroideryID, embroideryCollection)
 * @returns {Array} Array of embroidery layer objects for Sadri folded view
 */
export function getSadriFoldedEmbroideryLayers(selections) {
    const layersToRender = [];
    if (!selections.embroideryID || !selections.embroideryCollection) return layersToRender;

    // Collect all embroidery values by part
    const embByPart = {};
    selections.embroideryCollection.matchingValues?.forEach((value) => {
        const code = String(value?.code || value?.id || '').trim();
        if (!code) return;
        const placement = parseEmbroideryValuePlacement(value);
        if (!placement.part) return;
        if (!embByPart[placement.part]) embByPart[placement.part] = [];
        embByPart[placement.part].push({ code, value });
    });

    // Parent-child propagation rules for Sadri (customize as needed)
    if (embByPart['base']) {
        ['pocket', 'flap'].forEach((childPart) => {
            if (!embByPart[childPart]) {
                embByPart[childPart] = embByPart['base'].map((emb) => ({ ...emb, propagatedFrom: 'base' }));
            }
        });
    }

    // Now render all embroideries (original and propagated)
    Object.entries(embByPart).forEach(([part, embList]) => {
        embList.forEach((emb) => {
            let zIndex = 50;
            if (part === 'base') zIndex = 11;
            else if (part === 'pocket') zIndex = 31;
            else if (part === 'flap') zIndex = 33;
            else if (part === 'collar' || part === 'lapel') zIndex = 66;
            layersToRender.push({
                code: emb.code,
                zIndex: zIndex,
                type: 'embroidery',
                collectionID: selections.embroideryID,
                part: part,
                propagatedFrom: emb.propagatedFrom || null
            });
        });
    });
    return layersToRender;
}
