import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useFavorites } from '../context/FavoritesContext';
import { useImageGrid } from '../hooks/useImageGrid';

const { width: screenWidth } = Dimensions.get('window');

const FavoritesScreen = ({ navigation }) => {
  const {
    favorites,
    loading,
    toggleFavorite,
    clearAllFavorites,
    sortFavorites,
    searchFavorites,
  } = useFavorites();

  const [sortModalVisible, setSortModalVisible] = useState(false);

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
  } = useImageGrid(favorites, {
    numColumns: 3,
    spacing: 2,
    aspectRatio: 1,
  });

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

  const handleClearAllFavorites = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all favorites? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllFavorites,
        },
      ]
    );
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

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(event) => handleFavoritePress(item, event)}
        >
          <Ionicons name="heart" size={20} color="#FF6B6B" />
        </TouchableOpacity>

        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category.slice(0, 3).toUpperCase()}
            </Text>
          </View>
        )}

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
        <View style={styles.titleContainer}>
          <Ionicons name="heart" size={32} color="#FF6B6B" />
          <Text style={styles.title}>Favorites</Text>
        </View>

        <View style={styles.headerButtons}>
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

          {favorites.length > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearAllFavorites}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Controls */}
      {favorites.length > 0 && (
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
      )}

      {/* Stats */}
      {favorites.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {gridStats.totalImages} favorite {gridStats.totalImages === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the heart icon on any photo to add it to your favorites
      </Text>
      <TouchableOpacity
        style={styles.browsePhotosButton}
        onPress={() => navigation.navigate('Gallery')}
      >
        <Ionicons name="images" size={20} color="#fff" />
        <Text style={styles.browsePhotosButtonText}>Browse Photos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
      />

      {/* Sort Modal */}
      {sortModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.sortModal}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort favorites by</Text>
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
                  <Ionicons name="checkmark" size={20} color="#FF6B6B" />
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  headerButtons: {
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
    paddingVertical: 8,
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
    backgroundColor: '#FF6B6B',
  },
  sortChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortChipText: {
    color: '#fff',
  },
  statsContainer: {
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#999',
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
    margin: 1,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
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
  browsePhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browsePhotosButtonText: {
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
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

export default FavoritesScreen;
