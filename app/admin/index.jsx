import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/admin/create-user")}
      >
        <Text style={styles.buttonText}>Create User</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/admin/assign-schedule")}
      >
        <Text style={styles.buttonText}>Assign Teacher Schedule</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonDisabled}>
        <Text style={styles.buttonText}>Delete User (Later)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#1e90ff",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
