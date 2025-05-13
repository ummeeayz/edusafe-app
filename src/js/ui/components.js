// src/js/ui/components.js
import { format } from 'date-fns';

// Helper to create elements with classes and attributes
export function createElement(tag, classNames = '', attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  if (classNames) element.className = classNames;
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  if (textContent) element.textContent = textContent;
  
  return element;
}

// Create document item component
export function createDocumentItem(document) {
  const item = createElement('div', 'document-item bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-3 flex items-center');
  
  // Determine document status class
  let statusClass = 'available';
  let statusBg = 'bg-blue-100 dark:bg-blue-900/30';
  let statusIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  `;
  
  if (document.status === 'syncing') {
    statusClass = 'syncing';
    statusBg = 'bg-purple-100 dark:bg-purple-900/30';
    statusIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    `;
  } else if (!document.isOfflineAvailable) {
    statusClass = 'offline';
    statusBg = 'bg-red-100 dark:bg-red-900/30';
    statusIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    `;
  }
  
  // Icon container
  const iconContainer = createElement('div', `offline-indicator ${statusClass} ${statusBg} p-3 rounded-lg mr-3`);
  iconContainer.innerHTML = statusIcon;
  item.appendChild(iconContainer);
  
  // Document info
  const infoContainer = createElement('div', 'flex-1');
  
  const title = createElement('h3', 'font-medium text-gray-800 dark:text-white', {}, document.title);
  infoContainer.appendChild(title);
  
  const lastEdited = createElement(
    'p', 
    'text-xs text-gray-600 dark:text-gray-400', 
    {}, 
    `Last edited: ${formatDate(document.lastModified)}`
  );
  infoContainer.appendChild(lastEdited);
  
  // Status indicators
  const statusContainer = createElement('div', 'flex items-center mt-1');
  
  let statusText = 'Available Offline';
  let statusColor = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  
  if (document.status === 'syncing') {
    statusText = 'Syncing...';
    statusColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
  } else if (!document.isOfflineAvailable) {
    statusText = 'Not Available Offline';
    statusColor = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  }
  
  const statusBadge = createElement('span', `text-xs ${statusColor} px-2 py-0.5 rounded`, {}, statusText);
  statusContainer.appendChild(statusBadge);
  
  const versionInfo = createElement('span', 'text-xs text-gray-500 dark:text-gray-400 ml-2', {}, `${document.versions || 1} versions`);
  statusContainer.appendChild(versionInfo);
  
  infoContainer.appendChild(statusContainer);
  item.appendChild(infoContainer);
  
  // Actions button
  const actionsButton = createElement('button', 'text-primary');
  actionsButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  `;
  item.appendChild(actionsButton);
  
  // Set data attribute for document ID
  item.setAttribute('data-document-id', document.id);
  
  return item;
}

// Create assignment item component
export function createAssignmentItem(assignment) {
  const item = createElement('div', 'flex items-center');
  
  // Priority indicator
  let priorityColor = 'bg-success';
  if (assignment.priority === 'medium') priorityColor = 'bg-warning';
  if (assignment.priority === 'high') priorityColor = 'bg-danger';
  
  const priorityIndicator = createElement('div', `w-2 h-2 ${priorityColor} rounded-full mr-2`);
  item.appendChild(priorityIndicator);
  
  // Assignment info
  const infoContainer = createElement('div', 'flex-1');
  
  const title = createElement('h3', 'text-sm font-medium text-gray-800 dark:text-white', {}, assignment.title);
  infoContainer.appendChild(title);
  
  const dueDate = createElement(
    'p', 
    'text-xs text-gray-600 dark:text-gray-400', 
    {}, 
    `Due ${formatDueDate(assignment.dueDate)}`
  );
  infoContainer.appendChild(dueDate);
  
  item.appendChild(infoContainer);
  
  // Priority badge
  let priorityText = 'Low';
  let priorityBadgeColor = 'bg-success/10 text-success';
  
  if (assignment.priority === 'medium') {
    priorityText = 'Medium';
    priorityBadgeColor = 'bg-warning/10 text-warning';
  } else if (assignment.priority === 'high') {
    priorityText = 'High Priority';
    priorityBadgeColor = 'bg-danger/10 text-danger';
  }
  
  const priorityBadge = createElement('span', `text-xs px-2 py-1 ${priorityBadgeColor} rounded`, {}, priorityText);
  item.appendChild(priorityBadge);
  
  return item;
}

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(date, now)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isSameDay(date, yesterday)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else {
    return `${format(date, 'd MMM yyyy')}`;
  }
}

// Format due date for assignments
function formatDueDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  if (isSameDay(date, now)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isSameDay(date, tomorrow)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  } else if (date < dayAfterTomorrow) {
    return format(date, 'EEEE, h:mm a');
  } else {
    return format(date, 'd MMM yyyy');
  }
}

// Helper to check if two dates are the same day
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

// Create a toast notification
export function showToast(message, duration = 3000) {
  // Remove existing toast if present
  const existingToast = document.getElementById('toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = createElement('div', 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg', { id: 'toast' });
  
  const messageSpan = createElement('span', '', { id: 'toast-message' }, message);
  toast.appendChild(messageSpan);
  
  document.body.appendChild(toast);
  
  // Auto hide after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
  
  return toast;
}

// Create modal dialog
export function createModal(id, title, content, actions) {
  // Create modal container
  const modal = createElement('div', 'fixed inset-0 bg-black/50 flex items-center justify-center hidden z-50', { id });
  
  // Create modal content
  const modalContent = createElement('div', 'bg-white dark:bg-gray-800 rounded-lg p-5 m-4 max-w-sm w-full');
  
  // Add title
  const titleElement = createElement('h3', 'text-lg font-semibold text-gray-800 dark:text-white mb-2', {}, title);
  modalContent.appendChild(titleElement);
  
  // Add content (can be string or element)
  if (typeof content === 'string') {
    const contentElement = createElement('p', 'text-gray-600 dark:text-gray-400 text-sm mb-4', {}, content);
    modalContent.appendChild(contentElement);
  } else {
    content.classList.add('mb-4');
    modalContent.appendChild(content);
  }
  
  // Add action buttons
  const actionsContainer = createElement('div', 'flex space-x-3');
  
  actions.forEach(action => {
    const buttonClass = action.primary 
      ? 'flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium' 
      : 'flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium';
    
    const button = createElement('button', buttonClass, { id: action.id }, action.text);
    actionsContainer.appendChild(button);
  });
  
  modalContent.appendChild(actionsContainer);
  modal.appendChild(modalContent);
  
  return modal;
}