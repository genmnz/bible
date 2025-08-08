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

import { useBible } from '../context/BibleContext';

const SearchScreen = ({ navigation }) => {
  const { searchVerses, books, BOOK_NAMES } = useBible();
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
            <Ionicons name="chevron-forward" size={16} color="#8B4513" />
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
      <Ionicons name="time-outline" size={16} color="#666" />
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
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Search Scripture</Text>
          <Text style={styles.emptySubtitle}>
            Enter keywords to find verses in the Bible
          </Text>
        </>
      ) : loading ? (
        <>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.emptySubtitle}>Searching...</Text>
        </>
      ) : (
        <>
          <Ionicons name="search-outline" size={64} color="#ccc" />
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
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search verses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
          autoFocus={false}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchHeader()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  bookFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  bookFilterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    marginBottom: 4,
  },
  bookFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 4,
  },
  activeBookFilter: {
    backgroundColor: '#8B4513',
  },
  bookFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeBookFilterText: {
    color: '#fff',
  },
  resultsCount: {
    paddingVertical: 4,
  },
  resultsCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  resultsList: {
    paddingVertical: 8,
  },
  resultItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultContent: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  resultIcon: {
    padding: 4,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'right', // For Arabic text
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  recentSearchesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  recentSearchCount: {
    fontSize: 12,
    color: '#666',
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
  },
});

export default SearchScreen;
