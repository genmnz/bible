import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
  Dimensions,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useHeaderScrollShadow from '../hooks/useHeaderScrollShadow';
import { useHeaderHeight } from '@react-navigation/elements';

import { useBible } from '../context/BibleContext';
import { useThemeMode } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { useThemedStyles } from '../styles/useThemedStyles';

const { width: screenWidth } = Dimensions.get('window');

const ChapterScreen = ({ route, navigation }) => {
  const { colors } = useThemeMode();
  const { t } = useLocale();
  const { bookId, bookName, chapterNumber, targetVerse } = route.params;
  const {
    getChapter,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    addToRecentReads,
    getBook,
  } = useBible();

  // verse favorites are managed via useBible()

  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [highlightedVerse, setHighlightedVerse] = useState(null);
  const [showVerseActions, setShowVerseActions] = useState(false);
  const [chapterSheetVisible, setChapterSheetVisible] = useState(false);

  const scrollViewRef = useRef(null);
  const versePositions = useRef({});
  const book = getBook(bookId);

  // header shadow handler
  const onScroll = useHeaderScrollShadow(navigation, { colors, threshold: 6 });
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    loadChapter();
    addToRecentReads(bookId, chapterNumber);

    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitle}
          onPress={() => setChapterSheetVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.headerTitleText}>{bookName} {chapterNumber}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.subtext} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.headerNavButton}
            onPress={() => navigateToChapter(-1)}
            disabled={chapterNumber <= 1}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={chapterNumber <= 1 ? colors.subtext : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerFontButton}
            onPress={() => adjustFontSize(-2)}
            disabled={fontSize <= 12}
          >
            <Ionicons
              name="remove"
              size={16}
              color={fontSize <= 12 ? colors.subtext : colors.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerFontSizeText}>{fontSize}px</Text>
          <TouchableOpacity
            style={styles.headerFontButton}
            onPress={() => adjustFontSize(2)}
            disabled={fontSize >= 32}
          >
            <Ionicons
              name="add"
              size={16}
              color={fontSize >= 32 ? colors.subtext : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerNavButton}
            onPress={() => navigateToChapter(1)}
            disabled={book && chapterNumber >= book.totalChapters}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={book && chapterNumber >= book.totalChapters ? colors.subtext : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleShareChapter}
          >
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [bookId, chapterNumber, bookName, fontSize, colors, book?.totalChapters]);

  // Scroll to target verse when provided
  useEffect(() => {
    if (!chapter) return;
    const v = route.params?.targetVerse;
    if (!v) return;
    setHighlightedVerse(v);
    const y = versePositions.current[v];
    if (typeof y === 'number' && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(y - 100, 0), animated: true });
    } else {
      // Wait a bit for layouts to compute
      const timer = setTimeout(() => {
        const y2 = versePositions.current[v];
        if (typeof y2 === 'number' && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: Math.max(y2 - 100, 0), animated: true });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [chapter, route.params?.targetVerse]);

  const loadChapter = () => {
    setLoading(true);
    const chapterData = getChapter(bookId, chapterNumber);
    setChapter(chapterData);
    setLoading(false);
  };

  const handleFavoritePress = async () => {
    if (isFavorite(bookId, chapterNumber)) {
      await removeFromFavorites(`${bookId}.${chapterNumber}`);
    } else {
      await addToFavorites(bookId, chapterNumber);
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
    const fav = isFavorite(verse.id);
    Alert.alert(
      `${bookName} ${chapterNumber}:${verse.number}`,
      verse.text,
      [
        { text: t('ui.cancel'), style: 'cancel' },
        {
          text: t(fav ? 'ui.removeFromFavorites' : 'ui.addToFavorites'),
          onPress: () => handleToggleFavorite(verse),
        },
        {
          text: t('ui.shareVerse'),
          onPress: () => handleShareVerse(verse),
        },
      ]
    );
  };

  const handleToggleFavorite = async (verse) => {
    const wasFavorite = isFavorite(verse.id);
    try {
      if (wasFavorite) {
        await removeFromFavorites(verse.id);
        Alert.alert(t('alert.success'), t('toast.removedFromFavorites'));
      } else {
        await addToFavorites(
          verse.id,
          bookId,
          chapterNumber,
          verse.number,
          verse.text
        );
        Alert.alert(t('alert.success'), t('toast.addedToFavorites'));
      }
    } catch (error) {
      Alert.alert(
        t('alert.error'),
        wasFavorite ? t('toast.removeFromFavoritesFailed') : t('toast.addToFavoritesFailed')
      );
    }
  };

  const handleShareVerse = async (verse) => {
    try {
      await Share.share({
        message: `${bookName} ${chapterNumber}:${verse.number} - ${verse.text}`,
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

  const jumpToChapter = (targetChapter) => {
    if (!book) return;
    if (targetChapter < 1 || targetChapter > book.totalChapters) return;
    navigation.setParams({ chapterNumber: targetChapter });
    setTimeout(() => {
      loadChapter();
      addToRecentReads(bookId, targetChapter);
    }, 100);
  };

  const adjustFontSize = (increment) => {
    const newSize = fontSize + increment;
    if (newSize >= 12 && newSize <= 32) {
      setFontSize(newSize);
    }
  };

  const styles = useThemedStyles(makeStyles);

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
              <Ionicons name="close" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <Text style={styles.verseActionText}>{selectedVerse.text}</Text>

          <View style={styles.verseActions}>
            <TouchableOpacity
              style={styles.verseActionButton}
              onPress={() => {
                handleToggleFavorite(selectedVerse);
                setShowVerseActions(false);
              }}
            >
              <Ionicons
                name={isFavorite(selectedVerse.id) ? 'heart' : 'heart-outline'}
                size={20}
                color={colors.danger}
              />
              <Text style={styles.verseActionButtonText}>
                {t(isFavorite(selectedVerse.id) ? 'ui.removeFromFavorites' : 'ui.addToFavorites')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verseActionButton}
              onPress={() => {
                handleShareVerse(selectedVerse);
                setShowVerseActions(false);
              }}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
              <Text style={styles.verseActionButtonText}>{t('ui.shareVerse')}</Text>
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
          color={chapterNumber <= 1 ? colors.subtext : colors.primary}
        />
        <Text
          style={[
            styles.navButtonText,
            chapterNumber <= 1 && styles.navButtonTextDisabled,
          ]}
        >
          {t('ui.previous')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.chapterInfo} onPress={() => setChapterSheetVisible(true)}>
        <Text style={styles.chapterTitle}>{bookName}</Text>
        <Text style={styles.chapterNumber}>Chapter {chapterNumber}</Text>
        <Text style={styles.chapterStats}>
          {chapter?.verses?.length || 0} verses
        </Text>
      </TouchableOpacity>

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
          {t('ui.next')}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={book && chapterNumber >= book.totalChapters ? colors.subtext : colors.primary}
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
          color={fontSize <= 12 ? colors.subtext : colors.primary}
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
          color={fontSize >= 32 ? colors.subtext : colors.primary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderVerse = (verse) => (
    <TouchableOpacity
      key={verse.id}
      style={[
        styles.verseContainer,
        verse.number === highlightedVerse && styles.highlightedVerse,
      ]}
      onPress={() => handleVersePress(verse)}
      onLongPress={() => handleVerseLongPress(verse)}
      activeOpacity={0.7}
      onLayout={(e) => {
        versePositions.current[verse.number] = e.nativeEvent.layout.y;
      }}
    >
      <View style={styles.verseContent}>
        <Text style={[styles.verseText, { fontSize }]}>
          <Text style={styles.verseNumber}>{`${verse.number} `}</Text>
          {verse.text}
        </Text>
        <TouchableOpacity
          style={styles.verseLikeButton}
          onPress={() => handleToggleFavorite(verse)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite(verse.id) ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite(verse.id) ? colors.danger : colors.subtext}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderChapterSheet = () => {
    if (!book) return null;
    const chapters = Array.from({ length: book.totalChapters }, (_, i) => i + 1);

    return (
      <Modal
        visible={chapterSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChapterSheetVisible(false)}
      >
        <View style={styles.chapterSheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setChapterSheetVisible(false)} />
          <View style={[styles.chapterSheetContainer, { backgroundColor: colors.card }] }>
            <View style={styles.chapterSheetHandle} />
            <Text style={[styles.chapterSheetTitle, { color: colors.text }]}>
              {bookName}
            </Text>
            <ScrollView
              style={styles.chapterSheetScroll}
              contentContainerStyle={styles.chaptersGrid}
              showsVerticalScrollIndicator
            >
              {chapters.map((n) => {
                const active = n === chapterNumber;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.chapterItem, active && styles.chapterItemActive]}
                    onPress={() => {
                      setChapterSheetVisible(false);
                      jumpToChapter(n);
                    }}
                  >
                    <Text style={[styles.chapterItemText, active && styles.chapterItemTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.chapterSheetClose} onPress={() => setChapterSheetVisible(false)}>
              <Text style={[styles.chapterSheetCloseText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.subtext} />
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
    <SafeAreaView style={[styles.container, { paddingTop: headerHeight }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ top: headerHeight }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.versesContainer}>
          {chapter.verses.map(renderVerse)}
        </View>
      </ScrollView>

      {renderVerseActionModal()}
      {renderChapterSheet()}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.subtext,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.subtext,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginHorizontal: 4,
  },
  headerFontButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.background,
    marginHorizontal: 4,
  },
  headerFontSizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.subtext,
    marginHorizontal: 4,
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 4,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    minWidth: 80,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.border,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: colors.subtext,
  },
  chapterInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  chapterNumber: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  chapterStats: {
    fontSize: 12,
    color: colors.subtext,
  },
  chapterFavoriteButton: {
    marginLeft: 8,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fontButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
    marginHorizontal: 8,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.subtext,
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
  highlightedVerse: {
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    borderRadius: 6,
    paddingLeft: 8,
  },
  verseContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  verseNumber: {
    display: 'inline-flex',
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  verseText: {
    display: 'flow',
    flex: 1,
    lineHeight: 26,
    color: colors.text,
  },
  verseLikeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: colors.background,
    marginLeft: 8,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
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
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
  },
  verseActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  verseActionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    padding: 16,
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verseActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  verseActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
  chapterSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  chapterSheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    maxHeight: '70%',
  },
  chapterSheetScroll: {
    maxHeight: '100%',
  },
  chapterSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  chapterSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  chapterItem: {
    width: (screenWidth - 16 * 2 - 12 * 3) / 4, /* 4 per row with 12px gaps */
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chapterItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chapterItemText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  chapterItemTextActive: {
    color: '#fff',
  },
  chapterSheetClose: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chapterSheetCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChapterScreen;
