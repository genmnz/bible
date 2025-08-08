import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export const useImagePicker = () => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      return {
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted',
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { camera: false, mediaLibrary: false };
    }
  };

  const pickImageFromGallery = async (options = {}) => {
    setLoading(true);
    try {
      const permissions = await requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to select photos.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 1,
        allowsMultipleSelection: options.allowsMultipleSelection || false,
        selectionLimit: options.selectionLimit || 1,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (options = {}) => {
    setLoading(true);
    try {
      const permissions = await requestPermissions();
      if (!permissions.camera) {
        Alert.alert(
          'Permission Required',
          'Please grant camera access to take photos.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 1,
        base64: options.base64 || false,
        exif: options.exif || false,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickMultipleImages = async (options = {}) => {
    setLoading(true);
    try {
      const permissions = await requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to select photos.'
        );
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: options.quality || 1,
        allowsMultipleSelection: true,
        selectionLimit: options.selectionLimit || 10,
      });

      if (!result.canceled) {
        return result.assets;
      }
      return [];
    } catch (error) {
      console.error('Error picking multiple images:', error);
      Alert.alert('Error', 'Failed to pick images');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async (uri, albumName = 'MyGalleryApp') => {
    setLoading(true);
    try {
      const permissions = await requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to save photos.'
        );
        return false;
      }

      // Create album if it doesn't exist
      let album = null;
      try {
        album = await MediaLibrary.getAlbumAsync(albumName);
      } catch (error) {
        console.log('Album does not exist, creating new one');
      }

      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, uri, false);
      }

      // Save the asset
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);

      return asset;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save image to gallery');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getImageInfo = async (uri) => {
    try {
      const result = await ImagePicker.getImageMetadataAsync(uri);
      return result;
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  };

  const showImagePickerOptions = () => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose an option to add an image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await takePhoto();
              resolve({ source: 'camera', result });
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await pickImageFromGallery();
              resolve({ source: 'gallery', result });
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ source: 'cancel', result: null }),
          },
        ],
        { cancelable: true, onDismiss: () => resolve({ source: 'cancel', result: null }) }
      );
    });
  };

  const cropImage = async (uri, cropData) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: cropData?.aspect || [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error cropping image:', error);
      return null;
    }
  };

  const compressImage = async (uri, quality = 0.8) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: quality,
        allowsEditing: false,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error compressing image:', error);
      return null;
    }
  };

  return {
    loading,
    requestPermissions,
    pickImageFromGallery,
    takePhoto,
    pickMultipleImages,
    saveToGallery,
    getImageInfo,
    showImagePickerOptions,
    cropImage,
    compressImage,
  };
};
