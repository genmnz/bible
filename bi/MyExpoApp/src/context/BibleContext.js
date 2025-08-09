import React, { createContext, useState, useEffect, useContext } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseOsisBookXmlString, OSIS_BOOK_NAMES, OSIS_BOOK_NAMES_ARABIC } from '../utils/osisParser';
import { ARASVD_BOOK_ASSETS, ARASVD_ORDER } from '../bibles/arasvd';
import { ARAVD_BOOK_ASSETS, ARAVD_ORDER } from '../bibles/aravd';
import { KJV_BOOK_ASSETS, KJV_ORDER } from '../bibles/en.kjv';
import { useLocale } from './LocaleContext';
import { InteractionManager } from 'react-native';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentReads, setRecentReads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [BOOK_NAMES, setBOOK_NAMES] = useState({});
  const { language } = useLocale();
  const [version, setVersionState] = useState('aravd'); // 'aravd' | 'arasvd' | 'kjv'

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
        // Load split per-book XMLs for selected version (independent of UI language)
        let ORDER, ASSETS;
        if (version === 'aravd') {
          ORDER = ARAVD_ORDER;
          ASSETS = ARAVD_BOOK_ASSETS;
        } else if (version === 'arasvd') {
          ORDER = ARASVD_ORDER;
          ASSETS = ARASVD_BOOK_ASSETS;
        } else {
          ORDER = KJV_ORDER;
          ASSETS = KJV_BOOK_ASSETS;
        }
        for (const bookId of ORDER) {
          const mod = ASSETS[bookId];
          if (!mod) continue; // Skip missing files
          try {
            const asset = Asset.fromModule(mod);
            const xmlString = await readAssetAsString(asset);
            const book = parseOsisBookXmlString(xmlString);
            loadedBooks.push(book);
            // Yield to UI thread to keep app responsive during bulk parsing
            await new Promise((r) => setTimeout(r, 0));
          } catch (e) {
            console.warn(`Failed to load ${bookId}:`, e?.message || e);
          }
        }

        setBooks(loadedBooks);
        // Build localized book name map from OSIS name dictionaries based on UI language
        const dict = language === 'ar' ? OSIS_BOOK_NAMES_ARABIC : OSIS_BOOK_NAMES;
        const namesMap = Object.fromEntries(
          loadedBooks.map((b) => [b.id, dict[b.id] || b.name || b.id])
        );
        setBOOK_NAMES(namesMap);
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
      if (storedFavorites) {
        try {
          const raw = JSON.parse(storedFavorites) || [];
          // Sanitize: keep only items with full location and normalize id as book.chapter.verse
          const cleaned = Array.isArray(raw)
            ? raw
                .filter((f) => f && f.bookId && f.chapterNumber && f.verseNumber)
                .map((f) => ({
                  ...f,
                  id: `${f.bookId}.${f.chapterNumber}.${f.verseNumber}`,
                }))
            : [];
          setFavorites(cleaned);
          // Persist back the cleaned list to avoid future undefineds
          await AsyncStorage.setItem('favorites', JSON.stringify(cleaned));
        } catch (e) {
          console.warn('Failed to parse favorites; resetting list');
          setFavorites([]);
          await AsyncStorage.setItem('favorites', JSON.stringify([]));
        }
      }

      // Determine Bible version from storage & UI language and persist it
      // Arabic supports two versions: 'aravd' (default, with tashkeel) and 'arasvd' (alternative)
      // English uses 'kjv'. If stored version is incompatible with language, switch to default for that language.
      let storedVersion = null;
      try { storedVersion = await AsyncStorage.getItem('bibleVersion'); } catch {}
      let resolved = 'kjv';
      if (language === 'ar') {
        if (storedVersion === 'aravd' || storedVersion === 'arasvd') {
          resolved = storedVersion;
        } else {
          resolved = 'aravd';
        }
      } else {
        resolved = 'kjv';
      }
      setVersionState(resolved);
      try { await AsyncStorage.setItem('bibleVersion', resolved); } catch {}
    };

    setLoading(true);
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      // Kick off heavy parsing work after initial interactions for faster perceived load
      return loadBibleData();
    });
    loadUserData();
    return () => {
      // Cancel if possible
      interactionTask && interactionTask.cancel && interactionTask.cancel();
    };
  }, [version]);

  // Rebuild localized book names when UI language changes without re-parsing XML
  useEffect(() => {
    const dict = language === 'ar' ? OSIS_BOOK_NAMES_ARABIC : OSIS_BOOK_NAMES;
    const namesMap = Object.fromEntries(
      books.map((b) => [b.id, dict[b.id] || b.name || b.id])
    );
    setBOOK_NAMES(namesMap);
  }, [language, books]);

  // Ensure the Bible version follows the selected UI language category
  // Arabic: keep either 'aravd' (default) or 'arasvd' if already chosen; English: force 'kjv'
  useEffect(() => {
    if (language === 'ar') {
      if (version === 'kjv') {
        setVersion('aravd'); // move to Arabic default if coming from English
      }
    } else {
      if (version !== 'kjv') {
        setVersion('kjv');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const setVersion = async (next) => {
    setLoading(true);
    setVersionState(next);
    try { await AsyncStorage.setItem('bibleVersion', next); } catch {}
  };

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
    // Guard against incorrect callers (e.g., passed only book/chapter)
    if (!bookId || !chapterNumber || !verseNumber) {
      console.warn('addToFavorites requires (verseId, bookId, chapterNumber, verseNumber, text)');
      return;
    }
    const id = `${bookId}.${chapterNumber}.${verseNumber}`;
    const newFavorite = { id, bookId, chapterNumber, verseNumber, text, addedAt: Date.now() };
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = async (verseId) => {
    let updatedFavorites = favorites;
    if (typeof verseId === 'string' && verseId.includes('.')) {
      const parts = verseId.split('.');
      if (parts.length === 2) {
        // Treat as chapter-level removal: remove all in that chapter
        const [bookId, chStr] = parts;
        const chNum = Number(chStr);
        updatedFavorites = favorites.filter(
          (f) => !(f.bookId === bookId && f.chapterNumber === chNum)
        );
      } else if (parts.length >= 3) {
        updatedFavorites = favorites.filter((f) => f.id !== verseId);
      } else {
        updatedFavorites = favorites.filter((f) => f.id !== verseId);
      }
    } else {
      updatedFavorites = favorites.filter((f) => f.id !== verseId);
    }
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const clearFavorites = async () => {
    setFavorites([]);
    await AsyncStorage.setItem('favorites', JSON.stringify([]));
  };

  const isFavorite = (idOrBook, chapterMaybe) => {
    if (chapterMaybe !== undefined) {
      const bookId = idOrBook;
      const chapterNumber = Number(chapterMaybe);
      return favorites.some((f) => f.bookId === bookId && f.chapterNumber === chapterNumber);
    }
    return favorites.some((f) => f.id === idOrBook);
  };

  // Bookmarks removed: chapters can be accessed via recent reads; users can favorite individual verses

  const getStats = () => {
    return {
      totalBooks: books.length,
      totalChapters: books.reduce((acc, book) => acc + book.totalChapters, 0),
      favorites: favorites.length,
    };
  };

  return (
    <BibleContext.Provider
      value={{
        books,
        loading,
        recentReads,
        favorites,
        getStats,
        addToRecentReads,
        getChapter,
        addToFavorites,
        removeFromFavorites,
        clearFavorites,
        isFavorite,
        getBook,
        searchVerses,
        BOOK_NAMES,
        version,
        setVersion,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = () => useContext(BibleContext);