# Maviinci Render Logic Guide (Kurta / Sadri / Coat / Pajama)

This document captures the full rendering logic currently used in `MaviinciApp` so it can be reused in another project.

## 1) Core Source Files

- `src/Functions/layerEngine.js`
  - Kurta and Sadri layer-code generation logic
  - Collar-category logic and outerwear overrides
- `src/customizers/Kurta/components/KurtaModel.js`
  - Runtime layer resolution to image sources
  - Coat display/style/button logic
  - Layer ordering and render conditions
- `src/customizers/Kurta/components/KurtaFolded.js`
  - Folded kurta-specific layer logic
- `src/customizers/Kurta/components/PajamaStylePreview.js`
  - Pajama-only slide style-code and fallback handling
- `src/Data/styleData.js`
  - UI option value mappings (critical for code generation)

---

## 2) Data/Selection Model (Important Keys)

Expected selection keys used by logic:

- Kurta: `length`, `bottomCut`, `placketStyle`, `pocketQty`, `pocketShape`, `flapYes`, `flapShape`, `epaulette`, `collar`, `sleeve`, `cuffStyle`
- Outerwear: `sadriType`, `coatType`, `coatLapel`, `coatBackStyle`
- Embroidery: `embroideryID`, `sadriEmbroideryID`
- Pajama: `pajamaType`, `beltType`
- Buttons: selected button objects for kurta/sadri/coat with `material` and `renders` maps

---

## 3) Collar Groups

Defined in `layerEngine.js`:

- Shirt collars: `CR`, `CB`, `CT`, `CS`, `CE`
- Mandarin/chinese family: `CM`, `CC`, `CN`

Helpers:

- `isShirtCollar(collar)`
- `isMandarinCollar(collar)`

Sadri suffix resolver (`getSadriCollarSuffix`):

- `CN -> R`
- `CM/CC -> C`
- Shirt collars -> `S`
- fallback -> `R`

---

## 4) Sadri Type System (Final Correct Mapping)

### Category A (direct 12 normal types)

`SR, RR, SS, AA, BB, CC, DD, EE, FF, GG, HH, KK`

- These are closed-neck category behavior in kurta overrides.

### Category B base types (3 special types)

`L, M, N`

Resolved by collar suffix into:

- Heritage: `LR` (round), `LS` (shirt), `LC` (kurta/mandarin)
- Classic Lapel: `MR`, `MS`, `MC`
- Urban Safari: `NR`, `NS`, `NC`

In `styleData.js` these option values must be:

- Classic Lapel -> `M`
- Heritage -> `L`
- Urban Safari -> `N`

If these are set to any other codes (`CL`, `HT`, `US` etc.), rendering breaks.

---

## 5) Sadri Layer Code Generation

Function: `getSadriLayerCodes(sadriCode, selections, selectedSadriButton, viewMode, slideIndex)`

Flow:

1. Resolve `finalSadriCode`
   - If Category A: use direct code
   - If Category B base (`L/M/N`) or prefixed variant: append collar suffix
2. Add sadri fabric layer:
   - `SadriBase -> ${finalSadriCode}${bSuffix}` as `sadri_fabric` (zIndex 75)
3. Sadri button layer:
   - Hidden when `finalSadriCode === 'KK'`
   - Hidden when button material is `Ring`
   - Else add `B${finalSadriCode}${bSuffix}` as `sadri_button` (zIndex 80)
4. Sadri embroidery:
   - Uses `E-${finalSadriCode}` lookup in `EMBROIDERY_RENDERS`

---

## 6) Kurta Layer Engine (Main)

Function: `getKurtaLayerCodes(selections, selectedButton, selectedEmbCol, viewMode, hasCoat, hasSadri, currentSadriCode)`

### Phase A: Effective Overrides for Outerwear

When outerwear visible (`viewMode === 0 || viewMode === 4`) and coat/sadri is active:

- `SE -> SE0` (epaulette half-hide)
- Coat + view 0: force inner kurta sleeve `SS`
- Jodhpuri coat + view 0: force inner collar `CM`

#### Sadri-specific override

If `hasSadri && !hasCoat`:

- Category A sadri:
  - force collar `CM`
  - hide pockets (`pocketQty='00'`)
  - placket forced to `*S4`
- Category B sadri:
  - keep user collar
  - shirt collar -> placket `*T3`
  - mandarin/chinese -> placket `*S4`

### Phase B: Base code resolution

`getKurtaBaseCode(collar, length, bottomCut, hasOuterwearBase, forceMandarin)`

- Shirt-collar branch may produce `D0/T0/P0/Q0` when outerwear base needed
- Mandarin/round branch produces `R/S/K/L` patterns

### Phase C: Layer push order (z-index)

Nominal order:

- Pajama: 5
- Chest/base: 10
- Placket: 20
- Pockets/flaps/buttons: 30+
- Epaulette: default 45
- Sleeves/cuffs: 55+
- Collar: 65
- Button holes/buttons: 70+

### Epaulette special behavior (final)

