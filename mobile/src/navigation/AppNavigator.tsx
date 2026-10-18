import React from "react";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { CatalogScreen } from "../screens/CatalogScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { CartScreen } from "../screens/CartScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";

import { HomeIcon, CatalogIcon, CartIcon, UserIcon } from "../components/Icons";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { totalItems } = useCart();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 12,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="Asosiy"
        component={HomeScreen}
        options={{
          tabBarLabel: t("nav_home"),
          tabBarIcon: ({ color }) => <HomeIcon size={21} color={color} />,
        }}
      />
      <Tab.Screen
        name="Katalog"
        component={CatalogScreen}
        options={{
          tabBarLabel: t("nav_catalog"),
          tabBarIcon: ({ color }) => <CatalogIcon size={21} color={color} />,
        }}
      />
      <Tab.Screen
        name="Savatcha"
        component={CartScreen}
        options={{
          tabBarLabel: t("nav_cart"),
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#ef4444",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 18,
          },
          tabBarIcon: ({ color }) => <CartIcon size={21} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("nav_profile"),
          tabBarIcon: ({ color }) => <UserIcon size={21} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "700", color: colors.text },
        headerStyle: { backgroundColor: colors.headerBg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: "Mahsulot",
          headerBackTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}
