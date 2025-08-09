import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useBible } from '../context/BibleContext';
import { useThemeMode } from '../context/ThemeContext';
import { useThemedStyles } from '../styles/useThemedStyles';
import { makeSharedStyles } from '../styles/sharedStyles';

const BookmarksScreen = ({ navigation }) => {
  const { colors } = useThemeMode();
  const {
    bookmarks,
    removeBookmark,
    addBookmark,
    getBook,
    BOOK_NAMES,
  } = useBible();

  const [editingBookmark, setEditingBookmark] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNote, setEditNote] = useState('');

  const handleBookmarkPress = (bookmark) => {
    navigation.navigate('Bible', {
      screen: 'Chapter',
      params: {
        bookId: bookmark.bookId,
        bookName: BOOK_NAMES[bookmark.bookId] || bookmark.bookName,
        chapterNumber: bookmark.chapterNumber,
      },
    });
  };

  const handleDeleteBookmark = (bookmark) => {
    Alert.alert(
      'Delete Bookmark',
      `Remove bookmark for ${BOOK_NAMES[bookmark.bookId] || bookmark.bookName} ${bookmark.chapterNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeBookmark(bookmark.id),
        },
      ]
    );
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setEditNote(bookmark.note || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (editingBookmark) {
      await addBookmark(
        editingBookmark.bookId,
        editingBookmark.chapterNumber,
        editNote
      );
      setEditModalVisible(false);
      setEditingBookmark(null);
      setEditNote('');
    }
  };

  const styles = useThemedStyles(makeStyles);

  const renderBookmarkItem = ({ item }) => {
    const book = getBook(item.bookId);
    const totalChapters = book?.totalChapters || 0;

    return (
      <TouchableOpacity
        style={styles.bookmarkItem}
        onPress={() => handleBookmarkPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.bookmarkContent}>
          <View style={styles.bookmarkIcon}>
            <Ionicons name="bookmark" size={24} color={colors.success} />
          </View>

          <View style={styles.bookmarkInfo}>
            <Text style={styles.bookmarkTitle}>
              {BOOK_NAMES[item.bookId] || item.bookName} {item.chapterNumber}
            </Text>
            <Text style={styles.bookmarkProgress}>
              Chapter {item.chapterNumber} of {totalChapters}
            </Text>
            {item.note && (
              <Text style={styles.bookmarkNote} numberOfLines={2}>
                {item.note}
              </Text>
            )}
            <Text style={styles.bookmarkDate}>
              Added {new Date(item.addedAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.bookmarkActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditBookmark(item)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteBookmark(item)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Ionicons name="bookmark" size={32} color={colors.success} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Bookmarks</Text>
            <Text style={styles.subtitle}>
              {bookmarks.length} saved {bookmarks.length === 1 ? 'chapter' : 'chapters'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={80} color={colors.subtext} />
      <Text style={styles.emptyTitle}>No bookmarks yet</Text>
      <Text style={styles.emptySubtitle}>
        Bookmark chapters while reading to save them here
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Bible')}
      >
        <Ionicons name="book" size={20} color="#fff" />
        <Text style={styles.browseButtonText}>Start Reading</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Edit Bookmark
            </Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {editingBookmark && (
            <View style={styles.modalBody}>
              <Text style={styles.bookmarkReference}>
                {BOOK_NAMES[editingBookmark.bookId] || editingBookmark.bookName} {editingBookmark.chapterNumber}
              </Text>

              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note about this chapter..."
                placeholderTextColor={colors.subtext}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bookmarks.sort((a, b) => b.addedAt - a.addedAt)}
        renderItem={renderBookmarkItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          bookmarks.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {renderEditModal()}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => {
  const shared = makeSharedStyles(colors);
  return {
    container: shared.container,
    listContainer: { paddingBottom: 16 },
    emptyListContainer: { flex: 1 },
    header: { ...shared.header, padding: 16, marginBottom: 8 },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerText: { marginLeft: 16 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 16, color: colors.subtext },
    bookmarkItem: shared.cardItem,
    bookmarkContent: { ...shared.cardContent, flexDirection: 'row', alignItems: 'center' },
    bookmarkIcon: { ...shared.cardIcon, backgroundColor: colors.success + '20' },
    bookmarkInfo: { flex: 1 },
    bookmarkTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
    bookmarkProgress: { fontSize: 14, color: colors.success, fontWeight: '500', marginBottom: 4 },
    bookmarkNote: { fontSize: 14, color: colors.subtext, fontStyle: 'italic', marginBottom: 4 },
    bookmarkDate: { fontSize: 12, color: colors.subtext },
    bookmarkActions: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { padding: 8, marginLeft: 4, borderRadius: 6, backgroundColor: colors.background },
    separator: shared.separator,
    emptyState: shared.emptyState,
    emptyTitle: shared.emptyTitle,
    emptySubtitle: { ...shared.emptySubtitle, marginBottom: 24 },
    browseButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    // Modal
    modalOverlay: shared.modalOverlay,
    modalContent: { ...shared.modalCard, width: '90%', maxHeight: '80%' },
    modalHeader: shared.modalHeader,
    modalTitle: { ...shared.modalTitle, fontSize: 20, fontWeight: 'bold' },
    modalBody: { padding: 16 },
    bookmarkReference: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 16, textAlign: 'center' },
    inputLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
    noteInput: { backgroundColor: colors.background, borderRadius: 12, padding: 12, fontSize: 16, color: colors.text, height: 100, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
    cancelButton: { flex: 0.45, backgroundColor: colors.background, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
    saveButton: { flex: 0.45, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  };
};

export default BookmarksScreen;
