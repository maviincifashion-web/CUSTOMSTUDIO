import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { getFirestoreDb } from './config';

/**
 * Fetch top trending designs from the Presets collection.
 * @param {number} limitCount Number of items to fetch (default 8)
 */
export async function fetchTrendingPresets(limitCount = 8) {
  try {
    const db = getFirestoreDb();
    if (!db) return [];

    const presetsRef = collection(db, 'Presets');
    // We fetch by item_type: 1 or simply limit to the latest 8 for trending
    const q = query(presetsRef, limit(limitCount)); 
    
    const snap = await getDocs(q);
    const products = [];
    
    snap.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name || 'Untitled Design',
        price: data.price || '0',
        image: data.src || null,
        category: data.category || 'suit',
        discount: data.discount || 0,
        customize: data.customize !== undefined ? data.customize : false,
      });
    });
    
    return products;
  } catch (error) {
    console.error('[TrendingApi] Error fetching presets:', error);
    return [];
  }
}

/**
 * Fetch all designs from the Presets collection with optional category filtering.
 * @param {string} category Optional category to filter by (e.g., 'kurta', 'suit')
 */
export async function fetchAllPresets(category = null) {
  try {
    const db = getFirestoreDb();
    if (!db) return [];

    const presetsRef = collection(db, 'Presets');
    let q;
    
    if (category && category.toLowerCase() !== 'all') {
      // Assuming 'category' field exists and is lowercase in Firestore
      q = query(presetsRef, orderBy('name')); // Basic query for now
      // Note: In real scenarios, query and category filtering should be done in Firestore
      // For now, we fetch and filter to ensure matching user-visible tab names
    } else {
      q = query(presetsRef, orderBy('name'));
    }
    
    const snap = await getDocs(q);
    const products = [];
    
    snap.forEach((doc) => {
      const data = doc.data();
      
      // Determine Item Type (Single vs Set) based on components
      const selection = data.Selection || data.selection || data.config || {};
      const selectionKeys = Object.keys(selection).map(k => k.toLowerCase());
      
      const garmentKeywords = ['kurta', 'pajama', 'sadri', 'coat', 'shirt', 'pant', 'vest', 'vest coat', 'vestcoat'];
      
      // Count distinct garment types present in selection
      let componentCount = garmentKeywords.filter(keyword => 
        selectionKeys.some(key => key.includes(keyword))
      ).length;

      // Special case: if category is 'suit' or 'formal', it's almost certainly a set
      const isSetCategory = ['suit', 'formal', 'outfit', 'set'].includes((data.category || '').toLowerCase());
      
      // If we couldn't find components in 'selection', check top-level data fields that imply multiple items
      if (componentCount <= 1) {
        const topLevelKeys = Object.keys(data).map(k => k.toLowerCase());
        const topLevelGarmentCount = garmentKeywords.filter(keyword => 
          topLevelKeys.some(key => key.includes(keyword) && data[key])
        ).length;
        componentCount = Math.max(componentCount, topLevelGarmentCount);
      }

      const product = {
        id: doc.id,
        name: data.name || 'Untitled Design',
        price: data.price || '0',
        image: data.src || null,
        category: (data.category || 'suit').toLowerCase(),
        discount: data.discount || 0,
        customize: data.customize !== undefined ? data.customize : false,
        itemType: (componentCount > 1 || isSetCategory) ? 'set' : 'single'
      };

      // Client-side category filtering for more flexibility with tab names
      if (!category || category.toLowerCase() === 'all' || product.category === category.toLowerCase()) {
        products.push(product);
      }
    });
    
    return products;
  } catch (error) {
    console.error('[TrendingApi] Error fetching all presets:', error);
    return [];
  }
}
