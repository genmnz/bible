import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useGallery } from '../context/GalleryContext';
import { useFavorites } from '../context/FavoritesContext';
import { useImageGrid } from '../hooks/useImageGrid';

const { width: screenWidth } = Dimensions.get('window');

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName, categoryColor, categoryIcon } = route.params;
  const { getImagesByCategory, refreshGallery, refreshing } = useGallery();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [categoryImages, setCategoryImages] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const imagesWithFavorites = categoryImages.map(img => ({
    ...img,
    isFavorite: isFavorite(img.id),
  }));

  const {
    columns,
    processedImages,
    sortBy,
    searchQuery,
    gridStats,
    toggleColumnLayout,
    updateSearch,
    updateSort,
    clearFilters,
    getItemStyle,
    sortOptions,
  } = useImageGrid(imagesWithFavorites, {
    numColumns: 3,
    spacing: 2,
    aspectRatio: 1,
  });

  useEffect(() => {
    loadCategoryImages();
  }, [categoryName]);

  useEffect(() => {
    navigation.setOptions({
      title: categoryName,
      headerStyle: {
        backgroundColor: categoryColor,
      },
      headerTintColor: '#fff',
    });
  }, [categoryName, categoryColor]);

  const loadCategoryImages = () => {
    const images = getImagesByCategory(categoryName);
    setCategoryImages(images);
  };

  const handleImagePress = (image, index) => {
    navigation.navigate('ImageViewer', {
      images: processedImages,
      initialIndex: index,
      title: image.filename || `Image ${index + 1}`,
    });
  };

  const handleFavoritePress = async (image, event) => {
    event.stopPropagation();
    await toggleFavorite(image);
    loadCategoryImages(); // Refresh to update favorite status
  };

  const handleRefresh = async () => {
    await refreshGallery();
    loadCategoryImages();
  };

  const renderImageItem = ({ item, index }) => {
    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleImagePress(item, index)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.listItemImage}
            contentFit="cover"
            transition={200}
          />

          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle} numberOfLines={1}>
              {item.filename || `Image ${index + 1}`}
            </Text>
            <Text style={styles.listItemSubtitle}>
              {item.width} × {item.height}
            </Text>
            <Text style={styles.listItemDate}>
              {item.creationTime ? new Date(item.creationTime).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.listItemFavorite}
            onPress={(event) => handleFavoritePress(item, event)}
          >
            <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isFavorite ? '#FF6B6B' : '#ccc'}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    const style = getItemStyle(index);

    return (
      <TouchableOpacity
        style={[styles.imageContainer, style]}
        onPress={() => handleImagePress(item, index)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
        />

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(event) => handleFavoritePress(item, event)}
        >
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={item.isFavorite ? '#FF6B6B' : '#fff'}
          />
        </TouchableOpacity>

        {item.isUserCreated && (
          <View style={styles.userCreatedBadge}>
            <Ionicons name="camera" size={10} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
          <Ionicons name={categoryIcon} size={32} color="#fff" />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categoryCount}>
            {gridStats.totalImages} {gridStats.totalImages === 1 ? 'photo' : 'photos'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleColumnLayout}
          >
            <Ionicons
              name={columns === 2 ? 'grid-outline' : columns === 3 ? 'apps-outline' : 'list-outline'}
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {sortOptions.slice(0, 3).map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortChip,
              sortBy === option.value && styles.activeSortChip,
            ]}
            onPress={() => updateSort(option.value)}
          >
            <Text
              style={[
                styles.sortChipText,
                sortBy === option.value && styles.activeSortChipText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: categoryColor }]}>
        <Ionicons name={categoryIcon} size={48} color="#fff" />
      </View>
      <Text style={styles.emptyTitle}>No photos in {categoryName}</Text>
      <Text style={styles.emptySubtitle}>
        Photos will automatically appear here when you take or import images
      </Text>
      <TouchableOpacity
        style={[styles.addPhotoButton, { backgroundColor: categoryColor }]}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="camera" size={20} color="#fff" />
        <Text style={styles.addPhotoButtonText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={categoryColor} />

      <FlatList
        data={processedImages}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? columns : 1}
        key={`${viewMode}-${columns}`}
        contentContainerStyle={[
          styles.listContainer,
          processedImages.length === 0 && styles.emptyListContainer,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[categoryColor]}
            tintColor={categoryColor}
          />
        }
        ItemSeparatorComponent={viewMode === 'list' ? () => <View style={styles.listSeparator} /> : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 16,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: '#007AFF',
  },
  sortChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortChipText: {
    color: '#fff',
  },

  // Grid View Styles
  imageContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    margin: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCreatedBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List View Styles
  listItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  listItemDate: {
    fontSize: 12,
    color: '#999',
  },
  listItemFavorite: {
    padding: 8,
  },
  listSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addPhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CategoryDetailScreen;