- If `epaulette === 'SE'`: render epaulette + button layers (`HE`, `BE...`)
- If `epaulette === 'SE0'`:
  - render epaulette fabric only (no button)
  - z-index is elevated above sadri (set to `90`)

---

## 7) Coat Logic

In `KurtaModel.js`:

### Display coat codes (`slideIndex === 0`)

- For `JH/JR/JS`: `[coatType, 'UP1']`
- For `JO`: `[ 'JO' ]`
- For 1B/2B: includes body+collar+lapel layer code set

### Style coat-only slides

- Front style slide: `slideIndex === 4`
- Back style slide: `slideIndex === 5`
- Codes resolved by `getStyleFrontCoatCodes`, `getStyleBackCoatCodes`

### Coat button rules (final)

Function: `getCoatButtonCodes(selections, slideIndex)`

- `hideFrontMainButtons = (coatType === 'JH' || coatType === 'JO')`

`slideIndex === 0` (composite front):

- If hidden type (`JH/JO`) -> no front/main button
- Else:
  - 1B/2B -> `BC-1B-F` / `BC-2B-F`
  - other jodhpuri -> `BC-JH-F`

`slideIndex === 4` (coat front):

- If hidden type (`JH/JO`) -> no front/main button
- Else push front/main button (`BC-...-S`)
- Always push sleeve button: `BCS-S`

`slideIndex === 5` (coat back):

- sleeve/back button: `BCS-B`

So:

- Seamless (JH): no front button, sleeve button visible
- Open coat (JO): no front button, sleeve button visible

---

## 8) Pajama Logic

In `PajamaStylePreview.js`:

- Style code:
  - `PP/PB` -> direct (`PP` or `PB`)
  - otherwise `${pajamaType}-${beltType}` (example: `PA-E`)

Fallback handling (critical):

- If selected fabric pajama map missing/empty, fallback to `PAJAMA_RENDERS['FAB_001'].style`
- If specific style missing in selected map, fallback to same style key from `FAB_001`

This prevents blank “Only Pajama” slide.

---

## 9) Folded Kurta Logic

In `KurtaFolded.js`:

- Base code from collar:
  - shirt -> `BASE`
  - `CC` -> `BASE_C`
  - mandarin -> `BASE_M`
  - fallback -> `BASE_R`
- Placket:
  - `BASE_R -> ${placket}R`
  - `BASE_C -> ${placket}C`
  - else -> `${placket}0`

Then same style of pockets/flaps/cuffs/collar/epaulette/button layering for folded look.

UI note:

- Folded container background set to `transparent` (no separate bg patch).

---

## 10) Render Ordering + Key Stability

`KurtaModel` and `KurtaFolded` use `SmartLayer` + mapped arrays.

Duplicate key warning fix:

- Use keys including type + code + zIndex + index
- Avoid keys only based on `type + zIndex`

Recommended key format:

- `layer-${type}-${code}-${zIndex}-${index}`

---

## 11) StyleData Mapping Rules (Must Keep)

Sadri:

- Essential Nehru -> `SR`
- Signature Curve -> `RR`
- Command -> `SS`
- Ranger -> `AA`
- Elite Minimal -> `BB`
- Metro Utility -> `CC`
- Avant Edge -> `DD`
- Officer -> `EE`
- Royal Wrap -> `FF`
- Modern Royal -> `GG`
- Royal Asym -> `HH`
- Imperial Seamless -> `KK`
- Classic Lapel -> `M`
- Heritage -> `L`
- Urban Safari -> `N`

Coat icons should map to actual coat SVGs (not placeholder icons).

---

## 12) SVG Notes (UI)

- Some icons were set to transparent fill to remove white boxes.
- For special sadri icons (`Classic Lapel`, `Heritage`, `Urban Safari`), fill was later reverted to white on request.

If visual style differs in new project, this is the first place to adjust.

---

## 13) Quick Port Checklist (For New Project)

1. Port `layerEngine` first (without UI).
2. Port `KurtaModel` layer resolution with same type routing.
3. Port `styleData` values exactly (especially sadri special 3).
4. Ensure render assets cover:
   - kurta display/style
   - sadri display
   - coat display/style
   - pajama style/display
5. Add fallbacks:
   - sadri render fallback map
   - pajama render fallback map
6. Validate coat button rules (`JH`, `JO`) and `SE` vs `SE0`.
7. Validate z-index behavior (`SE0` above sadri).
8. Validate React keys are unique.

---

## 14) Prompt Template You Can Reuse

Use this in the new project to remind the assistant:

> Implement render logic exactly as in `RENDER_LOGIC_GUIDE.md`:
> - Same Kurta/Sadri/Coat/Pajama code generation
> - Same category mapping for Sadri (12 normal + L/M/N special with suffix)
> - Same coat button rules (`JH` and `JO` no front/main button, sleeve button visible)
> - Same `SE` vs `SE0` behavior (`SE0` no button, above sadri z-index)
> - Same fallback behavior for missing render maps
> - No deviations unless explicitly asked.

