import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useHeaderScrollShadow from '../hooks/useHeaderScrollShadow';
import { useHeaderHeight } from '@react-navigation/elements';

import { useBible } from '../context/BibleContext';
import { useThemeMode } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useThemedStyles } from '../styles/useThemedStyles';
import { makeSharedStyles } from '../styles/sharedStyles';

const FavoritesScreen = ({ navigation }) => {
  const { colors } = useThemeMode();
  const { t } = useLocale();
  const { favorites, BOOK_NAMES, removeFromFavorites, clearFavorites, getChapter } = useBible();

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const updateSort = (value) => setSortBy(value);
  const updateSearch = (value) => setSearchQuery(value);

  const localSort = (list, sort) => {
    const arr = [...list];
    switch (sort) {
      case 'newest':
        return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      case 'oldest':
        return arr.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
      case 'name': // by reference: book -> chapter -> verse
        return arr.sort((a, b) => {
          const an = (BOOK_NAMES[a.bookId] || a.bookId).localeCompare(BOOK_NAMES[b.bookId] || b.bookId);
          if (an !== 0) return an;
          if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber;
          return a.verseNumber - b.verseNumber;
        });
      default:
        return arr;
    }
  };

  const processedFavorites = useMemo(() => {
    let list = favorites || [];
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((fav) => {
        const ref = `${BOOK_NAMES[fav.bookId] || fav.bookId} ${fav.chapterNumber}:${fav.verseNumber}`.toLowerCase();
        const currentText = (() => {
          const ch = getChapter(fav.bookId, fav.chapterNumber);
          const v = ch?.verses?.find((x) => x.number === fav.verseNumber);
          return v?.text || fav.text || '';
        })().toLowerCase();
        return currentText.includes(q) || ref.includes(q);
      });
    }
    return localSort(list, sortBy);
  }, [favorites, sortBy, searchQuery, BOOK_NAMES, getChapter]);

  const listStats = useMemo(() => ({ total: processedFavorites.length }), [processedFavorites]);

  const sortOptions = [
    { value: 'newest', label: t('favorites.sort.newest') },
    { value: 'oldest', label: t('favorites.sort.oldest') },
    { value: 'name', label: t('favorites.sort.name') },
  ];

  const handleFavoritePress = async (fav, event) => {
    if (event) event.stopPropagation();
    await removeFromFavorites(fav.id);
  };

  const handleClearAllFavorites = () => {
    Alert.alert(
      t('favorites.clearAll.title'),
      t('favorites.clearAll.message'),
      [
        { text: t('ui.cancel'), style: 'cancel' },
        {
          text: t('favorites.clearAll.action'),
          style: 'destructive',
          onPress: () => clearFavorites(),
        },
      ]
    );
  };

  const styles = useThemedStyles(makeStyles);
  const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });

  const renderFavoriteItem = ({ item }) => {
    const refText = `${BOOK_NAMES[item.bookId] || item.bookId} ${item.chapterNumber}:${item.verseNumber}`;
    const currentText = (() => {
      const ch = getChapter(item.bookId, item.chapterNumber);
      const v = ch?.verses?.find((x) => x.number === item.verseNumber);
      return v?.text || item.text || '';
    })();
    return (
      <TouchableOpacity
        style={styles.favoriteItem}
        onPress={() =>
          navigation.navigate('Bible', {
            screen: 'Chapter',
            params: {
              bookId: item.bookId,
              bookName: BOOK_NAMES[item.bookId] || item.bookId,
              chapterNumber: item.chapterNumber,
              targetVerse: item.verseNumber,
            },
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.favoriteItemContent}>
          <View style={styles.favoriteItemHeader}>
            <Text style={styles.favoriteItemRef}>{refText}</Text>
            <View style={styles.favoriteItemActions}>
              <TouchableOpacity onPress={(e) => handleFavoritePress(item, e)} style={styles.iconButton}>
                <Ionicons name="heart" size={18} color={colors.danger} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
            </View>
          </View>
          <Text style={styles.favoriteItemText} numberOfLines={3}>{currentText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleContainer}>
          <Ionicons name="heart" size={32} color={colors.danger} />
          <Text style={styles.title}>{t('tab.favorites')}</Text>
        </View>
        <View style={styles.headerButtons}>
          {favorites.length > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearAllFavorites}
            >
              <Ionicons name="trash-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Controls */}
      {favorites.length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>{t('favorites.sortBy')}</Text>
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
            {listStats.total} {listStats.total === 1 ? t('favorites.count.singular') : t('favorites.count.plural')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color={colors.subtext} />
      <Text style={styles.emptyTitle}>{t('favorites.empty.title')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('favorites.empty.subtitle')}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Bible')}
      >
        <Ionicons name="book" size={20} color="#fff" />
        <Text style={styles.browseButtonText}>{t('favorites.empty.cta')}</Text>
      </TouchableOpacity>
    </View>
  );

  const headerHeight = useHeaderHeight();
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { paddingTop: headerHeight }]}>
      <FlatList
        data={processedFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          processedFavorites.length === 0 && styles.emptyListContainer,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ top: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {/* Sort Modal */}
      {sortModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.sortModal}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>{t('favorites.sortTitle')}</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subtext} />
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
                  <Ionicons name="checkmark" size={20} color={colors.danger} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => {
  const shared = makeSharedStyles(colors);
  return {
    container: shared.container,
    header: { ...shared.header, paddingHorizontal: 16, paddingBottom: 12 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    titleContainer: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginLeft: 12 },
    headerButtons: shared.headerButtons,
    headerButton: shared.headerButton,
    sortContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    sortLabel: { fontSize: 14, fontWeight: '600', color: colors.subtext, marginRight: 12 },
    sortChip: shared.chip,
    activeSortChip: { ...shared.chipActive, backgroundColor: colors.danger, borderColor: colors.danger },
    sortChipText: { ...shared.chipText },
    activeSortChipText: shared.chipTextActive,
    statsContainer: { paddingVertical: 8 },
    statsText: { fontSize: 14, color: colors.subtext },
    listContainer: { paddingVertical: 2 },
    emptyListContainer: { flex: 1 },
    favoriteItem: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12 },
    favoriteItemContent: {},
    favoriteItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    favoriteItemRef: { fontSize: 16, fontWeight: '600', color: colors.text },
    favoriteItemActions: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 6, marginRight: 4 },
    favoriteItemText: { fontSize: 14, color: colors.subtext, lineHeight: 20 },
    emptyState: shared.emptyState,
    emptyTitle: { ...shared.emptyTitle, color: colors.text },
    emptySubtitle: { ...shared.emptySubtitle, marginBottom: 24 },
    browseButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    modalOverlay: shared.modalOverlay,
    sortModal: { ...shared.modalCard, maxHeight: '60%', minWidth: '60%' },
    sortModalHeader: shared.modalHeader,
    sortModalTitle: shared.modalTitle,
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    sortOptionText: { fontSize: 16, color: colors.text },
    activeSortOptionText: { color: colors.danger, fontWeight: '600' },
  };
};

export default FavoritesScreen;
