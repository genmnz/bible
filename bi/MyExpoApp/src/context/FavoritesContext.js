import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load favorites on app start
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw error;
    }
  };

  const addToFavorites = async (image) => {
    try {
      const favoriteImage = {
        ...image,
        addedToFavoritesAt: Date.now(),
      };

      const updatedFavorites = [favoriteImage, ...favorites];
      await saveFavorites(updatedFavorites);
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  };

  const removeFromFavorites = async (imageId) => {
    try {
      const updatedFavorites = favorites.filter(fav => fav.id !== imageId);
      await saveFavorites(updatedFavorites);
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  };

  const toggleFavorite = async (image) => {
    const isCurrentlyFavorite = isFavorite(image.id);

    if (isCurrentlyFavorite) {
      return await removeFromFavorites(image.id);
    } else {
      return await addToFavorites(image);
    }
  };

  const isFavorite = (imageId) => {
    return favorites.some(fav => fav.id === imageId);
  };

  const getFavoritesByCategory = (category) => {
    return favorites.filter(fav => fav.category === category);
  };

  const getFavoritesByDateRange = (startDate, endDate) => {
    return favorites.filter(fav => {
      const favDate = fav.addedToFavoritesAt;
      return favDate >= startDate && favDate <= endDate;
    });
  };

  const searchFavorites = (query) => {
    if (!query.trim()) return favorites;

    const lowerQuery = query.toLowerCase();
    return favorites.filter(fav =>
      fav.filename?.toLowerCase().includes(lowerQuery) ||
      fav.category?.toLowerCase().includes(lowerQuery)
    );
  };

  const sortFavorites = (sortBy = 'newest') => {
    const sortedFavorites = [...favorites];

    switch (sortBy) {
      case 'newest':
        return sortedFavorites.sort((a, b) => b.addedToFavoritesAt - a.addedToFavoritesAt);
      case 'oldest':
        return sortedFavorites.sort((a, b) => a.addedToFavoritesAt - b.addedToFavoritesAt);
      case 'name':
        return sortedFavorites.sort((a, b) =>
          (a.filename || '').localeCompare(b.filename || '')
        );
      case 'size':
        return sortedFavorites.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      default:
        return sortedFavorites;
    }
  };

  const clearAllFavorites = async () => {
    try {
      await saveFavorites([]);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  };

  const getFavoritesStats = () => {
    const totalFavorites = favorites.length;

    const categoryCounts = favorites.reduce((acc, fav) => {
      const category = fav.category || 'Others';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const mostFavoriteCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    const averageImageSize = totalFavorites > 0
      ? favorites.reduce((sum, fav) => sum + (fav.width * fav.height), 0) / totalFavorites
      : 0;

    const oldestFavorite = favorites.length > 0
      ? favorites.reduce((oldest, fav) =>
          fav.addedToFavoritesAt < oldest.addedToFavoritesAt ? fav : oldest
        )
      : null;

    const newestFavorite = favorites.length > 0
      ? favorites.reduce((newest, fav) =>
          fav.addedToFavoritesAt > newest.addedToFavoritesAt ? fav : newest
        )
      : null;

    return {
      totalFavorites,
      categoryCounts,
      mostFavoriteCategory,
      averageImageSize: Math.round(averageImageSize),
      oldestFavorite,
      newestFavorite,
    };
  };

  const exportFavorites = () => {
    return favorites.map(fav => ({
      id: fav.id,
      filename: fav.filename,
      uri: fav.uri,
      category: fav.category,
      addedAt: new Date(fav.addedToFavoritesAt).toISOString(),
      dimensions: `${fav.width}x${fav.height}`,
    }));
  };

  const value = {
    // State
    favorites,
    loading,

    // Actions
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearAllFavorites,
    loadFavorites,

    // Queries
    isFavorite,
    getFavoritesByCategory,
    getFavoritesByDateRange,
    searchFavorites,
    sortFavorites,
    getFavoritesStats,
    exportFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
