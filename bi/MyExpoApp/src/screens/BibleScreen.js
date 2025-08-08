import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useBible } from '../context/BibleContext';

const { width: screenWidth } = Dimensions.get('window');

const BibleScreen = ({ navigation }) => {
  const {
    books,
    loading,
    recentReads,
    favorites,
    bookmarks,
    getStats,
    addToRecentReads,
  } = useBible();

  const [stats, setStats] = useState({});

  useEffect(() => {
    setStats(getStats());
  }, [books, favorites, bookmarks, recentReads]);

  const handleBookPress = (book) => {
    navigation.navigate('Chapter', {
      bookId: book.id,
      bookName: book.name,
      chapterNumber: 1,
    });
    addToRecentReads(book.id, 1);
  };

  const handleRecentReadPress = (recentRead) => {
    navigation.navigate('Chapter', {
      bookId: recentRead.bookId,
      bookName: recentRead.bookName,
      chapterNumber: recentRead.chapterNumber,
    });
  };

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeContent}>
        <Ionicons name="book" size={32} color="#8B4513" />
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>Holy Bible</Text>
          <Text style={styles.welcomeSubtitle}>Smith Van Dyke Arabic Translation</Text>
        </View>
      </View>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="library" size={24} color="#8B4513" />
          <Text style={styles.statNumber}>{stats.totalBooks || 0}</Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#8B4513" />
          <Text style={styles.statNumber}>{stats.totalChapters || 0}</Text>
          <Text style={styles.statLabel}>Chapters</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="heart" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>{stats.favorites || 0}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bookmark" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.bookmarks || 0}</Text>
          <Text style={styles.statLabel}>Bookmarks</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('BookList')}
        >
          <Ionicons name="library" size={24} color="#8B4513" />
          <Text style={styles.quickActionText}>Browse Books</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={24} color="#8B4513" />
          <Text style={styles.quickActionText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Ionicons name="heart" size={24} color="#FF6B6B" />
          <Text style={styles.quickActionText}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Bookmarks')}
        >
          <Ionicons name="bookmark" size={24} color="#4CAF50" />
          <Text style={styles.quickActionText}>Bookmarks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentReads = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reads</Text>
        {recentReads.length > 3 && (
          <TouchableOpacity onPress={() => navigation.navigate('BookList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentReads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No recent reads</Text>
          <Text style={styles.emptySubtext}>Start reading to see your history here</Text>
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
              style={styles.recentReadCard}
              onPress={() => handleRecentReadPress(recentRead)}
            >
              <View style={styles.recentReadIcon}>
                <Ionicons name="book-outline" size={24} color="#8B4513" />
              </View>
              <Text style={styles.recentReadBook} numberOfLines={1}>
                {recentRead.bookName}
              </Text>
              <Text style={styles.recentReadChapter}>
                Chapter {recentRead.chapterNumber}
              </Text>
              <Text style={styles.recentReadTime}>
                {new Date(recentRead.readAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderPopularBooks = () => {
    const popularBooks = [
      { id: 'Gen', name: 'Genesis' },
      { id: 'Ps', name: 'Psalms' },
      { id: 'Matt', name: 'Matthew' },
      { id: 'John', name: 'John' },
      { id: 'Rom', name: 'Romans' },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Books</Text>
        <View style={styles.popularBooksContainer}>
          {popularBooks.map((book) => {
            const fullBook = books.find(b => b.id === book.id);
            if (!fullBook) return null;

            return (
              <TouchableOpacity
                key={book.id}
                style={styles.popularBookCard}
                onPress={() => handleBookPress(fullBook)}
              >
                <View style={styles.popularBookIcon}>
                  <Ionicons name="book" size={20} color="#8B4513" />
                </View>
                <Text style={styles.popularBookName} numberOfLines={1}>
                  {book.name}
                </Text>
                <Text style={styles.popularBookChapters}>
                  {fullBook.totalChapters} chapters
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading Holy Bible...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderWelcomeCard()}
        {renderStatsCards()}
        {renderQuickActions()}
        {renderRecentReads()}
        {renderPopularBooks()}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#fff',
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
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  recentReadsContainer: {
    paddingRight: 16,
  },
  recentReadCard: {
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentReadBook: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recentReadChapter: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  recentReadTime: {
    fontSize: 10,
    color: '#999',
  },
  popularBooksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularBookCard: {
    width: (screenWidth - 48) / 3,
    backgroundColor: '#fff',
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
  popularBookIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularBookName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  popularBookChapters: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default BibleScreen;
