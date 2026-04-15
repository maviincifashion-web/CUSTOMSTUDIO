# Maviinci website → app: same Firebase (admin = single source)

Portable reminder ported from `suits_website`. Chat history is not required to use this doc.

## Admin panel + website + app — ek hi pipeline

Jo admin se upload hota hai (**fabric profile, renders, button, tuxedo, embroidery**, …) sab **Firebase (Storage + Firestore)** par likha jata hai. Website runtime par **wahin se padhti** hai — koi alag “website-only” database nahi hai.

**App me bhi wahi chahiye:**

1. **Wahi Firebase project** — `projectId` / config website jaisa (ideally env vars).
2. App sirf **read** kare (jaise website): Firestore documents + `src` URLs; **upload logic app me duplicate mat karo** agar admin already sab handle karta hai.
3. **Layer / code generation** website jaisi ho (`getKurtaLayers` …) taaki **doc IDs** admin ne jo Firestore me rakhe hain, unhi names se fetch ho.

Isse admin ek baar update kare → **website + app dono** next fetch par naya data dikha sakte hain — bina app release me hardcoded URL list ke.

## Firebase project (source of truth)

- Config: `src/firebase.js` — `projectId: maviinvi`, Storage bucket, etc.
- **Same project** use karo to fabric / render / button / emb **sab wahi data** milega jo website ko milta hai.

### Admin se related collections (website code ke hisaab se)

Yeh mapping `src/Firebase/firestoreGet.js` + `Fabric/index.js` se hai — app me **same paths** use karo:

| Cheez | Approx Firestore / usage |
|--------|---------------------------|
| Fabric lists per garment | `Fabric` doc `{Suits \| kurta \| formal \| blazer}` → subcollections jaise `Kurta`, `Coat`, … |
| Selected fabric + styles | `Fabric/{coll}/{Garment}_style/{fabricId}` → `display` / `style` subcollections |
| Buttons | `Buttons/{buttonId}` |
| Tuxedo | `Fabric/{coll}/tuxedo/{...}` |
| Embroidery | `Fabric/embroidery/{kurta_collections \| Suits_collections \| …}` + `styles` |

Exact tree admin panel jaisa hi hona chahiye — **app ka kaam website jaisa reader banana**, schema fork mat karna warna do jagah upload lagenge.

## Kaunsi files yahan se dekhni / port karni hain

| File | Kyun |
|------|------|
| `src/firebase.js` | Firestore `db` init — naye project mein env se config |
| `src/Firebase/firestoreGet.js` | `getDatafromDoc(docRef)` → document se `src` field |
| `src/Fabric/index.js` | `Fabric/${coll}/${Garment}_style/${fabricId}` + `display` / `style` subcollections se fetch loop |
| `src/Functions/index.js` | `getKurtaLayers`, `getSadriLayers`, `getPajamaLayers`, `getCoatLayers` — layer **doc IDs** |
| `src/Fabric/View/viewImages.js` | URLs ko stack karke dikhane ka pattern (reference UI) |

## Firestore path pattern (important)

- Fabric root: `Fabric/{coll}/` jahan `coll` = `kurta` | `Suits` | `formal` | `blazer` (kurta/sadri ke liye website `kurta` use karti hai).
- Ek fabric: `Fabric/kurta/Kurta_style/{fabricId}` (document).
- Uske andar subcollections:
  - **`display`** — composite / preview layers
  - **`style`** — style-slide layers
- Har layer = ek **document ID** (jaise `NS4`, `R`, `SE0`), field **`src`**: image URL(s).

Buttons: `Buttons/{buttonDocId}` (coat/vest etc. ke liye ref `Fabric/index.js` mein).

## Minimal port checklist

1. App mein Firebase SDK + **same** `projectId` (ya data mirror).
2. `getDatafromDoc` jaisa helper: `docRef.get()` → `data.src`.
3. Layer names `getKurtaLayers` (etc.) se generate karo, phir same order mein Firestore se `src` lo.
4. Firestore **security rules** mein app clients ko bhi **read** allow ho (website ke rules jaisa; agar sirf web allow ho to app blank / permission error dega).
5. Local folder / manual URL map **optional dev-only**; production me goal = **sab kuch admin → Firebase → app**, website jaisa.

## App render guide vs website

- Native app = `layerEngine` / `KurtaModel` style; **website** = `Functions/index.js` + `Fabric/index.js`.
- Dono ka **end result** same hona chahiye: **Firestore doc IDs + `src`**.

See also: `RENDER_LOGIC_GUIDE.md` in this app repo.
