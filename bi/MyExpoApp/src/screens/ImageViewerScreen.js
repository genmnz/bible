import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  StatusBar,
  Alert,
  PanResponder,
  Animated,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useFavorites } from '../context/FavoritesContext';
import { useGallery } from '../context/GalleryContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewerScreen = ({ route, navigation }) => {
  const { images, initialIndex = 0 } = route.params;
  const { toggleFavorite, isFavorite } = useFavorites();
  const { deleteImage } = useGallery();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  // Pan and zoom state
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const currentImage = images[currentIndex];
  const isCurrentFavorite = isFavorite(currentImage?.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Pan responder for gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      setShowControls(!showControls);
    },

    onPanResponderMove: (evt, gestureState) => {
      if (scale > 1) {
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);
      } else {
        // Handle swipe to next/previous image
        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0 && currentIndex > 0) {
            // Swipe right - previous image
            navigateToImage(currentIndex - 1);
          } else if (gestureState.dx < 0 && currentIndex < images.length - 1) {
            // Swipe left - next image
            navigateToImage(currentIndex + 1);
          }
        }
      }
    },

    onPanResponderRelease: () => {
      if (scale > 1) {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const navigateToImage = (index) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      setImageLoading(true);
      resetZoom();
    }
  };

  const resetZoom = () => {
    setScale(1);
    setLastScale(1);
    scaleValue.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  };

  const handleDoubleTap = () => {
    if (scale === 1) {
      // Zoom in
      setScale(2);
      setLastScale(2);
      Animated.spring(scaleValue, {
        toValue: 2,
        useNativeDriver: true,
      }).start();
    } else {
      // Zoom out
      resetZoom();
    }
  };

  const handleFavoritePress = async () => {
    if (currentImage) {
      await toggleFavorite(currentImage);
    }
  };

  const handleShareImage = async () => {
    if (!currentImage) return;

    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(currentImage.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Photo',
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleDeleteImage = () => {
    if (!currentImage) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImage(currentImage.id);

              if (images.length === 1) {
                navigation.goBack();
              } else {
                const newIndex = currentIndex >= images.length - 1
                  ? currentIndex - 1
                  : currentIndex;
                navigateToImage(newIndex);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  const handleSaveImage = async () => {
    if (!currentImage) return;

    try {
      const fileUri = FileSystem.documentDirectory + currentImage.filename;
      await FileSystem.copyAsync({
        from: currentImage.uri,
        to: fileUri,
      });

      Alert.alert('Success', 'Image saved to device');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const getImageInfo = () => {
    if (!currentImage) return {};

    const sizeInMB = currentImage.fileSize
      ? (currentImage.fileSize / (1024 * 1024)).toFixed(2)
      : 'Unknown';

    return {
      filename: currentImage.filename || 'Unknown',
      dimensions: `${currentImage.width || 0} × ${currentImage.height || 0}`,
      size: `${sizeInMB} MB`,
      category: currentImage.category || 'Others',
      date: currentImage.creationTime
        ? new Date(currentImage.creationTime).toLocaleDateString()
        : 'Unknown',
    };
  };

  const showImageInfo = () => {
    const info = getImageInfo();
    Alert.alert(
      'Image Information',
      `Filename: ${info.filename}\n` +
      `Dimensions: ${info.dimensions}\n` +
      `Size: ${info.size}\n` +
      `Category: ${info.category}\n` +
      `Date: ${info.date}`,
      [{ text: 'OK' }]
    );
  };

  if (!currentImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#666" />
          <Text style={styles.errorText}>Image not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Image Container */}
      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              transform: [
                { translateX },
                { translateY },
                { scale: scaleValue },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowControls(!showControls)}
            onLongPress={handleDoubleTap}
            style={styles.imageTouchable}
          >
            <Image
              source={{ uri: currentImage.uri }}
              style={styles.image}
              contentFit="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              transition={200}
            />

            {imageLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Top Controls */}
      {showControls && (
        <Animated.View style={styles.topControls}>
          <SafeAreaView>
            <View style={styles.topControlsContent}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.imageCounter}>
                <Text style={styles.counterText}>
                  {currentIndex + 1} of {images.length}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={showImageInfo}
              >
                <Ionicons name="information-circle-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Bottom Controls */}
      {showControls && (
        <Animated.View style={styles.bottomControls}>
          <SafeAreaView>
            <View style={styles.bottomControlsContent}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleFavoritePress}
              >
                <Ionicons
                  name={isCurrentFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isCurrentFavorite ? '#FF6B6B' : '#fff'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleShareImage}
              >
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleSaveImage}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>

              {currentImage.isUserCreated && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleDeleteImage}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Navigation Arrows */}
      {showControls && images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navigationArrow, styles.leftArrow]}
              onPress={() => navigateToImage(currentIndex - 1)}
            >
              <Ionicons name="chevron-back" size={32} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}

          {currentIndex < images.length - 1 && (
            <TouchableOpacity
              style={[styles.navigationArrow, styles.rightArrow]}
              onPress={() => navigateToImage(currentIndex + 1)}
            >
              <Ionicons name="chevron-forward" size={32} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Image Title */}
      {showControls && currentImage.filename && (
        <View style={styles.imageTitleContainer}>
          <Text style={styles.imageTitle} numberOfLines={1}>
            {currentImage.filename}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  topControlsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomControlsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  imageCounter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  navigationArrow: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -24 }],
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  imageTitleContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  imageTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ImageViewerScreen;
