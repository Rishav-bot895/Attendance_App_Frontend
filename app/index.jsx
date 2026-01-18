import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function RoleSelectScreen() {
  const goToLogin = (role) => {
    router.push({
      pathname: "/login",
      params: { role },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => goToLogin("student")}
      >
        <Text style={styles.buttonText}>Student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => goToLogin("teacher")}
      >
        <Text style={styles.buttonText}>Teacher</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => goToLogin("admin")}
      >
        <Text style={styles.buttonText}>Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 32,
  },
  button: {
    width: "80%",
    paddingVertical: 16,
    backgroundColor: "#1e90ff",
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
});
