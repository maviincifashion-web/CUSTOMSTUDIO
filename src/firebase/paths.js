/**
 * Firestore layout mirrors `suits_website` / admin. Tweak segment names here if your tree differs.
 * @see docs/FIREBASE_RENDER_PORTING.md
 */

export const KURTA_COLLECTION = 'kurta';

/** List + per-fabric docs: Fabric / {coll} / {Garment}_style / {fabricId} */
export const garmentStyleSegments = {
  kurta: 'Kurta_style',
  pajama: 'Pajama_style',
  sadri: 'Sadri_style',
  coat: 'Coat_style',
};

/**
 * Website `getStyleImg`: `refString = Fabric/${coll}/${Garment}_style/${fabric.id}` with
 * `coll === "kurta"` for category kurta/sadri — so Coat is `Fabric/kurta/Coat_style/{id}`, not Suits.
 */
export function fabricGarmentPath(garment, fabricId) {
  const style = garmentStyleSegments[garment];
  return ['Fabric', KURTA_COLLECTION, style, fabricId];
}

/** Collection path for kurta fabric IDs (list documents). */
export function kurtaFabricListPath() {
  return ['Fabric', KURTA_COLLECTION, garmentStyleSegments.kurta];
}

/**
 * Master fabric catalog (SUITS_WEBSITE: getFabricDetails1 / getDocsFromQueryForFabrics).
 * `Fabric.collection("Suits").doc(...).collection("fabrics")` → modular: `Fabric/Suits/fabrics`
 */
export const SUITS_MASTER_FABRICS_PATH = ['Fabric', 'Suits', 'fabrics'];

/**
 * Try these in order until one returns documents.
 * Website uses Suits/fabrics for the shared catalog; Kurta_style holds per-fabric layers under Fabric/kurta/...
 */
export const KURTA_FABRIC_LIST_PATH_CANDIDATES = [
  ['Fabric', 'Suits', 'fabrics'],
  ['Fabric', 'kurta', 'Kurta_style'],
  ['Fabric', 'kurta', 'Kurta'],
  ['Fabric', 'Kurta', 'Kurta_style'],
  ['Fabric', 'Kurta', 'Kurta'],
  ['Fabric', 'Suits', 'Kurta_style'],
  ['Fabric', 'Suits', 'Kurta'],
];
