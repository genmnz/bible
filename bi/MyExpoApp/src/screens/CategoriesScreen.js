import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useGallery } from '../context/GalleryContext';

const { width: screenWidth } = Dimensions.get('window');

const CategoriesScreen = ({ navigation }) => {
  const {
    images,
    userCreatedImages,
    categories,
    refreshGallery,
    refreshing,
    getImagesByCategory,
    addCategory,
  } = useGallery();

  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    calculateCategoryStats();
  }, [images, userCreatedImages, categories]);

  const calculateCategoryStats = () => {
    const allImages = [...images, ...userCreatedImages];

    const stats = categories.map(category => {
      const categoryImages = allImages.filter(img => img.category === category.name);
      const recentImage = categoryImages.sort(
        (a, b) => new Date(b.creationTime) - new Date(a.creationTime)
      )[0];

      return {
        ...category,
        count: categoryImages.length,
        recentImage: recentImage || null,
        lastUpdated: recentImage?.creationTime || null,
      };
    });

    // Add "All Photos" category at the top
    const allPhotosCategory = {
      id: 'all',
      name: 'All Photos',
      color: '#007AFF',
      icon: 'images',
      count: allImages.length,
      recentImage: allImages.sort(
        (a, b) => new Date(b.creationTime) - new Date(a.creationTime)
      )[0] || null,
      lastUpdated: allImages[0]?.creationTime || null,
    };

    setCategoryStats([allPhotosCategory, ...stats.filter(stat => stat.count > 0)]);
  };

  const handleCategoryPress = (category) => {
    if (category.id === 'all') {
      navigation.navigate('Gallery');
    } else {
      navigation.navigate('CategoryDetail', {
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
      });
    }
  };

  const handleAddCategory = () => {
    Alert.prompt(
      'Add Category',
      'Enter a name for the new category:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (text) => {
            if (text && text.trim()) {
              try {
                await addCategory({
                  name: text.trim(),
                  color: getRandomColor(),
                  icon: 'folder-outline',
                });
                calculateCategoryStats();
              } catch (error) {
                Alert.alert('Error', 'Failed to add category');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { borderLeftColor: item.color }]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.categoryContent}>
        <View style={styles.categoryLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={24} color="#fff" />
          </View>

          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryCount}>
              {item.count} {item.count === 1 ? 'photo' : 'photos'}
            </Text>
            {item.lastUpdated && (
              <Text style={styles.categoryLastUpdated}>
                Updated {new Date(item.lastUpdated).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {item.recentImage && (
          <View style={styles.categoryPreview}>
            <Image
              source={{ uri: item.recentImage.uri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>
        )}
      </View>

      <View style={styles.categoryArrow}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Categories</Text>
      <Text style={styles.subtitle}>
        Browse your photos by category
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No photos yet</Text>
      <Text style={styles.emptySubtitle}>
        Take some photos to see them organized by categories
      </Text>
      <TouchableOpacity
        style={styles.takePictureButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="camera" size={20} color="#fff" />
        <Text style={styles.takePictureButtonText}>Take a Photo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={categoryStats}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          categoryStats.length === 0 && styles.emptyListContainer,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshGallery}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Add Category Button */}
      <TouchableOpacity
        style={styles.addCategoryButton}
        onPress={handleAddCategory}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  categoryLastUpdated: {
    fontSize: 12,
    color: '#999',
  },
  categoryPreview: {
    marginRight: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  categoryArrow: {
    padding: 4,
  },
  separator: {
    height: 12,
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
  takePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  takePictureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addCategoryButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default CategoriesScreen;
