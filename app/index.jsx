import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../constants/theme";

export default function RoleSelectScreen() {
  const goToLogin = (role) => {
    router.push({ pathname: "/login", params: { role } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      {["student", "teacher", "admin"].map((r) => (
        <TouchableOpacity
          key={r}
          style={styles.button}
          onPress={() => goToLogin(r)}
        >
          <Text style={styles.buttonText}>{r.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    color: COLORS.text,
    marginBottom: 32,
  },
  button: {
    width: "80%",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
});
