import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

// Context Providers
import { BibleProvider } from "./src/context/BibleContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";

// Screens
import BibleScreen from "./src/screens/BibleScreen";
import BookListScreen from "./src/screens/BookListScreen";
import ChapterScreen from "./src/screens/ChapterScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import BookmarksScreen from "./src/screens/BookmarksScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

// Navigation
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bible Stack Navigator
function BibleStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerTintColor: "#8B4513",
      }}
    >
      <Stack.Screen
        name="BibleHome"
        component={BibleScreen}
        options={{ title: "Holy Bible" }}
      />
      <Stack.Screen
        name="BookList"
        component={BookListScreen}
        options={{ title: "Books" }}
      />
      <Stack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={({ route }) => ({
          title: `${route.params?.bookName || "Chapter"} ${route.params?.chapterNumber || ""}`,
        })}
      />
    </Stack.Navigator>
  );
}

// Search Stack Navigator
function SearchStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerTintColor: "#8B4513",
      }}
    >
      <Stack.Screen
        name="SearchHome"
        component={SearchScreen}
        options={{ title: "Search Scripture" }}
      />
      <Stack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={({ route }) => ({
          title: `${route.params?.bookName || "Chapter"} ${route.params?.chapterNumber || ""}`,
        })}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
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
            case "Bookmarks":
              iconName = focused ? "bookmark" : "bookmark-outline";
              break;
            case "Settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "help-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#8B4513",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          height: 60,
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
        options={{ title: "Bible" }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{ title: "Search" }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: "Favorites",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerTintColor: "#8B4513",
        }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{
          title: "Bookmarks",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerTintColor: "#8B4513",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerTintColor: "#8B4513",
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  return (
    <BibleProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <TabNavigator />
        </NavigationContainer>
      </FavoritesProvider>
    </BibleProvider>
  );
}
