// src/js/sampleData.js
import { DocumentService, AssignmentService } from './database';

// Sample documents data
const sampleDocuments = [
  {
    title: 'Biology Notes - Ch. 7',
    category: 'Class Notes',
    content: 'These are sample notes about cell biology...',
    isOfflineAvailable: true,
    size: 150000,
    lastModified: new Date(),
    status: 'available',
    versions: 4
  },
  {
    title: 'History Essay Draft',
    category: 'Assignments',
    content: 'Introduction: The impact of World War II on global economics...',
    isOfflineAvailable: true,
    size: 220000,
    lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: 'syncing',
    versions: 7
  },
  {
    title: 'Math Problem Set #4',
    category: 'Assignments',
    content: 'Problem 1: Solve the quadratic equation...',
    isOfflineAvailable: false,
    size: 80000,
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'available',
    versions: 2
  },
  {
    title: 'Physics Formula Sheet',
    category: 'Resources',
    content: 'Newton\'s Laws: F = ma...',
    isOfflineAvailable: true,
    size: 120000,
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    status: 'available',
    versions: 1
  }
];

// Sample assignments data
const sampleAssignments = [
  {
    title: 'Chemistry Lab Report',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    priority: 'high',
    status: 'pending',
    subject: 'Chemistry'
  },
  {
    title: 'English Literature Essay',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    priority: 'medium',
    status: 'pending',
    subject: 'English'
  },
  {
    title: 'Math Quiz Preparation',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    priority: 'low',
    status: 'pending',
    subject: 'Math'
  }
];

// Function to populate sample data
export async function populateSampleData() {
  // Check if we've already populated data
  const existingDocs = await DocumentService.getAllDocuments();
  if (existingDocs.length > 0) {
    console.log('Sample data already exists');
    return false;
  }
  
  // Add sample documents
  for (const doc of sampleDocuments) {
    await DocumentService.createDocument(doc);
  }
  
  // Add sample assignments
  for (const assignment of sampleAssignments) {
    await AssignmentService.createAssignment(assignment);
  }
  
  console.log('Sample data populated successfully');
  return true;
}