import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { useEffect } from "react";
import { View, Text } from "react-native";
import { useAuth } from "../context/AuthContext";

function AppGate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AppGate>
    </AuthProvider>
  );
}
