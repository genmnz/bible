import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

// Context Providers
import { LocaleProvider, useLocale } from "./src/context/LocaleContext";
import { BibleProvider } from "./src/context/BibleContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { ThemeProvider, useThemeMode } from "./src/context/ThemeContext";

// Screens
import BibleScreen from "./src/screens/BibleScreen";
import BookListScreen from "./src/screens/BookListScreen";
import ChapterScreen from "./src/screens/ChapterScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

// Navigation
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bible Stack Navigator
function BibleStackNavigator() {
  const { t, isRTL } = useLocale();
  const { colors, isDark } = useThemeMode();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
        },
        headerBackground: () => (
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
          color: colors.text,
        },
        headerTintColor: colors.primary,
        // Slide horizontally between screens
        gestureEnabled: true,
        gestureDirection: isRTL ? 'horizontal-inverted' : 'horizontal',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen
        name="BibleHome"
        component={BibleScreen}
        options={{ title: t('title.bibleHome') }}
      />
      <Stack.Screen
        name="BookList"
        component={BookListScreen}
        options={{ title: t('title.books') }}
      />
      <Stack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={({ route }) => ({
          title: `${route.params?.bookName || t('title.chapter')} ${route.params?.chapterNumber || ""}`,
        })}
      />
    </Stack.Navigator>
  );
}

// Search Stack Navigator
function SearchStackNavigator() {
  const { t, isRTL } = useLocale();
  const { colors, isDark } = useThemeMode();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
        },
        headerBackground: () => (
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
          color: colors.text,
        },
        headerTintColor: colors.primary,
        // Slide horizontally between screens
        gestureEnabled: true,
        gestureDirection: isRTL ? 'horizontal-inverted' : 'horizontal',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen
        name="SearchHome"
        component={SearchScreen}
        options={{ title: t('title.searchHome') }}  
      />
      <Stack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={({ route }) => ({
          title: `${route.params?.bookName || t('title.chapter')} ${route.params?.chapterNumber || ""}`,
        })}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
  const { t } = useLocale();
  const { colors, isDark } = useThemeMode();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "Bible":
              iconName = focused ? "book" : "book-outline";
              break;
            case "Search":
              iconName = focused ? "search" : "search-outline";
              break;
            case "Favorites":
              iconName = focused ? "heart" : "heart-outline";
              break;
            case "Settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "gray",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen
        name="Bible"
        component={BibleStackNavigator}
        options={{ title: t('tab.bible') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{ title: t('tab.search') }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: t('tab.favorites'),
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent', elevation: 0 },
          headerBackground: () => (
            <BlurView
              intensity={isDark ? 30 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ),
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
            color: colors.text,
          },
          headerTintColor: colors.primary,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('tab.settings'),
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent', elevation: 0 },
          headerBackground: () => (
            <BlurView
              intensity={isDark ? 30 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ),
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
            color: colors.text,
          },
          headerTintColor: colors.primary,
        }}
      />
    </Tab.Navigator>
  );
}
// Main App Component
function AppContainer() {
  const { isDark, colors } = useThemeMode();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <TabNavigator />
    </>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <BibleProvider>
        <FavoritesProvider>
          <ThemeProvider>
            <NavigationContainer>
              <AppContainer />
            </NavigationContainer>
          </ThemeProvider>
        </FavoritesProvider>
      </BibleProvider>
    </LocaleProvider>
  );
}
