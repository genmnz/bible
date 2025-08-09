import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'appLanguage';

const translations = {
  en: {
    'tab.bible': 'Bible',
    'tab.search': 'Search',
    'tab.favorites': 'Favorites',
    'tab.bookmarks': 'Bookmarks',
    'tab.settings': 'Settings',

    'title.bibleHome': 'Holy Bible',
    'title.books': 'Books',
    'title.searchHome': 'Search Scripture',
    'title.chapter': 'Chapter',
    'title.loading': 'Loading Holy Bible...',

    'settings.language': 'Language',
    'settings.language.arabic': 'Arabic',
    'settings.language.english': 'English',
    'settings.bibleVersion': 'Bible Version',
    'version.arasvd': 'Arabic (ARASVD)',
    'version.kjv': 'English (KJV)',

    // Settings sections
    'settings.section.statistics': 'Statistics',
    'settings.section.preferences': 'Preferences',
    'settings.section.data': 'Data',
    'settings.section.about': 'About',

    // Stats labels
    'stats.books': 'Books',
    'stats.chapters': 'Chapters',
    'stats.bookmarks': 'Bookmarks',
    'stats.favorites': 'Favorites',

    // Settings actions
    'settings.exportFavorites': 'Export Favorites',
    'settings.clearCache': 'Clear Cache',
    'settings.resetApp': 'Reset App',
    'settings.rateApp': 'Rate App',
    'settings.shareApp': 'Share App',
    'settings.contactSupport': 'Contact Support',
    'settings.privacyPolicy': 'Privacy Policy',
    'settings.termsOfService': 'Terms of Service',
    // Theme & appearance
    'settings.theme': 'Appearance',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',

    // BibleScreen UI
    'ui.quickActions': 'Quick Actions',
    'ui.browseBooks': 'Browse Books',
    'ui.search': 'Search',
    'ui.favorites': 'Favorites',
    'ui.recentReads': 'Recent Reads',
    'ui.seeAll': 'See All',
    'ui.noRecentReads': 'No recent reads',
    'ui.startReading': 'Start reading to see your history here',
    'ui.stories': 'Popular Stories',
    'ui.chapters': 'chapters',
    // ChapterScreen UI
    'ui.previous': 'Previous',
    'ui.next': 'Next',
    'ui.chapter': 'Chapter',
    'ui.verses': 'verses',
    'ui.loadingChapter': 'Loading chapter...',
    'ui.chapterNotFound': 'Chapter not found',
    'ui.goBack': 'Go Back',
    'ui.addToFavorites': 'Add to Favorites',
    'ui.removeFromFavorites': 'Remove from Favorites',
    'ui.shareVerse': 'Share Verse',
    'ui.cancel': 'Cancel',
    'toast.addedToFavorites': 'Verse added to favorites!',
    'toast.removedFromFavorites': 'Verse removed from favorites',
    'toast.addToFavoritesFailed': 'Failed to add verse to favorites',
    'toast.removeFromFavoritesFailed': 'Failed to remove verse from favorites',

    // Favorites screen
    'favorites.sortBy': 'Sort by:',
    'favorites.sortTitle': 'Sort favorites by',
    'favorites.clearAll.title': 'Clear All Favorites',
    'favorites.clearAll.message': 'Are you sure you want to remove all favorites? This action cannot be undone.',
    'favorites.clearAll.action': 'Clear All',
    'favorites.empty.title': 'No favorites yet',
    'favorites.empty.subtitle': 'Tap the heart icon on any photo to add it to your favorites',
    'favorites.empty.cta': 'Add something to access later',
    'favorites.count.singular': 'favorite photo',
    'favorites.count.plural': 'favorite photos',
    'favorites.sort.newest': 'Newest',
    'favorites.sort.oldest': 'Oldest',
    'favorites.sort.name': 'Name',
    'favorites.sort.size': 'Size',

    // Settings details
    'settings.showImageInfo': 'Show Image Info',
    'settings.showImageInfo.desc': 'Display image metadata',
    'settings.notifications': 'Notifications',
    'settings.notifications.desc': 'Receive app notifications',
    'settings.exportFavorites.desc': 'Export your favorites list',
    'settings.clearCache.desc': 'Free up storage space',
    'settings.resetApp.desc': 'Clear all data and settings',
    'settings.version': 'Version',
    'settings.build': 'Build',
    'settings.rateApp.desc': 'Rate us in the App Store',
    'settings.shareApp.desc': 'Tell your friends about this app',
    'settings.contactSupport.desc': 'Get help or send feedback',
    'settings.privacyPolicy.desc': 'View our privacy policy',
    'settings.termsOfService.desc': 'View terms and conditions',

    // Alerts and prompts
    'alert.clearCache.title': 'Clear Cache',
    'alert.clearCache.message': 'This will clear cached images and may free up storage space. Continue?',
    'alert.clearCache.success': 'Cache cleared successfully',
    'alert.reset.title': 'Reset App',
    'alert.reset.message': 'This will clear all app data including favorites and settings. This action cannot be undone.',
    'alert.reset.success': 'App has been reset',
    'alert.reset.error': 'Failed to reset app',
    'alert.error': 'Error',
    'alert.success': 'Success',
    'alert.rateApp.title': 'Rate App',
    'alert.rateApp.message': 'Would you like to rate this app in the App Store?',
    'alert.notNow': 'Not Now',
    'alert.rate': 'Rate',
    'alert.shareApp.title': 'Share App',

    // Share
    'share.appMessage': 'Check out this amazing Bible App!',
    'share.appTitle': 'Share Bible App',

    // About
    'about.madeBy': 'Made by MELAD',
    'about.rights': '© 2025 MELAD. All rights reserved.',
  },
  ar: {
    'tab.bible': 'الكتاب',
    'tab.search': 'بحث',
    'tab.favorites': 'المفضلة',
    'tab.bookmarks': 'العلامات',
    'tab.settings': 'الإعدادات',

    'title.bibleHome': 'الكتاب المقدس',
    'title.books': 'الأسفار',
    'title.searchHome': 'بحث في الأسفار',
    'title.chapter': 'إصحاح',
    'title.loading': 'تحميل الكتاب المقدس...',
    'settings.language': 'اللغة',
    'settings.language.arabic': 'العربية',
    'settings.language.english': 'الإنجليزية',
    'settings.bibleVersion': 'نسخة الكتاب المقدس',
    'version.arasvd': 'العربية (ARASVD)',
    'version.kjv': 'الإنجليزية (KJV)',

    // Settings sections
    'settings.section.statistics': 'الإحصاءات',
    'settings.section.preferences': 'التفضيلات',
    'settings.section.data': 'البيانات',
    'settings.section.about': 'حول',

    // Stats labels
    'stats.books': 'الأسفار',
    'stats.chapters': 'الإصحاحات',
    'stats.bookmarks': 'العلامات',
    'stats.favorites': 'المفضلة',

    // Settings actions
    'settings.exportFavorites': 'تصدير المفضلة',
    'settings.clearCache': 'مسح الذاكرة المؤقتة',
    'settings.resetApp': 'إعادة تعيين التطبيق',
    'settings.rateApp': 'قيّم التطبيق',
    'settings.shareApp': 'مشاركة التطبيق',
    'settings.contactSupport': 'اتصل بالدعم',
    'settings.privacyPolicy': 'سياسة الخصوصية',
    'settings.termsOfService': 'شروط الخدمة',
    // Theme & appearance
    'settings.theme': 'المظهر',
    'theme.system': 'حسب النظام',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',

    // BibleScreen UI
    'ui.quickActions': 'إجراءات سريعة',
    'ui.browseBooks': 'تصفح الأسفار',
    'ui.search': 'بحث',
    'ui.favorites': 'المفضلة',
    'ui.recentReads': 'القراءات الأخيرة',
    'ui.seeAll': 'عرض الكل',
    'ui.noRecentReads': 'لا توجد قراءات حديثة',
    'ui.startReading': 'ابدأ القراءة لعرض السجل هنا',
    'ui.stories': 'القصص الشائعة',
    'ui.chapters': 'إصحاحات',
    // ChapterScreen UI
    'ui.previous': 'السابق',
    'ui.next': 'التالي',
    'ui.chapter': 'إصحاح',
    'ui.verses': 'آية',
    'ui.loadingChapter': 'جارٍ تحميل الإصحاح...',
    'ui.chapterNotFound': 'لم يتم العثور على الإصحاح',
    'ui.goBack': 'عودة',
    'ui.addToFavorites': 'إضافة إلى المفضلة',
    'ui.removeFromFavorites': 'إزالة من المفضلة',
    'ui.shareVerse': 'مشاركة الآية',
    'ui.cancel': 'إلغاء',
    'toast.addedToFavorites': 'تمت إضافة الآية إلى المفضلة!',
    'toast.removedFromFavorites': 'تمت إزالة الآية من المفضلة',
    'toast.addToFavoritesFailed': 'فشل في إضافة الآية إلى المفضلة',
    'toast.removeFromFavoritesFailed': 'فشل في إزالة الآية من المفضلة',

    // Favorites screen
    'favorites.sortBy': 'ترتيب حسب:',
    'favorites.sortTitle': 'ترتيب المفضلة حسب',
    'favorites.clearAll.title': 'مسح كل المفضلة',
    'favorites.clearAll.message': 'هل أنت متأكد من إزالة جميع العناصر المفضلة؟ هذا الإجراء لا يمكن التراجع عنه.',
    'favorites.clearAll.action': 'مسح الكل',
    'favorites.empty.title': 'لا توجد عناصر مفضلة بعد',
    'favorites.empty.subtitle': 'اضغط على أيقونة القلب في أي ايه لإضافتها إلى المفضلة',
    'favorites.empty.cta': 'أضف شيئًا للوصول إليه لاحقًا',
    'favorites.count.singular': ' آية مفضلة',
    'favorites.count.plural': 'آيات مفضلة',
    'favorites.sort.newest': 'الأحدث',
    'favorites.sort.oldest': 'الأقدم',
    'favorites.sort.name': 'الاسم',
    'favorites.sort.size': 'الحجم',

    // Settings details
    'settings.showImageInfo': 'عرض معلومات الآية',
    'settings.showImageInfo.desc': 'إظهار بيانات الآية الوصفية',
    'settings.notifications': 'الإشعارات',
    'settings.notifications.desc': 'تلقي إشعارات التطبيق',
    'settings.exportFavorites.desc': 'تصدير قائمة المفضلة',
    'settings.clearCache.desc': 'توفير مساحة التخزين',
    'settings.resetApp.desc': 'مسح جميع البيانات والإعدادات',
    'settings.version': 'الإصدار',
    'settings.build': 'البناء',
    'settings.rateApp.desc': 'قيّمنا في المتجر',
    'settings.shareApp.desc': 'أخبر أصدقاءك عن هذا التطبيق',
    'settings.contactSupport.desc': 'الحصول على مساعدة أو إرسال ملاحظات',
    'settings.privacyPolicy.desc': 'عرض سياسة الخصوصية',
    'settings.termsOfService.desc': 'عرض الشروط والأحكام',

    // Alerts and prompts
    'alert.clearCache.title': 'مسح الذاكرة المؤقتة',
    'alert.clearCache.message': 'سيتم مسح الصور المؤقتة وقد يوفّر ذلك مساحة تخزين. هل تريد المتابعة؟',
    'alert.clearCache.success': 'تم مسح الذاكرة المؤقتة بنجاح',
    'alert.reset.title': 'إعادة تعيين التطبيق',
    'alert.reset.message': 'سيتم مسح جميع بيانات التطبيق بما في ذلك المفضلة والإعدادات. لا يمكن التراجع عن هذا الإجراء.',
    'alert.reset.success': 'تمت إعادة تعيين التطبيق',
    'alert.reset.error': 'فشل في إعادة تعيين التطبيق',
    'alert.error': 'خطأ',
    'alert.success': 'تم',
    'alert.rateApp.title': 'قيّم التطبيق',
    'alert.rateApp.message': 'هل ترغب في تقييم هذا التطبيق في متجر التطبيقات؟',
    'alert.notNow': 'ليس الآن',
    'alert.rate': 'قيّم',
    'alert.shareApp.title': 'مشاركة التطبيق',

    // Share
    'share.appMessage': 'اطّلع على هذا التطبيق الرائع للكتاب المقدس!',
    'share.appTitle': 'مشاركة تطبيق الكتاب المقدس',

    // About
    'about.madeBy': 'من تنفيذ ميلاد',
    'about.rights': '© 2025 ميلاد. جميع الحقوق محفوظة.',
  },
};

const LocaleContext = createContext({
  language: 'ar',
  setLanguage: () => {},
  t: (k) => k,
  isRTL: true,
});

export const LocaleProvider = ({ children }) => {
  const [language, setLanguageState] = useState('ar');
  const isRTL = language === 'ar';

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setLanguageState(saved);
      } catch {}
    })();
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    try { await AsyncStorage.setItem(STORAGE_KEY, lang); } catch {}
  };

  const t = useMemo(() => {
    const dict = translations[language] || translations.en;
    return (key) => dict[key] || translations.en[key] || key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t, isRTL }), [language, t, isRTL]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
