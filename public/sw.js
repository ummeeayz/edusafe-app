// This is the service worker for the EduSafe application
// It handles offline functionality and caching

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { warmStrategyCache } from 'workbox-recipes';

// Pre-cache core application assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache static assets (images, fonts, etc.)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache CSS and JavaScript files
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Default strategy for everything else
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'navigation',
  })
);

// Background sync for document changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'document-sync') {
    event.waitUntil(syncDocuments());
  }
});

// Function to sync documents when online
async function syncDocuments() {
  try {
    // Get pending changes from IndexedDB
    const db = await openDB('edusafe-sync', 1, {
      upgrade(db) {
        db.createObjectStore('pending-changes');
      }
    });
    
    const tx = db.transaction('pending-changes', 'readwrite');
    const store = tx.objectStore('pending-changes');
    const pendingChanges = await store.getAll();
    
    // Process each pending change
    for (const change of pendingChanges) {
      // In a real app, this would make API calls to your backend
      console.log('Syncing change:', change);
      
      // After successful sync, remove from pending changes
      await store.delete(change.id);
    }
    
    await tx.complete;
    
    // Notify app that sync is complete
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          timestamp: new Date().toISOString()
        });
      });
    });
    
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});