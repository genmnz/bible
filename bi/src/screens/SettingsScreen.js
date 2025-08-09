import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocale } from '../context/LocaleContext';
import { useBible } from '../context/BibleContext';
import { useThemeMode } from '../context/ThemeContext';
import { useThemedStyles } from '../styles/useThemedStyles';
import useHeaderScrollShadow from '../hooks/useHeaderScrollShadow';
import { useHeaderHeight } from '@react-navigation/elements';

const SettingsScreen = ({ navigation }) => {
  const { t, language, setLanguage } = useLocale();
  const { getStats, favorites } = useBible();
  const { mode, setMode, colors } = useThemeMode();
  const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });
  const headerHeight = useHeaderHeight();

  const [settings, setSettings] = useState({
    autoBackup: false,
    highQualityImages: true,
    showImageInfo: true,
    darkMode: false,
    notifications: true,
    autoOrganize: true,
  });

  const stats = getStats();

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
      const favoritesData = favorites || [];
      const jsonString = JSON.stringify(favoritesData, null, 2);
      await Share.share({
        message: jsonString,
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

  const styles = useThemedStyles(makeStyles);

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
          <Ionicons name={icon} size={20} color={colors.primary} />
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
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      )}
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </View>
  );

  const renderInfoRow = (icon, title, value, color = colors.text) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );

  const renderActionRow = (icon, title, subtitle, onPress, color = colors.primary) => (
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
    <SafeAreaView style={[styles.container, { paddingTop: headerHeight }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ top: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Language */}
        {renderSection(t('settings.language'), (
          <>
            <TouchableOpacity style={styles.settingRow} onPress={() => setLanguage('ar')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="globe-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{t('settings.language.arabic')}</Text>
                </View>
              </View>
              {language === 'ar' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => setLanguage('en')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="globe-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{t('settings.language.english')}</Text>
                </View>
              </View>
              {language === 'en' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
          </>
        ))}

        {/* Appearance / Theme */}
        {renderSection(t('settings.theme'), (
          <>
            <TouchableOpacity style={styles.settingRow} onPress={() => setMode('system')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="contrast-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{t('theme.system')}</Text>
                </View>
              </View>
              {mode === 'system' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => setMode('light')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="sunny-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{t('theme.light')}</Text>
                </View>
              </View>
              {mode === 'light' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => setMode('dark')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="moon-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{t('theme.dark')}</Text>
                </View>
              </View>
              {mode === 'dark' && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
          </>
        ))}

        {/* App Statistics */}
        {renderSection(t('settings.section.statistics'), (
          <>
            {renderInfoRow('book', t('stats.books'), String(stats.totalBooks || 0))}
            {renderInfoRow('list', t('stats.chapters'), String(stats.totalChapters || 0))}
            {renderInfoRow('heart', t('stats.favorites'), String((favorites || []).length), colors.danger)}
          </>
        ))}

        {/* App Settings */}
        {renderSection(t('settings.section.preferences'), (
          <>
            {renderSettingRow(
              'information-circle',
              'Show Image Info',
              'Display image metadata',
              settings.showImageInfo,
              (value) => updateSetting('showImageInfo', value)
            )}
            {renderSettingRow(
              'notifications',
              'Notifications',
              'Receive app notifications',
              settings.notifications,
              (value) => updateSetting('notifications', value)
            )}
          </>
        ))}

        {/* Data Management */}
        {renderSection(t('settings.section.data'), (
          <>
            {renderActionRow(
              'download',
              t('settings.exportFavorites'),
              'Export your favorite photos list',
              handleExportFavorites
            )}
            {renderActionRow(
              'trash',
              t('settings.clearCache'),
              'Free up storage space',
              handleClearCache
            )}
            {renderActionRow(
              'warning',
              t('settings.resetApp'),
              'Clear all data and settings',
              handleResetApp,
              colors.danger
            )}
          </>
        ))}

        {/* About */}
        {renderSection(t('settings.section.about'), (
          <>
            {renderInfoRow('phone-portrait', 'Version', '1.0.0')}
            {renderInfoRow('code', 'Build', '2025.8.8')}
            {renderActionRow(
              'star',
              t('settings.rateApp'),
              'Rate us in the App Store',
              handleRateApp
            )}
            {renderActionRow(
              'share',
              t('settings.shareApp'),
              'Tell your friends about this app',
              handleShareApp
            )}
            {renderActionRow(
              'mail',
              t('settings.contactSupport'),
              'Get help or send feedback',
              () => Alert.alert('Contact', 'support@galleryapp.com')
            )}
            {renderActionRow(
              'document-text',
              t('settings.privacyPolicy'),
              'View our privacy policy',
              () => Alert.alert('Privacy', 'Privacy policy would open here')
            )}
            {renderActionRow(
              'shield-checkmark',
              t('settings.termsOfService'),
              'View terms and conditions',
              () => Alert.alert('Terms', 'Terms of service would open here')
            )}
          </>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made by MELAD
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 MELAD. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
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
    backgroundColor: colors.primary + '20',
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
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.subtext,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    color: colors.text,
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
    borderBottomColor: colors.border,
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
    backgroundColor: colors.primary + '20',
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
    color: colors.subtext,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default SettingsScreen;
