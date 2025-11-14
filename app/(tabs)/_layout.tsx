import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

function CenterTabButton({ onPress }: any) {
  const insets = useSafeAreaInsets();
  // place the button above the system nav bar on android using bottom inset
  const bottomOffset =
    Math.max(insets.bottom, Platform.OS === "android" ? 12 : 6) + 6;

  return (
    <TouchableOpacity
      style={[styles.centerButtonContainer, { bottom: bottomOffset }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.centerButton}>
        <Ionicons name="person-add" size={22} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}
function HeaderMenuButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/help")}
      style={{ paddingHorizontal: 12 }}
      accessibilityLabel="Open help and terms"
    >
      <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
    </TouchableOpacity>
  );
}


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: true,
        tabBarShowLabel: true,
        headerStyle: { backgroundColor: "#007AFF" },
        headerTintColor: "#fff",
        tabBarStyle: {
          height: 56,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                }}
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
                TrackPoint
              </Text>
            </View>
          ),
          title: "Home",
          headerStyle: { backgroundColor: "#007AFF" },
          headerTintColor: "#fff",
          headerRight: () => <HeaderMenuButton />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-customer"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",

          headerTintColor: "#fff",
          tabBarIcon: ({ color, size }) => (
            // Force menu icon to blue
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    top: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    alignSelf: "center",
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
