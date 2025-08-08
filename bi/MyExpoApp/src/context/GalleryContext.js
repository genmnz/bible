import React, { createContext, useContext, useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GalleryContext = createContext();

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

export const GalleryProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [userCreatedImages, setUserCreatedImages] = useState([]);

  // Initialize permissions and load data
  useEffect(() => {
    initializeGallery();
    loadUserCreatedImages();
    loadCategories();
  }, []);

  const initializeGallery = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        await loadImages();
        await loadAlbums();
      }
    } catch (error) {
      console.error('Error initializing gallery:', error);
    }
  };

  const loadImages = async () => {
    if (!hasPermission) return;

    setLoading(true);
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        sortBy: 'creationTime',
        first: 1000,
      });

      // Transform media assets to include additional metadata
      const transformedImages = media.assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        duration: asset.duration,
        mediaType: asset.mediaType,
        albumId: asset.albumId,
        category: determineCategory(asset.filename),
        size: `${asset.width}x${asset.height}`,
        aspectRatio: asset.width / asset.height,
        isUserCreated: false,
      }));

      setImages(transformedImages);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbums = async () => {
    if (!hasPermission) return;

    try {
      const albumsData = await MediaLibrary.getAlbumsAsync();
      const albumsWithCounts = await Promise.all(
        albumsData.map(async (album) => {
          const albumAssets = await MediaLibrary.getAssetsAsync({
            album: album,
            mediaType: 'photo',
          });
          return {
            ...album,
            assetCount: albumAssets.totalCount,
          };
        })
      );
      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const loadUserCreatedImages = async () => {
    try {
      const stored = await AsyncStorage.getItem('userCreatedImages');
      if (stored) {
        setUserCreatedImages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user created images:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem('imageCategories');
      if (stored) {
        setCategories(JSON.parse(stored));
      } else {
        // Set default categories
        const defaultCategories = [
          { id: '1', name: 'Screenshots', color: '#FF6B6B', icon: 'phone-portrait-outline' },
          { id: '2', name: 'Camera', color: '#4ECDC4', icon: 'camera-outline' },
          { id: '3', name: 'Downloads', color: '#45B7D1', icon: 'download-outline' },
          { id: '4', name: 'WhatsApp', color: '#25D366', icon: 'logo-whatsapp' },
          { id: '5', name: 'Instagram', color: '#E4405F', icon: 'logo-instagram' },
          { id: '6', name: 'Others', color: '#95A5A6', icon: 'folder-outline' },
        ];
        setCategories(defaultCategories);
        await AsyncStorage.setItem('imageCategories', JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const determineCategory = (filename) => {
    if (!filename) return 'Others';

    const lowerFilename = filename.toLowerCase();

    if (lowerFilename.includes('screenshot') || lowerFilename.includes('screen_shot')) {
      return 'Screenshots';
    } else if (lowerFilename.includes('img_') || lowerFilename.includes('dsc_')) {
      return 'Camera';
    } else if (lowerFilename.includes('download')) {
      return 'Downloads';
    } else if (lowerFilename.includes('whatsapp') || lowerFilename.includes('wa_')) {
      return 'WhatsApp';
    } else if (lowerFilename.includes('instagram') || lowerFilename.includes('ig_')) {
      return 'Instagram';
    }

    return 'Others';
  };

  const addUserCreatedImage = async (imageData) => {
    try {
      const newImage = {
        ...imageData,
        id: Date.now().toString(),
        isUserCreated: true,
        creationTime: Date.now(),
        category: 'Camera',
      };

      const updatedImages = [newImage, ...userCreatedImages];
      setUserCreatedImages(updatedImages);

      // Also add to main images array
      setImages(prev => [newImage, ...prev]);

      await AsyncStorage.setItem('userCreatedImages', JSON.stringify(updatedImages));

      return newImage;
    } catch (error) {
      console.error('Error adding user created image:', error);
      throw error;
    }
  };

  const deleteImage = async (imageId) => {
    try {
      // Remove from user created images if it exists there
      const updatedUserImages = userCreatedImages.filter(img => img.id !== imageId);
      setUserCreatedImages(updatedUserImages);
      await AsyncStorage.setItem('userCreatedImages', JSON.stringify(updatedUserImages));

      // Remove from main images array
      setImages(prev => prev.filter(img => img.id !== imageId));

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  const getImagesByCategory = (categoryName) => {
    const allImages = [...images, ...userCreatedImages];
    return allImages.filter(image => image.category === categoryName);
  };

  const getImagesByAlbum = (albumId) => {
    return images.filter(image => image.albumId === albumId);
  };

  const refreshGallery = async () => {
    setRefreshing(true);
    try {
      await loadImages();
      await loadAlbums();
    } catch (error) {
      console.error('Error refreshing gallery:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const searchImages = (query) => {
    if (!query.trim()) return [...images, ...userCreatedImages];

    const allImages = [...images, ...userCreatedImages];
    const lowerQuery = query.toLowerCase();

    return allImages.filter(image =>
      image.filename?.toLowerCase().includes(lowerQuery) ||
      image.category?.toLowerCase().includes(lowerQuery)
    );
  };

  const getImageStats = () => {
    const allImages = [...images, ...userCreatedImages];
    const totalImages = allImages.length;
    const deviceImages = images.length;
    const userImages = userCreatedImages.length;

    const categoryStats = categories.map(category => ({
      ...category,
      count: allImages.filter(img => img.category === category.name).length,
    }));

    const albumStats = albums.map(album => ({
      ...album,
      imageCount: images.filter(img => img.albumId === album.id).length,
    }));

    return {
      totalImages,
      deviceImages,
      userImages,
      categoryStats,
      albumStats,
      categories: categories.length,
      albums: albums.length,
    };
  };

  const addCategory = async (categoryData) => {
    try {
      const newCategory = {
        id: Date.now().toString(),
        ...categoryData,
      };

      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      await AsyncStorage.setItem('imageCategories', JSON.stringify(updatedCategories));

      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateImageCategory = async (imageId, newCategory) => {
    try {
      // Update in main images
      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, category: newCategory } : img
      ));

      // Update in user created images
      const updatedUserImages = userCreatedImages.map(img =>
        img.id === imageId ? { ...img, category: newCategory } : img
      );
      setUserCreatedImages(updatedUserImages);
      await AsyncStorage.setItem('userCreatedImages', JSON.stringify(updatedUserImages));

      return true;
    } catch (error) {
      console.error('Error updating image category:', error);
      throw error;
    }
  };

  const value = {
    // State
    images,
    albums,
    categories,
    userCreatedImages,
    loading,
    refreshing,
    hasPermission,

    // Actions
    loadImages,
    loadAlbums,
    refreshGallery,
    addUserCreatedImage,
    deleteImage,
    searchImages,
    getImagesByCategory,
    getImagesByAlbum,
    getImageStats,
    addCategory,
    updateImageCategory,

    // Utility
    determineCategory,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};
