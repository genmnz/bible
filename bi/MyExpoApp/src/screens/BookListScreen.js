import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useBible } from '../context/BibleContext';

const BookListScreen = ({ navigation }) => {
  const { books, loading } = useBible();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState('all'); // 'all', 'old', 'new'

  // Old Testament books (first 39 books)
  const oldTestamentBooks = [
    'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth',
    '1Sam', '2Sam', '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh',
    'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer',
    'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jonah',
    'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal'
  ];

  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Filter by testament
    if (selectedTestament === 'old') {
      filtered = books.filter(book => oldTestamentBooks.includes(book.id));
    } else if (selectedTestament === 'new') {
      filtered = books.filter(book => !oldTestamentBooks.includes(book.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.name.toLowerCase().includes(query) ||
        book.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [books, searchQuery, selectedTestament]);

  const handleBookPress = (book) => {
    navigation.navigate('Chapter', {
      bookId: book.id,
      bookName: book.name,
      chapterNumber: 1,
    });
  };

  const renderTestamentFilter = () => (
    <View style={styles.testamentFilter}>
      {[
        { key: 'all', label: 'All Books' },
        { key: 'old', label: 'Old Testament' },
        { key: 'new', label: 'New Testament' },
      ].map((testament) => (
        <TouchableOpacity
          key={testament.key}
          style={[
            styles.testamentButton,
            selectedTestament === testament.key && styles.activeTestamentButton,
          ]}
          onPress={() => setSelectedTestament(testament.key)}
        >
          <Text
            style={[
              styles.testamentButtonText,
              selectedTestament === testament.key && styles.activeTestamentButtonText,
            ]}
          >
            {testament.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookItem = ({ item }) => {
    const isOldTestament = oldTestamentBooks.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.bookContent}>
          <View style={[
            styles.bookIcon,
            { backgroundColor: isOldTestament ? '#8B4513' : '#4CAF50' }
          ]}>
            <Ionicons name="book" size={24} color="#fff" />
          </View>

          <View style={styles.bookInfo}>
            <Text style={styles.bookName}>{item.name}</Text>
            <View style={styles.bookMeta}>
              <Text style={styles.bookTestament}>
                {isOldTestament ? 'Old Testament' : 'New Testament'}
              </Text>
              <Text style={styles.bookStats}>
                {item.totalChapters} {item.totalChapters === 1 ? 'chapter' : 'chapters'} • {item.totalVerses} verses
              </Text>
            </View>
          </View>

          <View style={styles.bookArrow}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Books of the Bible</Text>
      <Text style={styles.subtitle}>
        {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {renderTestamentFilter()}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No books found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No books match "${searchQuery}"`
          : 'No books available'
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearSearchText}>Clear search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          filteredBooks.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  testamentFilter: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  testamentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTestamentButton: {
    backgroundColor: '#8B4513',
  },
  testamentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTestamentButtonText: {
    color: '#fff',
  },
  bookItem: {
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
  bookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookMeta: {
    flexDirection: 'column',
  },
  bookTestament: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    marginBottom: 2,
  },
  bookStats: {
    fontSize: 12,
    color: '#666',
  },
  bookArrow: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
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
  clearSearchButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookListScreen;
