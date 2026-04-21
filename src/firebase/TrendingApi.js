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
