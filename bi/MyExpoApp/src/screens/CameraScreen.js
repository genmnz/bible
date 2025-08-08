import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';

import { useGallery } from '../context/GalleryContext';
import { useImagePicker } from '../hooks/useImagePicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [zoom, setZoom] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const cameraRef = useRef(null);
  const { addUserCreatedImage } = useGallery();
  const { saveToGallery } = useImagePicker();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to take photos.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            {
              text: 'Settings',
              onPress: () => {
                // In a real app, you'd open device settings
                Alert.alert('Please enable camera permission in device settings');
              }
            },
          ]
        );
      }
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: true,
      });

      setPreviewPhoto(photo);
      setShowPreview(true);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setCapturing(false);
    }
  };

  const savePhoto = async () => {
    if (!previewPhoto) return;

    try {
      // Save to device gallery
      const asset = await saveToGallery(previewPhoto.uri);

      if (asset) {
        // Add to app's gallery
        await addUserCreatedImage({
          uri: previewPhoto.uri,
          filename: `Camera_${Date.now()}.jpg`,
          width: previewPhoto.width,
          height: previewPhoto.height,
          aspectRatio: previewPhoto.width / previewPhoto.height,
        });

        Alert.alert('Success', 'Photo saved successfully!');
        setShowPreview(false);
        setPreviewPhoto(null);
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  const retakePhoto = () => {
    setShowPreview(false);
    setPreviewPhoto(null);
  };

  const toggleCameraType = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlashMode = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : flashMode === Camera.Constants.FlashMode.on
        ? Camera.Constants.FlashMode.auto
        : Camera.Constants.FlashMode.off
    );
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case Camera.Constants.FlashMode.on:
        return 'flash';
      case Camera.Constants.FlashMode.auto:
        return 'flash-outline';
      default:
        return 'flash-off';
    }
  };

  const handleZoom = (value) => {
    setZoom(Math.min(1, Math.max(0, value)));
  };

  const closeCamera = () => {
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#ccc" />
        <Text style={styles.noPermissionTitle}>No Camera Access</Text>
        <Text style={styles.noPermissionText}>
          Please grant camera permission to use this feature
        </Text>
        <TouchableOpacity style={styles.goBackButton} onPress={closeCamera}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showPreview && previewPhoto) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Image
          source={{ uri: previewPhoto.uri }}
          style={styles.previewImage}
          contentFit="contain"
        />

        <View style={styles.previewControls}>
          <SafeAreaView>
            <View style={styles.previewButtonsContainer}>
              <TouchableOpacity style={styles.previewButton} onPress={retakePhoto}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.previewButton, styles.saveButton]} onPress={savePhoto}>
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.previewButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        flashMode={flashMode}
        zoom={zoom}
        ratio="16:9"
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <SafeAreaView>
            <View style={styles.topControlsContent}>
              <TouchableOpacity style={styles.controlButton} onPress={closeCamera}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={toggleFlashMode}>
                <Ionicons name={getFlashIcon()} size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Zoom Indicator */}
        {zoom > 0 && (
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{(zoom * 10 + 1).toFixed(1)}x</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <SafeAreaView>
            <View style={styles.bottomControlsContent}>
              {/* Gallery Preview Button */}
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => navigation.navigate('Gallery')}
              >
                <Ionicons name="images" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Capture Button */}
              <TouchableOpacity
                style={[styles.captureButton, capturing && styles.capturingButton]}
                onPress={takePicture}
                disabled={capturing}
              >
                <View style={styles.captureButtonInner}>
                  {capturing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={styles.captureButtonCenter} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Camera Flip Button */}
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
                <Ionicons name="camera-reverse" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Zoom Slider */}
            <View style={styles.zoomContainer}>
              <TouchableOpacity onPress={() => handleZoom(0)}>
                <Text style={styles.zoomLabel}>1x</Text>
              </TouchableOpacity>

              <View style={styles.zoomSliderContainer}>
                <View style={styles.zoomSlider}>
                  <View
                    style={[
                      styles.zoomSliderFill,
                      { width: `${zoom * 100}%` }
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.zoomSliderThumb,
                      { left: `${zoom * 100}%` }
                    ]}
                    onPanResponderMove={(_, gestureState) => {
                      const newZoom = gestureState.moveX / screenWidth;
                      handleZoom(newZoom);
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity onPress={() => handleZoom(1)}>
                <Text style={styles.zoomLabel}>10x</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  noPermissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noPermissionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  goBackButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topControlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    position: 'absolute',
    top: '50%',
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    transform: [{ translateY: -12 }],
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomControlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  capturingButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  zoomLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  zoomSliderContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  zoomSlider: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  zoomSliderFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  zoomSliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    transform: [{ translateX: -8 }],
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  previewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CameraScreen;
