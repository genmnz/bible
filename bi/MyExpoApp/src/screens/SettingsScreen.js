import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Switch,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useGallery } from '../context/GalleryContext';
import { useFavorites } from '../context/FavoritesContext';

const SettingsScreen = ({ navigation }) => {
  const { getImageStats, refreshGallery } = useGallery();
  const { clearAllFavorites, exportFavorites, getFavoritesStats } = useFavorites();

  const [settings, setSettings] = useState({
    autoBackup: false,
    highQualityImages: true,
    showImageInfo: true,
    darkMode: false,
    notifications: true,
    autoOrganize: true,
  });

  const stats = getImageStats();
  const favStats = getFavoritesStats();

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleExportFavorites = async () => {
    try {
      const favoritesData = exportFavorites();
      const jsonString = JSON.stringify(favoritesData, null, 2);

      await Share.share({
        message: `My Gallery App Favorites:\n\n${jsonString}`,
        title: 'Export Favorites',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export favorites');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached images and may free up storage space. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            // In a real app, you'd clear the cache here
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will clear all app data including favorites and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await clearAllFavorites();
              Alert.alert('Success', 'App has been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app');
            }
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate App',
      'Would you like to rate this app in the App Store?',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Rate',
          onPress: () => {
            // In a real app, you'd open the app store
            Alert.alert('Thanks!', 'This would open the App Store in a real app');
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing Gallery App!',
        title: 'Share Gallery App',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderSettingRow = (icon, title, subtitle, value, onValueChange, type = 'switch') => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color="#007AFF" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: '#007AFF' }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      )}
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </View>
  );

  const renderInfoRow = (icon, title, value, color = '#333') => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color="#007AFF" />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );

  const renderActionRow = (icon, title, subtitle, onPress, color = '#007AFF') => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionLeft}>
        <View style={styles.actionIcon}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionTitle, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Statistics */}
        {renderSection('Statistics', (
          <>
            {renderInfoRow('images', 'Total Photos', stats.totalImages.toString())}
            {renderInfoRow('heart', 'Favorites', favStats.totalFavorites.toString(), '#FF6B6B')}
            {renderInfoRow('folder', 'Categories', stats.categories.toString())}
            {renderInfoRow('albums', 'Albums', stats.albums.toString())}
          </>
        ))}

        {/* App Settings */}
        {renderSection('Preferences', (
          <>
            {renderSettingRow(
              'cloud-upload',
              'Auto Backup',
              'Automatically backup photos to cloud',
              settings.autoBackup,
              (value) => updateSetting('autoBackup', value)
            )}
            {renderSettingRow(
              'image',
              'High Quality Images',
              'Use maximum quality for photos',
              settings.highQualityImages,
              (value) => updateSetting('highQualityImages', value)
            )}
            {renderSettingRow(
              'information-circle',
              'Show Image Info',
              'Display image metadata',
              settings.showImageInfo,
              (value) => updateSetting('showImageInfo', value)
            )}
            {renderSettingRow(
              'moon',
              'Dark Mode',
              'Use dark theme (coming soon)',
              settings.darkMode,
              (value) => updateSetting('darkMode', value)
            )}
            {renderSettingRow(
              'notifications',
              'Notifications',
              'Receive app notifications',
              settings.notifications,
              (value) => updateSetting('notifications', value)
            )}
            {renderSettingRow(
              'albums',
              'Auto Organize',
              'Automatically categorize new photos',
              settings.autoOrganize,
              (value) => updateSetting('autoOrganize', value)
            )}
          </>
        ))}

        {/* Data Management */}
        {renderSection('Data', (
          <>
            {renderActionRow(
              'download',
              'Export Favorites',
              'Export your favorite photos list',
              handleExportFavorites
            )}
            {renderActionRow(
              'refresh',
              'Refresh Gallery',
              'Reload photos from device',
              refreshGallery
            )}
            {renderActionRow(
              'trash',
              'Clear Cache',
              'Free up storage space',
              handleClearCache
            )}
            {renderActionRow(
              'warning',
              'Reset App',
              'Clear all data and settings',
              handleResetApp,
              '#FF3B30'
            )}
          </>
        ))}

        {/* About */}
        {renderSection('About', (
          <>
            {renderInfoRow('phone-portrait', 'Version', '1.0.0')}
            {renderInfoRow('code', 'Build', '2024.1.1')}
            {renderActionRow(
              'star',
              'Rate App',
              'Rate us in the App Store',
              handleRateApp
            )}
            {renderActionRow(
              'share',
              'Share App',
              'Tell your friends about this app',
              handleShareApp
            )}
            {renderActionRow(
              'mail',
              'Contact Support',
              'Get help or send feedback',
              () => Alert.alert('Contact', 'support@galleryapp.com')
            )}
            {renderActionRow(
              'document-text',
              'Privacy Policy',
              'View our privacy policy',
              () => Alert.alert('Privacy', 'Privacy policy would open here')
            )}
            {renderActionRow(
              'shield-checkmark',
              'Terms of Service',
              'View terms and conditions',
              () => Alert.alert('Terms', 'Terms of service would open here')
            )}
          </>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for photo lovers
          </Text>
          <Text style={styles.footerSubtext}>
            © 2024 Gallery App. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default SettingsScreen;
