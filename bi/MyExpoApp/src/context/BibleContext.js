import React, { createContext, useState, useEffect, useContext } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseOsisXmlString, parseOsisBookXmlString, OSIS_BOOK_NAMES } from '../utils/osisParser';
import { ARASVD_BOOK_ASSETS, ARASVD_ORDER } from '../bibles/arasvd';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentReads, setRecentReads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [BOOK_NAMES, setBOOK_NAMES] = useState({});

  const readAssetAsString = async (asset) => {
    try {
      if (!asset.localUri) await asset.downloadAsync();
      if (asset.localUri) {
        return await FileSystem.readAsStringAsync(asset.localUri);
      }
    } catch (e) {
      // fall through to fetch
    }
    // Fallback: fetch via network/url (web/dev)
    const url = asset.uri || asset.localUri;
    if (!url) throw new Error('Asset has no uri');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch asset: ${res.status}`);
    return await res.text();
  };

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        const loadedBooks = [];
        // Primary source: split per-book XMLs bundled in src/bibles/arasvd/
        for (const bookId of ARASVD_ORDER) {
          const mod = ARASVD_BOOK_ASSETS[bookId];
          if (!mod) continue; // Skip missing files
          try {
            const asset = Asset.fromModule(mod);
            const xmlString = await readAssetAsString(asset);
            const book = parseOsisBookXmlString(xmlString);
            loadedBooks.push(book);
          } catch (e) {
            console.warn(`Failed to load ${bookId}:`, e?.message || e);
          }
        }

        // Fallback: parse the single monolithic OSIS file if nothing loaded
        // or use it to fill any missing books from split assets
        try {
          const needed = ARASVD_ORDER.filter(id => !loadedBooks.some(b => b.id === id));
          if (loadedBooks.length === 0 || needed.length > 0) {
            const asset = Asset.fromModule(require('../../assets/bible/arasvd.xml'));
            const xmlString = await readAssetAsString(asset);
            const parsed = parseOsisXmlString(xmlString);
            if (loadedBooks.length === 0) {
              loadedBooks.push(...parsed);
            } else if (needed.length > 0) {
              for (const id of needed) {
                const found = parsed.find(b => b.id === id);
                if (found) loadedBooks.push(found);
              }
              // keep canonical order
              loadedBooks.sort((a, b) => ARASVD_ORDER.indexOf(a.id) - ARASVD_ORDER.indexOf(b.id));
            }
          }
        } catch (fallbackErr) {
          console.error('OSIS parse (fallback/fill) failed:', fallbackErr);
        }

        setBooks(loadedBooks);
        setBOOK_NAMES(OSIS_BOOK_NAMES);
      } catch (error) {
        console.error('Error loading Bible:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadUserData = async () => {
      const storedRecentReads = await AsyncStorage.getItem('recentReads');
      if (storedRecentReads) setRecentReads(JSON.parse(storedRecentReads));

      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));

      const storedBookmarks = await AsyncStorage.getItem('bookmarks');
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
    };

    loadBibleData();
    loadUserData();
  }, []);

  const getChapter = (bookId, chapterNumber) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return null;
    return book.chapters.find((c) => c.number === chapterNumber);
  };

  const getBook = (bookId) => {
    return books.find((b) => b.id === bookId);
  };

  const searchVerses = (query, bookId) => {
    if (!query) return [];
    const lowerCaseQuery = query.toLowerCase();
    let results = [];
    const searchBooks = bookId ? books.filter((b) => b.id === bookId) : books;

    searchBooks.forEach((book) => {
      book.chapters.forEach((chapter) => {
        chapter.verses.forEach((verse) => {
          if (verse.text.toLowerCase().includes(lowerCaseQuery)) {
            results.push({
              ...verse,
              bookId: book.id,
              bookName: BOOK_NAMES[book.id] || book.id,
              chapterNumber: chapter.number,
            });
          }
        });
      });
    });
    return results;
  };

  const addToRecentReads = async (bookId, chapterNumber) => {
    const newRecentRead = {
      id: `${bookId}-${chapterNumber}-${Date.now()}`,
      bookId,
      bookName: BOOK_NAMES[bookId] || bookId,
      chapterNumber,
      readAt: Date.now(),
    };
    const updatedRecentReads = [newRecentRead, ...recentReads.filter(r => r.bookId !== bookId || r.chapterNumber !== chapterNumber)].slice(0, 10);
    setRecentReads(updatedRecentReads);
    await AsyncStorage.setItem('recentReads', JSON.stringify(updatedRecentReads));
  };

  const addToFavorites = async (verseId, bookId, chapterNumber, verseNumber, text) => {
    const newFavorite = { id: verseId, bookId, chapterNumber, verseNumber, text, addedAt: Date.now() };
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = async (verseId) => {
    const updatedFavorites = favorites.filter(f => f.id !== verseId);
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (verseId) => {
    return favorites.some(f => f.id === verseId);
  };

  const addBookmark = async (bookId, chapterNumber, note = '') => {
    const newBookmark = { id: `${bookId}.${chapterNumber}`, bookId, bookName: BOOK_NAMES[bookId] || bookId, chapterNumber, note, addedAt: Date.now() };
    const updatedBookmarks = [...bookmarks.filter(b => b.id !== newBookmark.id), newBookmark];
    setBookmarks(updatedBookmarks);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  };

  const removeBookmark = async (bookmarkId) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    setBookmarks(updatedBookmarks);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  };

  const isBookmarked = (bookId, chapterNumber) => {
    return bookmarks.some(b => b.bookId === bookId && b.chapterNumber === chapterNumber);
  };

  const getStats = () => {
    return {
      totalBooks: books.length,
      totalChapters: books.reduce((acc, book) => acc + book.totalChapters, 0),
      favorites: favorites.length,
      bookmarks: bookmarks.length,
    };
  };

  return (
    <BibleContext.Provider
      value={{
        books,
        loading,
        recentReads,
        favorites,
        bookmarks,
        getStats,
        addToRecentReads,
        getChapter,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        addBookmark,
        removeBookmark,
        isBookmarked,
        getBook,
        searchVerses,
        BOOK_NAMES,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = () => useContext(BibleContext);