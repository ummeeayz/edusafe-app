// src/js/app.js
import { 
  DocumentService, 
  AssignmentService, 
  SyncService, 
  StorageService,
  SettingsService 
} from './database';
import { 
  createElement, 
  createDocumentItem, 
  createAssignmentItem, 
  showToast, 
  createModal 
} from './ui/components';
import { format } from 'date-fns';
// Import sample data for initial setup
import { populateSampleData } from './sampleData';

class EduSafeApp {
  constructor() {
    this.isOnline = navigator.onLine;
    this.initializeApp();
  }
  
  async initializeApp() {
    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }
  
  async setupApp() {
    // Create and inject app structure
    this.injectAppHTML();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Register service worker
    this.registerServiceWorker();
    
    // Load initial data
    await this.loadInitialData();
    
    // Set up connection monitoring
    this.monitorConnection();
    
    // Hide loading screen
    this.hideLoadingScreen();
  }
  
  // Inject the main HTML structure into the app container
  injectAppHTML() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = this.getAppHTML();
  }
  
  // Get the HTML structure for the application
  getAppHTML() {
    return `
      <!-- Loading Screen -->
      <div id="loading-screen" class="fixed inset-0 bg-white dark:bg-dark flex items-center justify-center z-50">
          <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-4">
                  <svg class="w-full h-full" viewBox="0 0 100 100">
                      <circle class="progress-ring-circle" cx="50" cy="50" r="45" fill="none" stroke="#5D5CDE" stroke-width="8"></circle>
                  </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">EduSafe</h2>
              <p class="text-gray-600 dark:text-gray-400 text-sm">Securing your academic journey</p>
          </div>
      </div>

      <!-- Header -->
      <header class="px-4 py-3 bg-primary text-white flex justify-between items-center">
          <div class="flex items-center">
              <h1 class="font-bold text-lg">EduSafe</h1>
              <div id="connection-status" class="ml-2 px-2 py-0.5 text-xs rounded-full bg-success">Online</div>
          </div>
          <div class="flex items-center">
              <button id="sync-button" class="mr-2 p-1 rounded-full hover:bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
              </button>
              <button id="notification-button" class="p-1 rounded-full hover:bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
              </button>
          </div>
      </header>

      <!-- Main Content Area -->
      <main class="p-4 pb-20">
          <!-- Storage Status -->
          <section class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div class="flex justify-between items-center mb-3">
                  <h2 class="font-semibold text-gray-800 dark:text-white">Storage Status</h2>
                  <span id="storage-percentage" class="text-sm text-primary font-medium">32% used</span>
              </div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div id="storage-bar" class="h-full bg-primary rounded-full" style="width: 32%"></div>
              </div>
              <div id="storage-categories" class="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                  <!-- Categories will be inserted here -->
              </div>
              <button id="optimize-storage-btn" class="mt-3 w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition">Optimize Storage</button>
          </section>

          <!-- Document Library -->
          <section class="mb-6">
              <div class="flex justify-between items-center mb-3">
                  <h2 class="font-semibold text-gray-800 dark:text-white">Recent Documents</h2>
                  <button id="emergency-backup-btn" class="text-xs px-3 py-1 bg-warning text-white rounded-full hover:bg-warning/90 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Emergency Backup
                  </button>
              </div>
              <div id="documents-container">
                  <!-- Documents will be inserted here -->
              </div>
              <button id="add-document-btn" class="w-full py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-primary rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Document
              </button>
          </section>

          <!-- Upcoming Assignments -->
          <section class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 class="font-semibold text-gray-800 dark:text-white mb-3">Upcoming Assignments</h2>
              <div id="assignments-container" class="space-y-3">
                  <!-- Assignments will be inserted here -->
              </div>
          </section>
      </main>

      <!-- Bottom Navigation -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around py-2 max-w-md mx-auto">
          <button id="nav-home" class="flex flex-col items-center justify-center w-1/5 py-1 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7m-14 0l2 2m0 0l7 7 7-7" />
              </svg>
              <span class="text-xs">Home</span>
          </button>
          <button id="nav-docs" class="flex flex-col items-center justify-center w-1/5 py-1 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span class="text-xs">Docs</span>
          </button>
          <button id="nav-calendar" class="flex flex-col items-center justify-center w-1/5 py-1 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-xs">Calendar</span>
          </button>
          <button id="nav-study" class="flex flex-col items-center justify-center w-1/5 py-1 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span class="text-xs">Study</span>
          </button>
          <button id="nav-settings" class="flex flex-col items-center justify-center w-1/5 py-1 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs">Settings</span>
          </button>
      </nav>
    `;
  }
  
  // Set up event listeners for UI interactions
  setupEventListeners() {
    // Connection management
    const syncButton = document.getElementById('sync-button');
    syncButton.addEventListener('click', () => this.manualSync());
    
    // Storage optimization
    const optimizeStorageBtn = document.getElementById('optimize-storage-btn');
    optimizeStorageBtn.addEventListener('click', () => this.showStorageOptimizationModal());
    
    // Emergency backup
    const emergencyBackupBtn = document.getElementById('emergency-backup-btn');
    emergencyBackupBtn.addEventListener('click', () => this.showEmergencyBackupModal());
    
    // Add new document
    const addDocumentBtn = document.getElementById('add-document-btn');
    addDocumentBtn.addEventListener('click', () => this.showAddDocumentModal());
    
    // Bottom navigation
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (button.id !== 'nav-home') {
          showToast(`${button.querySelector('span').textContent} section coming soon`);
        }
      });
    });
    
    // Notification button
    const notificationButton = document.getElementById('notification-button');
    notificationButton.addEventListener('click', () => {
      showToast('No new notifications');
    });
    
    // Document item click handler
    document.addEventListener('click', (e) => {
      const documentItem = e.target.closest('.document-item');
      if (documentItem) {
        const documentId = documentItem.getAttribute('data-document-id');
        // Only handle if click was not on the actions button
        if (!e.target.closest('button')) {
          this.openDocument(documentId);
        }
      }
    });
  }
  
  // Register service worker for offline functionality
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Set up message handling from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETE') {
            showToast('Background sync completed');
            this.loadDocuments(); // Refresh document list
          }
        });
        
        // Register for background sync
        await SyncService.registerBackgroundSync();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
  
  // Load initial application data
  async loadInitialData() {
    await Promise.all([
      this.loadStorageAnalytics(),
      this.loadDocuments(),
      this.loadAssignments()
    ]);
    
    // Check if we need to populate sample data
    const hasDocuments = (await DocumentService.getAllDocuments()).length > 0;
    if (!hasDocuments) {
      await populateSampleData();
      // Reload data after populating samples
      await Promise.all([
        this.loadStorageAnalytics(),
        this.loadDocuments(),
        this.loadAssignments()
      ]);
      showToast('Sample data loaded for demonstration');
    }
  }
  
  // Load storage analytics data
  async loadStorageAnalytics() {
    try {
      const analytics = await StorageService.getStorageAnalytics();
      this.updateStorageUI(analytics);
    } catch (error) {
      console.error('Failed to load storage analytics:', error);
      showToast('Failed to load storage data');
    }
  }
  
  // Update storage UI with analytics data
  updateStorageUI(analytics) {
    const storageBar = document.getElementById('storage-bar');
    const storagePercentage = document.getElementById('storage-percentage');
    const storageCategories = document.getElementById('storage-categories');
    
    // Calculate percentage based on a simulated total size
    const totalStorage = 10 * 1024 * 1024; // 10 MB (for demonstration)
    const usedPercentage = Math.min(100, Math.round((analytics.totalSize / totalStorage) * 100));
    
    // Update UI
    storageBar.style.width = `${usedPercentage}%`;
    storagePercentage.textContent = `${usedPercentage}% used`;
    
    // Add categories
    storageCategories.innerHTML = '';
    
    const categoryColors = {
      'Class Notes': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Assignments': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      'Resources': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'Other': 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
    };
    
    // Sort categories by size (largest first)
    const sortedCategories = Object.entries(analytics.categories || {})
      .sort((a, b) => b[1] - a[1]);
    
    // Add top 3 categories
    sortedCategories.slice(0, 3).forEach(([category, size]) => {
      const colorClass = categoryColors[category] || categoryColors.Other;
      const sizeInMB = (size / (1024 * 1024)).toFixed(1);
      
      const categoryEl = createElement('div', `p-2 ${colorClass.split(' ')[0]} rounded`);
      categoryEl.innerHTML = `
        <div class="font-semibold ${colorClass.split(' ')[2]}">${sizeInMB} MB</div>
        <div class="${colorClass.split(' ')[2].replace('800', '600').replace('300', '400')}">${category}</div>
      `;
      
      storageCategories.appendChild(categoryEl);
    });
  }
  
  // Load documents from database
  async loadDocuments() {
    try {
      const documents = await DocumentService.getAllDocuments();
      this.updateDocumentsUI(documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showToast('Failed to load documents');
    }
  }
  
  // Update documents UI with data
  updateDocumentsUI(documents) {
    const container = document.getElementById('documents-container');
    container.innerHTML = '';
    
    if (documents.length === 0) {
      const emptyState = createElement('div', 'text-center py-8 text-gray-500 dark:text-gray-400');
      emptyState.innerHTML = `
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p>No documents yet</p>
        <p class="text-sm mt-2">Click the button below to add your first document</p>
      `;
      container.appendChild(emptyState);
      return;
    }
    
    // Sort documents by last modified (newest first)
    documents
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 10) // Limit to 10 most recent
      .forEach(document => {
        const documentItem = createDocumentItem(document);
        container.appendChild(documentItem);
      });
  }
  
  // Load assignments from database
  async loadAssignments() {
    try {
      const assignments = await AssignmentService.getAllAssignments();
      this.updateAssignmentsUI(assignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      showToast('Failed to load assignments');
    }
  }
  
  // Update assignments UI with data
  updateAssignmentsUI(assignments) {
    const container = document.getElementById('assignments-container');
    container.innerHTML = '';
    
    if (assignments.length === 0) {
      // Add sample assignments for the initial app state
      const sampleAssignments = [
        {
          title: 'Chemistry Lab Report',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          priority: 'high'
        },
        {
          title: 'English Literature Essay',
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          priority: 'medium'
        },
        {
          title: 'Math Quiz Preparation',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          priority: 'low'
        }
      ];
      
      sampleAssignments.forEach(assignment => {
        const assignmentItem = createAssignmentItem(assignment);
        container.appendChild(assignmentItem);
      });
      
      return;
    }
    
    // Sort assignments by due date (soonest first)
    assignments
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5) // Limit to 5 upcoming assignments
      .forEach(assignment => {
        const assignmentItem = createAssignmentItem(assignment);
        container.appendChild(assignmentItem);
      });
  }
  
  // Monitor connection status
  monitorConnection() {
    const connectionStatus = document.getElementById('connection-status');
    
    // Initial status
    this.updateConnectionStatus();
    
    // Listen for connection changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateConnectionStatus();
      showToast('Connection restored');
      this.syncWhenReconnected();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateConnectionStatus();
      this.showOfflineModal();
    });
  }
  
  // Update connection status in UI
  updateConnectionStatus() {
    const connectionStatus = document.getElementById('connection-status');
    
    if (this.isOnline) {
      connectionStatus.textContent = 'Online';
      connectionStatus.classList.remove('bg-danger');
      connectionStatus.classList.add('bg-success');
    } else {
      connectionStatus.textContent = 'Offline';
      connectionStatus.classList.remove('bg-success');
      connectionStatus.classList.add('bg-danger');
    }
  }
  
  // Sync data when reconnected
  async syncWhenReconnected() {
    if (!this.isOnline) return;
    
    try {
      const result = await SyncService.processSyncQueue();
      
      if (result.success) {
        if (result.syncedCount > 0) {
          showToast(`Synced ${result.syncedCount} changes`);
          this.loadDocuments(); // Refresh document list
        }
      } else {
        console.error('Sync failed:', result.reason || result.error);
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }
  
  // Manual sync triggered by user
  async manualSync() {
    if (!this.isOnline) {
      showToast('Cannot sync while offline');
      return;
    }
    
    showToast('Syncing...');
    
    try {
      const result = await SyncService.processSyncQueue();
      
      if (result.success) {
        showToast(result.syncedCount > 0 
          ? `Synced ${result.syncedCount} changes` 
          : 'Everything is up to date'
        );
        this.loadDocuments(); // Refresh document list
      } else {
        showToast('Sync failed: ' + (result.reason || 'Unknown error'));
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      showToast('Sync failed. Please try again.');
    }
  }
  
  // Show offline modal
  showOfflineModal() {
    const existingModal = document.getElementById('offline-modal');
    if (existingModal) existingModal.remove();
    
    const modal = createModal(
      'offline-modal',
      'You\'re Offline',
      'Don\'t worry, EduSafe is designed to work offline. You can continue working on your documents and they\'ll sync when you\'re back online.',
      [
        { id: 'offline-modal-close', text: 'I Understand', primary: false },
        { id: 'view-offline-files-btn', text: 'View Offline Files', primary: true }
      ]
    );
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Add event listeners
    document.getElementById('offline-modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    document.getElementById('view-offline-files-btn').addEventListener('click', () => {
      modal.classList.add('hidden');
      showToast('Showing offline available files');
    });
  }
  
  // Show emergency backup modal
  showEmergencyBackupModal() {
    const existingModal = document.getElementById('backup-modal');
    if (existingModal) existingModal.remove();
    
    // Create content element
    const content = createElement('div');
    content.innerHTML = `
      <p class="text-gray-600 dark:text-gray-400 text-sm mt-2">This will immediately backup all your critical academic files, even with limited connectivity.</p>
      
      <div class="mt-4 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
          <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-700 dark:text-gray-300">13 files selected</span>
              <span class="text-primary font-medium">4.2 MB</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div id="backup-progress" class="h-full bg-primary rounded-full w-0"></div>
          </div>
      </div>
    `;
    
    const modal = createModal(
      'backup-modal',
      'Emergency Backup',
      content,
      [
        { id: 'backup-modal-close', text: 'Cancel', primary: false },
        { id: 'start-backup-btn', text: 'Start Backup', primary: true }
      ]
    );
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Add event listeners
    document.getElementById('backup-modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    document.getElementById('start-backup-btn').addEventListener('click', () => {
      this.performEmergencyBackup();
    });
  }
  
  // Perform emergency backup
  async performEmergencyBackup() {
    const startBackupBtn = document.getElementById('start-backup-btn');
    const backupProgress = document.getElementById('backup-progress');
    
    // Disable button and show progress
    startBackupBtn.disabled = true;
    startBackupBtn.textContent = 'Backing up...';
    
    // Simulate backup progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      backupProgress.style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Hide modal and show success message
        document.getElementById('backup-modal').classList.add('hidden');
        showToast('Emergency backup completed!');
        
        // Reset UI
        backupProgress.style.width = '0%';
        startBackupBtn.disabled = false;
        startBackupBtn.textContent = 'Start Backup';
      }
    }, 300);
    
    // In a real app, here we would:
    // 1. Get all critical documents
    // 2. Create compressed backup
    // 3. Store in IndexedDB
    // 4. If possible, sync to cloud storage
  }
  
  // Show storage optimization modal
  showStorageOptimizationModal() {
    const existingModal = document.getElementById('storage-modal');
    if (existingModal) existingModal.remove();
    
    // Create content element
    const content = createElement('div');
    content.innerHTML = `
      <p class="text-gray-600 dark:text-gray-400 text-sm">Free up space while keeping your important academic files safe.</p>
      
      <div class="mt-4 space-y-3">
          <div class="flex items-center justify-between">
              <div class="flex items-center">
                  <input type="checkbox" id="archive-old" class="rounded text-primary focus:ring-primary dark:bg-gray-700" checked>
                  <label for="archive-old" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Archive old assignments (1.2 GB)</label>
              </div>
              <div class="text-xs text-primary font-medium">High savings</div>
          </div>
          
          <div class="flex items-center justify-between">
              <div class="flex items-center">
                  <input type="checkbox" id="compress-images" class="rounded text-primary focus:ring-primary dark:bg-gray-700" checked>
                  <label for="compress-images" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Compress large images (0.8 GB)</label>
              </div>
              <div class="text-xs text-primary font-medium">Medium savings</div>
          </div>
          
          <div class="flex items-center justify-between">
              <div class="flex items-center">
                  <input type="checkbox" id="reduce-versions" class="rounded text-primary focus:ring-primary dark:bg-gray-700">
                  <label for="reduce-versions" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Reduce document versions (0.4 GB)</label>
              </div>
              <div class="text-xs text-primary font-medium">Low savings</div>
          </div>
          
          <div class="flex items-center justify-between">
              <div class="flex items-center">
                  <input type="checkbox" id="clear-cache" class="rounded text-primary focus:ring-primary dark:bg-gray-700" checked>
                  <label for="clear-cache" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Clear application cache (0.3 GB)</label>
              </div>
              <div class="text-xs text-primary font-medium">Safe cleanup</div>
          </div>
      </div>
      
      <div class="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 dark:text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                  <span class="text-sm font-medium text-green-800 dark:text-green-300">Potential space savings</span>
                  <span class="text-sm font-bold text-green-800 dark:text-green-300 ml-2">2.3 GB</span>
              </div>
          </div>
      </div>
    `;
    
    const modal = createModal(
      'storage-modal',
      'Optimize Storage',
      content,
      [
        { id: 'storage-modal-close', text: 'Cancel', primary: false },
        { id: 'optimize-storage-confirm', text: 'Optimize Now', primary: true }
      ]
    );
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Add event listeners
    document.getElementById('storage-modal-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    document.getElementById('optimize-storage-confirm').addEventListener('click', () => {
      this.performStorageOptimization();
    });
  }
  
  // Perform storage optimization
  async performStorageOptimization() {
    const optimizeButton = document.getElementById('optimize-storage-confirm');
    
    // Get selected options
    const options = {
      archiveOld: document.getElementById('archive-old').checked,
      compressImages: document.getElementById('compress-images').checked,
      reduceVersions: document.getElementById('reduce-versions').checked,
      clearCache: document.getElementById('clear-cache').checked
    };
    
    // Disable button during optimization
    optimizeButton.disabled = true;
    optimizeButton.textContent = 'Optimizing...';
    
    try {
      // Perform optimization
      const results = await StorageService.optimizeStorage(options);
      
      // Hide modal and show success message
      document.getElementById('storage-modal').classList.add('hidden');
      showToast('Storage optimized successfully!');
      
      // Update storage analytics
      await this.loadStorageAnalytics();
      
      // Reset button
      optimizeButton.disabled = false;
      optimizeButton.textContent = 'Optimize Now';
    } catch (error) {
      console.error('Storage optimization failed:', error);
      showToast('Optimization failed. Please try again.');
      
      // Reset button
      optimizeButton.disabled = false;
      optimizeButton.textContent = 'Optimize Now';
    }
  }
  
  // Show add document modal
  showAddDocumentModal() {
    const existingModal = document.getElementById('add-document-modal');
    if (existingModal) existingModal.remove();
    
    // Create content element
    const content = createElement('div');
    content.innerHTML = `
      <form id="add-document-form">
        <div class="mb-3">
          <label for="document-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Title</label>
          <input type="text" id="document-title" class="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="Enter document title" required>
        </div>
        
        <div class="mb-3">
          <label for="document-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select id="document-category" class="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
            <option value="Class Notes">Class Notes</option>
            <option value="Assignments">Assignments</option>
            <option value="Resources">Resources</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div class="mb-3">
          <label for="document-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
          <textarea id="document-content" rows="4" class="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="Enter document content"></textarea>
        </div>
        
        <div class="flex items-center">
          <input type="checkbox" id="make-available-offline" class="rounded text-primary focus:ring-primary dark:bg-gray-700" checked>
          <label for="make-available-offline" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Make available offline</label>
        </div>
      </form>
    `;
    
    const modal = createModal(
      'add-document-modal',
      'Add New Document',
      content,
      [
        { id: 'add-document-cancel', text: 'Cancel', primary: false },
        { id: 'add-document-submit', text: 'Create Document', primary: true }
      ]
    );
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Add event listeners
    document.getElementById('add-document-cancel').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    document.getElementById('add-document-submit').addEventListener('click', () => {
      this.createNewDocument();
    });
  }
  
  // Create new document
  async createNewDocument() {
    const form = document.getElementById('add-document-form');
    const title = document.getElementById('document-title').value;
    const category = document.getElementById('document-category').value;
    const content = document.getElementById('document-content').value;
    const isOfflineAvailable = document.getElementById('make-available-offline').checked;
    
    if (!title) {
      showToast('Please enter a title');
      return;
    }
    
    try {
      // Create document
      const documentId = await DocumentService.createDocument({
        title,
        category,
        content,
        isOfflineAvailable,
        size: content.length * 2, // Rough size estimate
        lastModified: new Date(),
        status: 'available'
      });
      
      // Hide modal and show success message
      document.getElementById('add-document-modal').classList.add('hidden');
      showToast('Document created successfully!');
      
      // Refresh document list
      await this.loadDocuments();
      
      // Refresh storage analytics
      await this.loadStorageAnalytics();
    } catch (error) {
      console.error('Failed to create document:', error);
      showToast('Failed to create document. Please try again.');
    }
  }
  
  // Open document for viewing/editing
  openDocument(documentId) {
    showToast('Opening document... (Feature coming soon)');
    // In a full implementation, this would open a document viewer/editor
  }
  
  // Hide the loading screen
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

export default EduSafeApp;