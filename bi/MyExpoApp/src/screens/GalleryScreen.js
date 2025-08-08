import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useGallery } from '../context/GalleryContext';
import { useFavorites } from '../context/FavoritesContext';
import { useImageGrid } from '../hooks/useImageGrid';
import { useImagePicker } from '../hooks/useImagePicker';

const { width: screenWidth } = Dimensions.get('window');

const GalleryScreen = ({ navigation }) => {
  const {
    images,
    userCreatedImages,
    loading,
    refreshing,
    hasPermission,
    refreshGallery,
    addUserCreatedImage,
  } = useGallery();

  const { toggleFavorite, isFavorite } = useFavorites();
  const { showImagePickerOptions } = useImagePicker();

  const [searchVisible, setSearchVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const allImages = [...userCreatedImages, ...images].map(img => ({
    ...img,
    isFavorite: isFavorite(img.id),
  }));

  const {
    columns,
    processedImages,
    sortBy,
    filterBy,
    searchQuery,
    gridStats,
    changeColumns,
    toggleColumnLayout,
    updateSearch,
    updateSort,
    updateFilter,
    clearFilters,
    getItemStyle,
    sortOptions,
    filterOptions,
  } = useImageGrid(allImages, {
    numColumns: 3,
    spacing: 2,
    aspectRatio: 1,
  });

  useEffect(() => {
    if (hasPermission === false) {
      Alert.alert(
        'Permission Required',
        'This app needs access to your photo library to display images.',
        [
          { text: 'OK', onPress: () => {} },
        ]
      );
    }
  }, [hasPermission]);

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
  };

  const handleAddPhoto = async () => {
    try {
      const result = await showImagePickerOptions();
      if (result.result) {
        await addUserCreatedImage(result.result);
        refreshGallery();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add photo');
    }
  };

  const renderImageItem = ({ item, index }) => {
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

        {/* Favorite overlay */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(event) => handleFavoritePress(item, event)}
        >
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isFavorite ? '#FF6B6B' : '#fff'}
          />
        </TouchableOpacity>

        {/* Category badge */}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category.slice(0, 3).toUpperCase()}
            </Text>
          </View>
        )}

        {/* User created indicator */}
        {item.isUserCreated && (
          <View style={styles.userCreatedBadge}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Photo Gallery</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSearchVisible(!searchVisible)}
          >
            <Ionicons
              name={searchVisible ? 'close' : 'search'}
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

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAddPhoto}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search photos..."
            value={searchQuery}
            onChangeText={updateSearch}
            placeholderTextColor="#666"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => updateSearch('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter and sort controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.filterContainer}>
          <Text style={styles.controlLabel}>Filter:</Text>
          {filterOptions.slice(0, 3).map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                filterBy === option.value && styles.activeFilterChip,
              ]}
              onPress={() => updateFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterBy === option.value && styles.activeFilterChipText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.controlLabel}>Sort:</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortModalVisible(true)}
          >
            <Text style={styles.sortButtonText}>
              {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {gridStats.totalImages} images • {gridStats.totalRows} rows
        </Text>
        {(searchQuery || filterBy !== 'all') && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No photos found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : hasPermission === false
          ? 'Grant photo library access to view images'
          : 'Add your first photo to get started'
        }
      </Text>
      {hasPermission && (
        <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.addPhotoButtonText}>Add Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing && processedImages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {renderHeader()}

      <FlatList
        data={processedImages}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        key={`grid-${columns}`}
        contentContainerStyle={[
          styles.gridContainer,
          processedImages.length === 0 && styles.emptyGridContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshGallery}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={20}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: (screenWidth - (columns + 1) * 2) / columns,
          offset: ((screenWidth - (columns + 1) * 2) / columns) * index,
          index,
        })}
      />

      {/* Sort Modal */}
      {sortModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.sortModal}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort by</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() => {
                  updateSort(option.value);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.activeSortOptionText,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginRight: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#999',
  },
  clearFiltersButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  gridContainer: {
    paddingVertical: 2,
  },
  emptyGridContainer: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  userCreatedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
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
    backgroundColor: '#007AFF',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '60%',
    minWidth: '60%',
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  activeSortOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default GalleryScreen;
