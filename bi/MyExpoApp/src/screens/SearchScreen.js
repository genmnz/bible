import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useHeaderScrollShadow from '../hooks/useHeaderScrollShadow';
import { useHeaderHeight } from '@react-navigation/elements';

import { useBible } from '../context/BibleContext';
import { useThemeMode } from '../context/ThemeContext';
import { useThemedStyles } from '../styles/useThemedStyles';
import { makeSharedStyles } from '../styles/sharedStyles';

const SearchScreen = ({ navigation }) => {
  const { colors } = useThemeMode();
  const { searchVerses, books, BOOK_NAMES } = useBible();
  const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });
  const headerHeight = useHeaderHeight();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedBook]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = searchVerses(searchQuery, selectedBook);
      setSearchResults(results);

      // Add to recent searches
      if (searchQuery.trim() && results.length > 0) {
        const newRecentSearch = {
          id: Date.now().toString(),
          query: searchQuery.trim(),
          resultsCount: results.length,
          timestamp: Date.now(),
        };

        setRecentSearches(prev => [
          newRecentSearch,
          ...prev.filter(item => item.query !== searchQuery.trim()).slice(0, 9)
        ]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result) => {
    navigation.navigate('Chapter', {
      bookId: result.bookId,
      bookName: result.bookName,
      chapterNumber: result.chapterNumber,
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleRecentSearchPress = (recentSearch) => {
    setSearchQuery(recentSearch.query);
  };

  const styles = useThemedStyles(makeStyles);

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultReference}>
            {item.bookName} {item.chapterNumber}:{item.number}
          </Text>
          <View style={styles.resultIcon}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.resultText} numberOfLines={3}>
          {item.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={16} color={colors.subtext} />
      <Text style={styles.recentSearchText}>{item.query}</Text>
      <Text style={styles.recentSearchCount}>
        {item.resultsCount} results
      </Text>
    </TouchableOpacity>
  );

  const renderBookFilter = () => (
    <View style={styles.bookFilterContainer}>
      <Text style={styles.bookFilterLabel}>Search in:</Text>
      <TouchableOpacity
        style={[
          styles.bookFilterButton,
          !selectedBook && styles.activeBookFilter,
        ]}
        onPress={() => setSelectedBook(null)}
      >
        <Text
          style={[
            styles.bookFilterText,
            !selectedBook && styles.activeBookFilterText,
          ]}
        >
          All Books
        </Text>
      </TouchableOpacity>

      {/* Show some popular books */}
      {['Gen', 'Ps', 'Matt', 'John'].map((bookId) => (
        <TouchableOpacity
          key={bookId}
          style={[
            styles.bookFilterButton,
            selectedBook === bookId && styles.activeBookFilter,
          ]}
          onPress={() => setSelectedBook(selectedBook === bookId ? null : bookId)}
        >
          <Text
            style={[
              styles.bookFilterText,
              selectedBook === bookId && styles.activeBookFilterText,
            ]}
          >
            {BOOK_NAMES[bookId]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery.trim() === '' ? (
        <>
          <Ionicons name="search-outline" size={64} color={colors.subtext} />
          <Text style={styles.emptyTitle}>Search Scripture</Text>
          <Text style={styles.emptySubtitle}>
            Enter keywords to find verses in the Bible
          </Text>
        </>
      ) : loading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptySubtitle}>Searching...</Text>
        </>
      ) : (
        <>
          <Ionicons name="search-outline" size={64} color={colors.subtext} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            Try different keywords or check your spelling
          </Text>
        </>
      )}
    </View>
  );

  const renderSearchHeader = () => (
    <View style={styles.searchHeader}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.subtext} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search verses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.subtext}
          autoFocus={false}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {renderBookFilter()}

      {searchResults.length > 0 && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (searchQuery.trim() === '' && recentSearches.length > 0) {
      return (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearch}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ top: headerHeight }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          />
        </View>
      );
    }

    if (searchResults.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ top: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { paddingTop: headerHeight }]}>
      {renderSearchHeader()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => {
  const shared = makeSharedStyles(colors);
  return {
    container: shared.container,
    searchHeader: { ...shared.header, paddingHorizontal: 16, paddingVertical: 12 },
    searchContainer: { ...shared.searchContainer, marginBottom: 12 },
    searchIcon: shared.searchIcon,
    searchInput: shared.searchInput,
    clearButton: shared.clearButton,
    bookFilterContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
    bookFilterLabel: { fontSize: 14, color: colors.subtext, marginRight: 8, marginBottom: 4 },
    bookFilterButton: shared.chip,
    activeBookFilter: shared.chipActive,
    bookFilterText: shared.chipText,
    activeBookFilterText: shared.chipTextActive,
    resultsCount: { paddingVertical: 4 },
    resultsCountText: { fontSize: 14, color: colors.subtext, fontWeight: '500' },
    content: { flex: 1 },
    resultsList: { paddingVertical: 8 },
    resultItem: shared.cardItem,
    resultContent: shared.cardContent,
    resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    resultReference: { fontSize: 14, fontWeight: '600', color: colors.primary },
    resultIcon: shared.cardArrow,
    resultText: { fontSize: 16, color: colors.text, lineHeight: 24, textAlign: 'right' },
    separator: shared.separator,
    recentSearchesContainer: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
    recentSearchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    recentSearchText: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 12 },
    recentSearchCount: { fontSize: 12, color: colors.subtext },
    emptyState: shared.emptyState,
    emptyTitle: { ...shared.emptyTitle, color: colors.text },
    emptySubtitle: shared.emptySubtitle,
  };
};

export default SearchScreen;
