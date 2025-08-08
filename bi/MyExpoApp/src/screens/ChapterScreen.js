import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useBible } from '../context/BibleContext';
import { useFavorites } from '../context/FavoritesContext';

const { width: screenWidth } = Dimensions.get('window');

const ChapterScreen = ({ route, navigation }) => {
  const { bookId, bookName, chapterNumber } = route.params;
  const {
    getChapter,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    addBookmark,
    removeBookmark,
    isBookmarked,
    addToRecentReads,
    getBook,
  } = useBible();

  const { toggleFavorite } = useFavorites();

  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showVerseActions, setShowVerseActions] = useState(false);

  const scrollViewRef = useRef(null);
  const book = getBook(bookId);

  useEffect(() => {
    loadChapter();
    addToRecentReads(bookId, chapterNumber);

    navigation.setOptions({
      title: `${bookName} ${chapterNumber}`,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBookmarkPress}
          >
            <Ionicons
              name={isBookmarked(bookId, chapterNumber) ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked(bookId, chapterNumber) ? '#4CAF50' : '#8B4513'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShareChapter}
          >
            <Ionicons name="share-outline" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [bookId, chapterNumber, bookName]);

  const loadChapter = () => {
    setLoading(true);
    const chapterData = getChapter(bookId, chapterNumber);
    setChapter(chapterData);
    setLoading(false);
  };

  const handleBookmarkPress = async () => {
    if (isBookmarked(bookId, chapterNumber)) {
      await removeBookmark(`${bookId}.${chapterNumber}`);
    } else {
      await addBookmark(bookId, chapterNumber);
    }
  };

  const handleShareChapter = async () => {
    if (!chapter) return;

    try {
      const chapterText = chapter.verses
        .map(verse => `${verse.number}. ${verse.text}`)
        .join('\n\n');

      await Share.share({
        message: `${bookName} ${chapterNumber}\n\n${chapterText}`,
        title: `${bookName} ${chapterNumber}`,
      });
    } catch (error) {
      console.error('Error sharing chapter:', error);
    }
  };

  const handleVersePress = (verse) => {
    setSelectedVerse(verse);
    setShowVerseActions(true);
  };

  const handleVerseLongPress = (verse) => {
    Alert.alert(
      `${bookName} ${chapterNumber}:${verse.number}`,
      verse.text,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Favorites',
          onPress: () => handleAddToFavorites(verse),
        },
        {
          text: 'Share Verse',
          onPress: () => handleShareVerse(verse),
        },
      ]
    );
  };

  const handleAddToFavorites = async (verse) => {
    try {
      await addToFavorites(
        verse.id,
        bookId,
        chapterNumber,
        verse.number,
        verse.text
      );
      Alert.alert('Success', 'Verse added to favorites!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add verse to favorites');
    }
  };

  const handleShareVerse = async (verse) => {
    try {
      await Share.share({
        message: `"${verse.text}"\n\n${bookName} ${chapterNumber}:${verse.number}`,
        title: `${bookName} ${chapterNumber}:${verse.number}`,
      });
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  const navigateToChapter = (direction) => {
    if (!book) return;

    const newChapterNumber = chapterNumber + direction;

    if (newChapterNumber < 1 || newChapterNumber > book.totalChapters) {
      return;
    }

    navigation.setParams({
      chapterNumber: newChapterNumber,
    });

    // Reload chapter data
    setTimeout(() => {
      loadChapter();
      addToRecentReads(bookId, newChapterNumber);
    }, 100);
  };

  const adjustFontSize = (increment) => {
    const newSize = fontSize + increment;
    if (newSize >= 12 && newSize <= 32) {
      setFontSize(newSize);
    }
  };

  const renderVerseActionModal = () => {
    if (!showVerseActions || !selectedVerse) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.verseActionModal}>
          <View style={styles.verseActionHeader}>
            <Text style={styles.verseActionTitle}>
              {bookName} {chapterNumber}:{selectedVerse.number}
            </Text>
            <TouchableOpacity onPress={() => setShowVerseActions(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.verseActionText}>{selectedVerse.text}</Text>

          <View style={styles.verseActions}>
            <TouchableOpacity
              style={styles.verseActionButton}
              onPress={() => {
                handleAddToFavorites(selectedVerse);
                setShowVerseActions(false);
              }}
            >
              <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
              <Text style={styles.verseActionButtonText}>Add to Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verseActionButton}
              onPress={() => {
                handleShareVerse(selectedVerse);
                setShowVerseActions(false);
              }}
            >
              <Ionicons name="share-outline" size={20} color="#8B4513" />
              <Text style={styles.verseActionButtonText}>Share Verse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderNavigationControls = () => (
    <View style={styles.navigationControls}>
      <TouchableOpacity
        style={[
          styles.navButton,
          chapterNumber <= 1 && styles.navButtonDisabled,
        ]}
        onPress={() => navigateToChapter(-1)}
        disabled={chapterNumber <= 1}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={chapterNumber <= 1 ? '#ccc' : '#8B4513'}
        />
        <Text
          style={[
            styles.navButtonText,
            chapterNumber <= 1 && styles.navButtonTextDisabled,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.chapterInfo}>
        <Text style={styles.chapterTitle}>{bookName}</Text>
        <Text style={styles.chapterNumber}>Chapter {chapterNumber}</Text>
        <Text style={styles.chapterStats}>
          {chapter?.verses?.length || 0} verses
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.navButton,
          book && chapterNumber >= book.totalChapters && styles.navButtonDisabled,
        ]}
        onPress={() => navigateToChapter(1)}
        disabled={book && chapterNumber >= book.totalChapters}
      >
        <Text
          style={[
            styles.navButtonText,
            book && chapterNumber >= book.totalChapters && styles.navButtonTextDisabled,
          ]}
        >
          Next
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={book && chapterNumber >= book.totalChapters ? '#ccc' : '#8B4513'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderFontControls = () => (
    <View style={styles.fontControls}>
      <TouchableOpacity
        style={styles.fontButton}
        onPress={() => adjustFontSize(-2)}
        disabled={fontSize <= 12}
      >
        <Ionicons
          name="remove"
          size={20}
          color={fontSize <= 12 ? '#ccc' : '#8B4513'}
        />
      </TouchableOpacity>

      <Text style={styles.fontSizeText}>{fontSize}px</Text>

      <TouchableOpacity
        style={styles.fontButton}
        onPress={() => adjustFontSize(2)}
        disabled={fontSize >= 32}
      >
        <Ionicons
          name="add"
          size={20}
          color={fontSize >= 32 ? '#ccc' : '#8B4513'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderVerse = (verse) => (
    <TouchableOpacity
      key={verse.id}
      style={styles.verseContainer}
      onPress={() => handleVersePress(verse)}
      onLongPress={() => handleVerseLongPress(verse)}
      activeOpacity={0.7}
    >
      <View style={styles.verseContent}>
        <Text style={styles.verseNumber}>{verse.number}</Text>
        <Text style={[styles.verseText, { fontSize }]}>
          {verse.text}
        </Text>
        {isFavorite(verse.id) && (
          <View style={styles.favoriteIndicator}>
            <Ionicons name="heart" size={12} color="#FF6B6B" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#666" />
        <Text style={styles.errorText}>Chapter not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderNavigationControls()}
      {renderFontControls()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.versesContainer}>
          {chapter.verses.map(renderVerse)}
        </View>
      </ScrollView>

      {renderVerseActionModal()}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 80,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  chapterInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  chapterNumber: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
    marginBottom: 2,
  },
  chapterStats: {
    fontSize: 12,
    color: '#666',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fontButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 8,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  versesContainer: {
    paddingHorizontal: 16,
  },
  verseContainer: {
    marginBottom: 12,
  },
  verseContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 28,
    textAlign: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    lineHeight: 26,
    color: '#333',
    textAlign: 'right', // For Arabic text
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseActionModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  verseActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  verseActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  verseActionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    padding: 16,
    textAlign: 'right', // For Arabic text
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  verseActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  verseActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
});

export default ChapterScreen;
