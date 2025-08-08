import { useState, useMemo, useCallback } from 'react';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const useImageGrid = (images = [], options = {}) => {
  const {
    numColumns = 3,
    spacing = 2,
    aspectRatio = 1,
    maxColumns = 4,
    minColumns = 2,
    enableDynamicColumns = false,
  } = options;

  const [columns, setColumns] = useState(numColumns);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name, size
  const [filterBy, setFilterBy] = useState('all'); // all, favorites, category
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate item dimensions based on screen width and columns
  const itemDimensions = useMemo(() => {
    const totalSpacing = spacing * (columns + 1);
    const availableWidth = screenWidth - totalSpacing;
    const itemWidth = availableWidth / columns;
    const itemHeight = itemWidth / aspectRatio;

    return {
      width: itemWidth,
      height: itemHeight,
      marginHorizontal: spacing / 2,
      marginVertical: spacing / 2,
    };
  }, [columns, spacing, aspectRatio]);

  // Filter and sort images
  const processedImages = useMemo(() => {
    let filteredImages = [...images];

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredImages = filteredImages.filter(image =>
        image.filename?.toLowerCase().includes(lowerQuery) ||
        image.category?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      if (filterBy === 'favorites') {
        filteredImages = filteredImages.filter(image => image.isFavorite);
      } else {
        filteredImages = filteredImages.filter(image => image.category === filterBy);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filteredImages.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));
        break;
      case 'oldest':
        filteredImages.sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime));
        break;
      case 'name':
        filteredImages.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));
        break;
      case 'size':
        filteredImages.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        break;
      default:
        break;
    }

    return filteredImages;
  }, [images, searchQuery, filterBy, sortBy]);

  // Group images into rows
  const imageRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < processedImages.length; i += columns) {
      rows.push(processedImages.slice(i, i + columns));
    }
    return rows;
  }, [processedImages, columns]);

  // Calculate grid statistics
  const gridStats = useMemo(() => {
    const totalImages = processedImages.length;
    const totalRows = Math.ceil(totalImages / columns);
    const lastRowItems = totalImages % columns || columns;

    const categoryCounts = processedImages.reduce((acc, image) => {
      const category = image.category || 'Others';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalImages,
      totalRows,
      lastRowItems,
      categoryCounts,
      averageImagesPerRow: totalImages / totalRows,
    };
  }, [processedImages, columns]);

  // Dynamic column adjustment based on screen orientation
  const adjustColumnsForOrientation = useCallback((orientation) => {
    if (!enableDynamicColumns) return;

    if (orientation === 'landscape') {
      setColumns(Math.min(maxColumns, numColumns + 1));
    } else {
      setColumns(numColumns);
    }
  }, [enableDynamicColumns, maxColumns, numColumns]);

  // Change number of columns
  const changeColumns = useCallback((newColumns) => {
    const clampedColumns = Math.max(minColumns, Math.min(maxColumns, newColumns));
    setColumns(clampedColumns);
  }, [minColumns, maxColumns]);

  // Toggle between different column layouts
  const toggleColumnLayout = useCallback(() => {
    const layouts = [2, 3, 4];
    const currentIndex = layouts.indexOf(columns);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setColumns(layouts[nextIndex]);
  }, [columns]);

  // Get item style for FlatList
  const getItemStyle = useCallback((index) => {
    const isLastRow = Math.floor(index / columns) === Math.floor((processedImages.length - 1) / columns);
    const isLastInRow = (index + 1) % columns === 0;
    const isFirstInRow = index % columns === 0;

    return {
      ...itemDimensions,
      marginRight: isLastInRow ? spacing : spacing / 2,
      marginLeft: isFirstInRow ? spacing : spacing / 2,
      marginBottom: isLastRow ? spacing : spacing / 2,
    };
  }, [itemDimensions, columns, processedImages.length, spacing]);

  // Get FlatList props
  const getFlatListProps = useCallback(() => {
    return {
      data: processedImages,
      numColumns: columns,
      key: `grid-${columns}`, // Forces re-render when columns change
      contentContainerStyle: {
        paddingTop: spacing,
        paddingBottom: spacing,
      },
      columnWrapperStyle: columns > 1 ? {
        justifyContent: 'space-between',
        paddingHorizontal: spacing,
      } : undefined,
    };
  }, [processedImages, columns, spacing]);

  // Masonry layout calculation (for Pinterest-style grid)
  const getMasonryLayout = useCallback(() => {
    const columnHeights = new Array(columns).fill(0);
    const layouts = processedImages.map((image, index) => {
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      const x = shortestColumnIndex * (itemDimensions.width + spacing);
      const y = columnHeights[shortestColumnIndex];

      // Calculate height based on image aspect ratio
      const imageHeight = image.aspectRatio
        ? itemDimensions.width / image.aspectRatio
        : itemDimensions.height;

      columnHeights[shortestColumnIndex] += imageHeight + spacing;

      return {
        index,
        x,
        y,
        width: itemDimensions.width,
        height: imageHeight,
      };
    });

    return layouts;
  }, [processedImages, columns, itemDimensions, spacing]);

  // Performance optimization: memoized render item
  const createRenderItem = useCallback((renderItemComponent) => {
    return ({ item, index }) => {
      const style = getItemStyle(index);
      return renderItemComponent({ item, index, style });
    };
  }, [getItemStyle]);

  // Search and filter functions
  const updateSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const updateSort = useCallback((sortType) => {
    setSortBy(sortType);
  }, []);

  const updateFilter = useCallback((filterType) => {
    setFilterBy(filterType);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterBy('all');
    setSortBy('newest');
  }, []);

  return {
    // Layout properties
    columns,
    itemDimensions,
    imageRows,

    // Data
    processedImages,
    gridStats,

    // State
    sortBy,
    filterBy,
    searchQuery,

    // Actions
    changeColumns,
    toggleColumnLayout,
    adjustColumnsForOrientation,
    updateSearch,
    updateSort,
    updateFilter,
    clearFilters,

    // Utilities
    getItemStyle,
    getFlatListProps,
    getMasonryLayout,
    createRenderItem,

    // Available sort options
    sortOptions: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'name', label: 'Name (A-Z)' },
      { value: 'size', label: 'Size (Largest)' },
    ],

    // Available filter options
    filterOptions: [
      { value: 'all', label: 'All Images' },
      { value: 'favorites', label: 'Favorites' },
      { value: 'Screenshots', label: 'Screenshots' },
      { value: 'Camera', label: 'Camera' },
      { value: 'Downloads', label: 'Downloads' },
      { value: 'Others', label: 'Others' },
    ],
  };
};
