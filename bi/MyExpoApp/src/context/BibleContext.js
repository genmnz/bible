import React, { createContext, useState, useEffect, useContext } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { parseString } from 'react-native-xml2js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentReads, setRecentReads] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [BOOK_NAMES, setBOOK_NAMES] = useState({});

  useEffect(() => {
    const loadBibleData = async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/bible/arasvd.xml'));
        await asset.downloadAsync();
        const xmlString = await FileSystem.readAsStringAsync(asset.localUri);

        parseString(xmlString, { explicitArray: false }, (err, result) => {
          if (err) {
            console.error('Error parsing XML:', err);
            setLoading(false);
            return;
          }

          const osisText = result.osis.osisText;
          const work = osisText.header.work;
          const bookDivs = osisText.div;

          const parsedBooks = bookDivs.map((bookDiv) => {
            const bookId = bookDiv.$.osisID;
            const chapters = Array.isArray(bookDiv.chapter) ? bookDiv.chapter : [bookDiv.chapter];
            return {
              id: bookId,
              name: work.title, // This is a placeholder, will be replaced by a proper name mapping
              chapters: chapters.map((chapter) => {
                const verses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
                return {
                  number: parseInt(chapter.$.osisID.split('.')[1], 10),
                  verses: verses.map((verse) => ({
                    id: verse.$.osisID,
                    number: parseInt(verse.$.osisID.split('.')[2], 10),
                    text: verse._,
                  })),
                };
              }),
              totalChapters: chapters.length,
            };
          });

          const bookNames = parsedBooks.reduce((acc, book) => {
            acc[book.id] = book.name;
            return acc;
          }, {});

          setBooks(parsedBooks);
          setBOOK_NAMES(bookNames);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading Bible:', error);
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