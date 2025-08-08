# MyExpoApp Documentation

This document provides an overview of the MyExpoApp application, a mobile Bible reader with several key features.

## Core Functionality

The app's primary function is to display the Bible in Arabic. The text is sourced from a single OSIS-formatted XML file (`arasvd.xml`) located in the `assets/bible` directory. The application parses this file to load the entire biblical text, which is then made available to the user through various screens.

## Key Components

### Data Layer

- **`BibleContext.js`**: This is the heart of the application, managing all Bible data and user interactions. It loads and parses the XML file, storing the books, chapters, and verses in a structured format. It also handles user-specific data like bookmarks, favorites, and recent reads, persisting them to the device using `AsyncStorage`.

### Main Screens

- **`BookListScreen.js`**: This screen displays a list of all available Bible books. Users can select a book to navigate to its chapters.
- **`BibleScreen.js`**: This is the main reading interface, where the text of a selected chapter is displayed. It likely includes features for navigating between chapters and verses.
- **`BookmarksScreen.js`**: This screen shows a list of all the chapters the user has bookmarked for easy access.
- **`FavoritesScreen.js`**: Displays a list of individual verses that the user has marked as favorites.
- **`SettingsScreen.js`**: Provides options for customizing the app, which may include font size adjustments, theme changes, or other user preferences.
- **`SearchScreen.js`**: Allows users to search for specific keywords or phrases within the biblical text.

## Features

- **XML Parsing**: The app uses `fast-xml-parser` to efficiently process the `arasvd.xml` file without relying on a browser's DOMParser, ensuring compatibility with Android and iOS.
- **Offline Access**: All Bible data is stored locally on the device, allowing for full offline functionality.
- **User Data Persistence**: Bookmarks, favorites, and reading history are saved locally, so they are not lost when the app is closed.
- **Search**: A comprehensive search function allows users to find verses across the entire Bible or within specific books.
- **Statistics**: The app tracks basic usage statistics, such as the number of favorited verses and bookmarked chapters.
