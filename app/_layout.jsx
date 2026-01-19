import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { View, Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/theme";

function AppGate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLORS.text }}>Loading...</Text>
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
