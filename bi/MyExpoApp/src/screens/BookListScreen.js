import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useHeaderScrollShadow from '../hooks/useHeaderScrollShadow';
import { useHeaderHeight } from '@react-navigation/elements';

import { useBible } from '../context/BibleContext';

import { useThemeMode } from '../context/ThemeContext';
import { useThemedStyles } from '../styles/useThemedStyles';
import { makeSharedStyles } from '../styles/sharedStyles';

const BookListScreen = ({ navigation }) => {
  const { books, loading, BOOK_NAMES } = useBible();
  const { colors } = useThemeMode();
  const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });
  const headerHeight = useHeaderHeight();
  const styles = useThemedStyles(makeStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState('all'); // 'all', 'old', 'new'
  const [chapterPickerBook, setChapterPickerBook] = useState(null);

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
      filtered = filtered.filter(book => {
        const localizedName = (BOOK_NAMES[book.id] || book.name || '').toLowerCase();
        return localizedName.includes(query) || book.id.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [books, BOOK_NAMES, searchQuery, selectedTestament]);

  const handleBookPress = (book) => {
    // Open chapter picker modal instead of navigating immediately
    setChapterPickerBook(book);
  };

  const handleChapterSelect = (chapterNumber) => {
    if (!chapterPickerBook) return;
    const b = chapterPickerBook;
    setChapterPickerBook(null);
    navigation.navigate('Chapter', {
      bookId: b.id,
      bookName: BOOK_NAMES[b.id] || b.name,
      chapterNumber,
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
            { backgroundColor: isOldTestament ? '#5095ff' : '#4CAF50' }
          ]}>
            <Ionicons name="book" size={24} color="#fff" />
          </View>

          <View style={styles.bookInfo}>
            <Text style={styles.bookName}>{BOOK_NAMES[item.id] || item.name}</Text>
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

  const renderChapterPicker = () => {
    if (!chapterPickerBook) return null;
    const count = chapterPickerBook.totalChapters || 1;
    const data = Array.from({ length: count }, (_, i) => i + 1);
    return (
      <Modal
        transparent
        animationType="fade"
        visible={!!chapterPickerBook}
        onRequestClose={() => setChapterPickerBook(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {`Select chapter — ${BOOK_NAMES[chapterPickerBook.id] || chapterPickerBook.name}`}
              </Text>
              <TouchableOpacity style={styles.headerButton} onPress={() => setChapterPickerBook(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <FlatList
                data={data}
                keyExtractor={(n) => String(n)}
                numColumns={5}
                renderItem={({ item: chapter }) => (
                  <TouchableOpacity
                    style={styles.chapterChip}
                    onPress={() => handleChapterSelect(chapter)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chapterChipText}>{chapter}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.chapterGrid}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading books...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: headerHeight }]}>
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
        scrollIndicatorInsets={{ top: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      {renderChapterPicker()}
    </SafeAreaView>
  );
};

    const makeStyles = (colors) => {
        const shared = makeSharedStyles(colors);
        return {
            container: shared.container,
            loadingContainer: shared.loadingContainer,
            loadingText: shared.loadingText,
            listContainer: shared.listContainer,
            emptyListContainer: shared.emptyListContainer,
            header: {
                ...shared.header,
                padding: 16,
                marginBottom: 8,
            },
            title: {
                fontSize: 28,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 4,
            },
            subtitle: {
                fontSize: 16,
                color: colors.subtext,
                marginBottom: 16,
            },
            searchContainer: {
                ...shared.searchContainer,
                marginBottom: 16,
            },
            searchIcon: shared.searchIcon,
            searchInput: shared.searchInput,
            testamentFilter: {
                flexDirection: 'row',
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 4,
            },
            testamentButton: {
                ...shared.chip,
                flex: 1,
                alignItems: 'center',
            },
            activeTestamentButton: shared.chipActive,
            testamentButtonText: {
                ...shared.chipText,
                fontSize: 14,
            },
            activeTestamentButtonText: shared.chipTextActive,
            bookItem: shared.cardItem,
            bookContent: {
                ...shared.cardContent,
                flexDirection: 'row',
                alignItems: 'center',
            },
            bookIcon: shared.cardIcon,
            bookInfo: {
                flex: 1,
            },
            bookName: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 4,
            },
            bookMeta: {
                flexDirection: 'column',
            },
            bookTestament: {
                fontSize: 14,
                color: colors.primary,
                fontWeight: '500',
                marginBottom: 2,
            },
            bookStats: {
                fontSize: 12,
                color: colors.subtext,
            },
            bookArrow: shared.cardArrow,
            separator: shared.separator,
            emptyState: shared.emptyState,
            emptyTitle: shared.emptyTitle,
            emptySubtitle: {
                ...shared.emptySubtitle,
                marginBottom: 24,
            },
            clearSearchButton: {
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 24,
            },
            clearSearchText: {
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
            },
            // Modal styles reusing shared fragments
            modalOverlay: shared.modalOverlay,
            modalCard: {
                ...shared.modalCard,
                width: '92%',
                maxWidth: 520,
            },
            modalHeader: shared.modalHeader,
            modalTitle: shared.modalTitle,
            headerButton: shared.headerButton,
            // Chapter chips grid
            chapterGrid: shared.chapterGrid,
            chapterChip: shared.chapterChip,
            chapterChipText: shared.chapterChipText,
        };
    };
  


export default BookListScreen;
