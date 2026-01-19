import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../../constants/theme";

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
        <Text style={styles.buttonText}>Assign Schedule</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.disabledButton]} 
        activeOpacity={1} 
        onPress={null}  
      >
        <Text style={styles.disabledButtonText}>Delete User (Later)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
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
