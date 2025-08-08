// App Constants
export const APP_INFO = {
  name: 'Gallery App',
  version: '1.0.0',
  build: '2024.1.1',
  author: 'Gallery App Team',
  email: 'support@galleryapp.com',
};

// Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#34C759',
  accent: '#FF6B6B',
  warning: '#FF9500',
  danger: '#FF3B30',

  // Grays
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  extraLightGray: '#CCCCCC',
  white: '#FFFFFF',

  // Background
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',

  // Category Colors
  categoryColors: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#AED6F1', '#F5B7B1', '#D2B4DE'
  ],
};

// Typography
export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    title: 28,
    largeTitle: 32,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

// Layout
export const LAYOUT = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    round: 50,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Image Constants
export const IMAGE_CONSTANTS = {
  defaultColumns: 3,
  maxColumns: 4,
  minColumns: 2,
  defaultSpacing: 2,
  defaultAspectRatio: 1,
  maxImageSize: 2048, // pixels
  imageQuality: 0.9,
  thumbnailSize: 150,
};

// Storage Keys
export const STORAGE_KEYS = {
  favorites: 'favorites',
  categories: 'imageCategories',
  userImages: 'userCreatedImages',
  settings: 'appSettings',
  onboarding: 'hasCompletedOnboarding',
  lastSync: 'lastSyncTimestamp',
};

// Default Categories
export const DEFAULT_CATEGORIES = [
  {
    id: '1',
    name: 'Screenshots',
    color: '#FF6B6B',
    icon: 'phone-portrait-outline',
    description: 'Screen captures and screenshots',
  },
  {
    id: '2',
    name: 'Camera',
    color: '#4ECDC4',
    icon: 'camera-outline',
    description: 'Photos taken with camera',
  },
  {
    id: '3',
    name: 'Downloads',
    color: '#45B7D1',
    icon: 'download-outline',
    description: 'Downloaded images',
  },
  {
    id: '4',
    name: 'WhatsApp',
    color: '#25D366',
    icon: 'logo-whatsapp',
    description: 'WhatsApp images',
  },
  {
    id: '5',
    name: 'Instagram',
    color: '#E4405F',
    icon: 'logo-instagram',
    description: 'Instagram photos',
  },
  {
    id: '6',
    name: 'Others',
    color: '#95A5A6',
    icon: 'folder-outline',
    description: 'Other images',
  },
];

// Sort Options
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', key: 'creationTime', order: 'desc' },
  { value: 'oldest', label: 'Oldest First', key: 'creationTime', order: 'asc' },
  { value: 'name', label: 'Name (A-Z)', key: 'filename', order: 'asc' },
  { value: 'size', label: 'Size (Largest)', key: 'fileSize', order: 'desc' },
];

// Filter Options
export const FILTER_OPTIONS = [
  { value: 'all', label: 'All Images' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'recent', label: 'Recent' },
  { value: 'screenshots', label: 'Screenshots' },
  { value: 'camera', label: 'Camera' },
  { value: 'downloads', label: 'Downloads' },
];

// Animation Durations
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  extraSlow: 500,
};

// Grid Layout Options
export const GRID_LAYOUTS = [
  { columns: 2, name: 'Large Grid', icon: 'grid-outline' },
  { columns: 3, name: 'Medium Grid', icon: 'apps-outline' },
  { columns: 4, name: 'Small Grid', icon: 'list-outline' },
];

// File Extensions
export const SUPPORTED_IMAGE_FORMATS = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif'
];

// Permissions
export const PERMISSIONS = {
  camera: {
    title: 'Camera Permission',
    message: 'This app needs camera access to take photos.',
  },
  mediaLibrary: {
    title: 'Photo Library Permission',
    message: 'This app needs access to your photo library to view and organize photos.',
  },
  storage: {
    title: 'Storage Permission',
    message: 'This app needs storage access to save photos.',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  noPermission: 'Permission required to access this feature.',
  noImages: 'No images found.',
  loadFailed: 'Failed to load images.',
  saveFailed: 'Failed to save image.',
  deleteFailed: 'Failed to delete image.',
  shareFailed: 'Failed to share image.',
  cameraError: 'Camera not available.',
  networkError: 'Network connection required.',
  storageError: 'Storage error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  imageSaved: 'Image saved successfully!',
  imageDeleted: 'Image deleted successfully!',
  favoriteAdded: 'Added to favorites!',
  favoriteRemoved: 'Removed from favorites!',
  categoryCreated: 'Category created successfully!',
  settingsSaved: 'Settings saved!',
};

// Default Settings
export const DEFAULT_SETTINGS = {
  autoBackup: false,
  highQualityImages: true,
  showImageInfo: true,
  darkMode: false,
  notifications: true,
  autoOrganize: true,
  gridColumns: 3,
  imageQuality: 0.9,
  thumbnailQuality: 0.7,
};

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  baseURL: 'https://api.galleryapp.com',
  upload: '/upload',
  sync: '/sync',
  backup: '/backup',
  restore: '/restore',
};

// Feature Flags (for future use)
export const FEATURES = {
  cloudSync: false,
  aiTagging: false,
  faceRecognition: false,
  photoFilters: false,
  videoSupport: false,
  collaboration: false,
};
