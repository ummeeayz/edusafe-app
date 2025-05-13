// src/js/database.js
import Dexie from 'dexie';

// Create the database
const db = new Dexie('edusafe-db');

// Define database schema
db.version(1).stores({
  documents: '++id, title, category, lastModified, isOfflineAvailable, status, priority, size',
  versions: '++id, documentId, versionNumber, content, createdAt',
  assignments: '++id, title, dueDate, priority, status, subject',
  syncQueue: '++id, action, data, createdAt',
  settings: 'key, value'
});

// Helper functions for document operations
export const DocumentService = {
  async getAllDocuments() {
    return await db.documents.toArray();
  },
  
  async getDocumentById(id) {
    return await db.documents.get(id);
  },
  
  async createDocument(document) {
    const id = await db.documents.add({
      ...document,
      lastModified: new Date(),
      isOfflineAvailable: true,
      status: 'available',
      versions: 1
    });
    
    // Create initial version
    await db.versions.add({
      documentId: id,
      versionNumber: 1,
      content: document.content || '',
      createdAt: new Date()
    });
    
    // Add to sync queue
    await SyncService.addToSyncQueue('create', { documentId: id });
    
    return id;
  },
  
  async updateDocument(id, updates) {
    const document = await db.documents.get(id);
    if (!document) throw new Error('Document not found');
    
    // Update document
    await db.documents.update(id, {
      ...updates,
      lastModified: new Date()
    });
    
    // Create new version if content is updated
    if (updates.content) {
      const versionCount = await db.versions
        .where('documentId')
        .equals(id)
        .count();
      
      await db.versions.add({
        documentId: id,
        versionNumber: versionCount + 1,
        content: updates.content,
        createdAt: new Date()
      });
      
      // Update version count
      await db.documents.update(id, { versions: versionCount + 1 });
    }
    
    // Add to sync queue
    await SyncService.addToSyncQueue('update', { documentId: id, updates });
    
    return id;
  },
  
  async deleteDocument(id) {
    // Mark as deleted rather than actually deleting
    await db.documents.update(id, { 
      status: 'deleted',
      lastModified: new Date()
    });
    
    // Add to sync queue
    await SyncService.addToSyncQueue('delete', { documentId: id });
  },
  
  async getDocumentVersions(documentId) {
    return await db.versions
      .where('documentId')
      .equals(documentId)
      .toArray();
  }
};

// Helper functions for assignment operations
export const AssignmentService = {
  async getAllAssignments() {
    return await db.assignments.toArray();
  },
  
  async createAssignment(assignment) {
    const id = await db.assignments.add({
      ...assignment,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Add to sync queue
    await SyncService.addToSyncQueue('create_assignment', { assignmentId: id });
    
    return id;
  },
  
  async updateAssignment(id, updates) {
    await db.assignments.update(id, updates);
    
    // Add to sync queue
    await SyncService.addToSyncQueue('update_assignment', { assignmentId: id, updates });
    
    return id;
  },
  
  async deleteAssignment(id) {
    await db.assignments.delete(id);
    
    // Add to sync queue
    await SyncService.addToSyncQueue('delete_assignment', { assignmentId: id });
  }
};

// Handling sync operations
export const SyncService = {
  async addToSyncQueue(action, data) {
    return await db.syncQueue.add({
      action,
      data,
      createdAt: new Date(),
      attempts: 0
    });
  },
  
  async processSyncQueue() {
    const isOnline = navigator.onLine;
    if (!isOnline) return { success: false, reason: 'offline' };
    
    try {
      const pendingSyncs = await db.syncQueue.toArray();
      
      // In a real app, this would make API calls to your backend
      console.log('Processing sync queue:', pendingSyncs);
      
      // Simulate successful sync
      for (const syncItem of pendingSyncs) {
        await db.syncQueue.delete(syncItem.id);
      }
      
      return { success: true, syncedCount: pendingSyncs.length };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error };
    }
  },
  
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register('document-sync');
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }
};

// Settings service
export const SettingsService = {
  async getSetting(key, defaultValue) {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  },
  
  async setSetting(key, value) {
    await db.settings.put({ key, value });
  }
};

// Storage analysis service
export const StorageService = {
  async getStorageAnalytics() {
    const documents = await db.documents.toArray();
    
    // Calculate total used storage
    const totalSize = documents.reduce((total, doc) => total + (doc.size || 0), 0);
    
    // Group by category
    const categories = {};
    documents.forEach(doc => {
      const category = doc.category || 'Other';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += (doc.size || 0);
    });
    
    return {
      totalSize,
      categories,
      documentCount: documents.length
    };
  },
  
  async optimizeStorage(options) {
    const results = {
      spaceFreed: 0,
      actionsPerformed: []
    };
    
    // Archive old assignments
    if (options.archiveOld) {
      const oldDocuments = await db.documents
        .where('lastModified')
        .below(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // 90 days old
        .toArray();
      
      for (const doc of oldDocuments) {
        await db.documents.update(doc.id, { status: 'archived' });
      }
      
      const sizeFreed = oldDocuments.reduce((total, doc) => total + (doc.size || 0), 0);
      results.spaceFreed += sizeFreed;
      results.actionsPerformed.push({
        action: 'archived_old_documents',
        count: oldDocuments.length,
        sizeFreed
      });
    }
    
    // Reduce document versions
    if (options.reduceVersions) {
      const documents = await db.documents
        .where('versions')
        .above(5)
        .toArray();
      
      for (const doc of documents) {
        const versions = await db.versions
          .where('documentId')
          .equals(doc.id)
          .sortBy('versionNumber');
        
        // Keep the 5 most recent versions
        const versionsToDelete = versions.slice(0, -5);
        
        for (const version of versionsToDelete) {
          await db.versions.delete(version.id);
        }
        
        // Update document version count
        await db.documents.update(doc.id, { versions: 5 });
      }
      
      results.actionsPerformed.push({
        action: 'reduced_versions',
        count: documents.length,
        sizeFreed: documents.length * 50000 // Rough estimate of space saved per document
      });
      
      results.spaceFreed += documents.length * 50000;
    }
    
    // Simulate other optimization actions
    if (options.compressImages) {
      results.spaceFreed += 800000; // Simulate 800KB saved
      results.actionsPerformed.push({
        action: 'compressed_images',
        sizeFreed: 800000
      });
    }
    
    if (options.clearCache) {
      results.spaceFreed += 300000; // Simulate 300KB saved
      results.actionsPerformed.push({
        action: 'cleared_cache',
        sizeFreed: 300000
      });
    }
    
    return results;
  }
};

export default db;