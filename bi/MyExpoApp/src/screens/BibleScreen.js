import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useHeaderScrollShadow from '../hooks/useHeaderScrollShadow';
import { useHeaderHeight } from '@react-navigation/elements';

import { useBible } from '../context/BibleContext';
import { useLocale } from '../context/LocaleContext';
import { useThemeMode } from '../context/ThemeContext';
import { useThemedStyles } from '../styles/useThemedStyles';
import { makeSharedStyles } from '../styles/sharedStyles';
const { width: screenWidth } = Dimensions.get('window');

const BibleScreen = ({ navigation }) => {
  const {
    books,
    loading,
    recentReads,
    favorites,
    getStats,
    addToRecentReads,
    BOOK_NAMES,
  } = useBible();

  const { t, language } = useLocale();
  const { colors } = useThemeMode();
  const styles = useThemedStyles(makeStyles);

  const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });
  const headerHeight = useHeaderHeight();

  const [stats, setStats] = useState({});

  useEffect(() => {
    setStats(getStats());
  }, [books, favorites, recentReads]);

  const handleBookPress = (book) => {
    navigation.navigate('Chapter', {
      bookId: book.id,
      bookName: BOOK_NAMES[book.id] || book.name,
      chapterNumber: 1,
    });
    addToRecentReads(book.id, 1);
  };

  const handleRecentReadPress = (recentRead) => {
    navigation.navigate('Chapter', {
      bookId: recentRead.bookId,
      bookName: BOOK_NAMES[recentRead.bookId] || recentRead.bookName,
      chapterNumber: recentRead.chapterNumber,
    });
  };

  const renderWelcomeCard = () => (
    <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
      <View style={styles.welcomeContent}>
        <Ionicons name="book" size={32} color={colors.primary} />
        <View style={styles.welcomeText}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t('title.bibleHome')}</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.subtext }]}>{t('settings.bibleVersion')}</Text>
          <View style={styles.versionSelector}>
            <Text style={[styles.versionButtonText, { color: colors.text }]}> 
              {language === 'ar' ? t('version.arasvd') : t('version.kjv')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderQuickActionsAndStats = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ui.quickActions')}</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('BookList')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4  }}>
            <Ionicons name="library" size={24} color={colors.primary} />
          <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('stats.books')}</Text>
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalBooks || 0}</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>{t('ui.browseBooks')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Search')}
        >
          {/* wrap the icon and stats in a flex container */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4  }}>
            <Ionicons name="search" size={24} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('stats.chapters')}</Text>
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalChapters || 0}</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>{t('ui.search')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Favorites')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4  }}>
          <Ionicons name="heart" size={24} color={colors.danger} />
          <Text style={[styles.statLabel, { color: colors.subtext }]}>{t('stats.favorites')}</Text>
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.favorites || 0}</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>{t('ui.favorites')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentReads = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ui.recentReads')}</Text>
        {recentReads.length > 3 && (
          <TouchableOpacity onPress={() => navigation.navigate('BookList')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('ui.seeAll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentReads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>{t('ui.noRecentReads')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.subtext }]}>{t('ui.startReading')}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentReadsContainer}
        >
          {recentReads.slice(0, 5).map((recentRead) => (
            <TouchableOpacity
              key={recentRead.id}
              style={[styles.recentReadCard, { backgroundColor: colors.card }]}
              onPress={() => handleRecentReadPress(recentRead)}
            >
              <View style={[styles.recentReadIcon, { backgroundColor: '#f5f5f5' }]}>
                <Ionicons name="book-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.recentReadBook, { color: colors.text }]} numberOfLines={1}>
                {BOOK_NAMES[recentRead.bookId] || recentRead.bookName}
              </Text>
              <Text style={[styles.recentReadChapter, { color: colors.subtext }]}>
                {t('title.chapter')} {recentRead.chapterNumber}
              </Text>
              <Text style={[styles.recentReadTime, { color: colors.subtext }]}>
                {new Date(recentRead.readAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

const renderStories = () => {
  const Stories = [
    { id: 'Gen', name: 'Genesis' },
    { id: 'Ps', name: 'Psalms' },
    { id: 'Matt', name: 'Matthew' },
    { id: 'John', name: 'John' },
  ];
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ui.stories')}</Text>
      <View style={styles.storiesContainer}>
        {Stories.map((book) => {
          const fullBook = books.find(b => b.id === book.id);
          if (!fullBook) return null;

          return (
            <TouchableOpacity
              key={book.id}
              style={[styles.storiesCard, { backgroundColor: colors.card }]}
              onPress={() => handleBookPress(fullBook)}
            >
              <View style={styles.storiesIcon}>
                <Ionicons name="book" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.storiesName, { color: colors.text }]} numberOfLines={1}>
                {BOOK_NAMES[book.id] || book.name}
              </Text>
              <Text style={[styles.storiesChapters, { color: colors.subtext }]}>
                {fullBook.totalChapters} {t('ui.chapters')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

if (loading) {
  return (
    <SafeAreaView style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </SafeAreaView>
  );
}

return (
  <SafeAreaView style={[styles.container, { paddingTop: headerHeight }]}>
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollIndicatorInsets={{ top: headerHeight }}
    >
      {renderWelcomeCard()}
      {renderQuickActionsAndStats()}
      {renderRecentReads()}
      {renderStories()}
    </ScrollView>
  </SafeAreaView>
);
}

  const makeStyles = (colors) => {
      const shared = makeSharedStyles(colors);
      return {
      container: shared.container,
      loadingContainer: shared.loadingContainer,
      loadingText: shared.loadingText,
      scrollView: shared.scrollView,
      scrollContent: shared.scrollContent,
      welcomeCard: {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
      },
      welcomeContent: {
          flexDirection: 'row',
          alignItems: 'center',
      },
      welcomeText: {
          marginLeft: 16,
          flex: 1,
      },
      welcomeTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 4,
      },
      welcomeSubtitle: {
          fontSize: 16,
          color: colors.subtext,
      },
      versionSelector: {
          marginTop: 12,
          alignSelf: 'flex-start',
      },
      versionButton: {
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
      },
      versionButtonText: {
          fontSize: 14,
          fontWeight: '500',
      },
      modalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
      },
      modalContainer: {
          width: (screenWidth - 48),
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
      },
      modalTitle: {
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 8,
      },
      modalOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
      },
      modalOptionText: {
          marginLeft: 10,
          fontSize: 16,
      },
      modalClose: {
          marginTop: 8,
          alignSelf: 'flex-end',
      },
      modalCloseText: {
          fontSize: 14,
          fontWeight: '600',
      },
      statsContainer: {
          marginBottom: 24,
      },
      statsRow: {
          flexDirection: 'row',
          marginBottom: 12,
      },
      statCard: { ...shared.statCard, flex: 1, marginHorizontal: 6 },
      statNumber: shared.statNumber,
      statLabel: shared.statLabel,
      section: shared.section,
      sectionHeader: shared.sectionHeader,
      sectionTitle: { ...shared.sectionTitle, fontSize: 20 },
      seeAllText: shared.seeAllText,
      quickActionsContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
      },
      quickActionButton: {
          width: (screenWidth - 48) / 2,
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 20,
          alignItems: 'center',
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
      },
      quickActionText: {
          fontSize: 16,
          fontWeight: '500',
          color: colors.text,
          marginTop: 8,
          textAlign: 'center',
      },
      recentReadsContainer: {
          paddingRight: 16,
      },
      recentReadCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          width: 140,
          marginRight: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
      },
      recentReadIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
      },
      recentReadBook: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
      },
      recentReadChapter: {
          fontSize: 12,
          color: colors.subtext,
          marginBottom: 8,
      },
      recentReadTime: {
          fontSize: 10,
          color: colors.subtext,
      },
      storiesContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
      },
      storiesCard: {
          width: (screenWidth - 48) / 3,
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          alignItems: 'center',
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
      },
      storiesIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
      },
      storiesName: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
          textAlign: 'center',
      },
      storiesChapters: {
          fontSize: 10,
          color: colors.subtext,
          textAlign: 'center',
      },
      emptyState: {
          alignItems: 'center',
          paddingVertical: 32,
      },
      emptyText: {
          fontSize: 16,
          fontWeight: '500',
          color: colors.subtext,
          marginTop: 12,
          marginBottom: 4,
      },
      emptySubtext: {
          fontSize: 14,
          color: colors.subtext,
          textAlign: 'center',
      },
  }
};
export default BibleScreen;
