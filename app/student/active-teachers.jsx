import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useBle } from "../../hooks/useBle";
import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

export default function ActiveTeachersScreen() {
  const { user } = useAuth();
  const { nearby, scanning, startScan } = useBle();
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/student/active-teachers`)
      .then((r) => r.json())
      .then(setTeachers)
      .catch(() =>
        Alert.alert("Error", "Failed to load active classes")
      );
  }, []);

  const markAttendance = async (sessionId) => {
    const r = await fetch(`${BASE_URL}/student/mark-attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        session_id: sessionId,
      }),
    });

    const d = await r.json();
    if (!r.ok) {
      Alert.alert("Error", d.message);
      return;
    }

    Alert.alert("Success", "Attendance marked");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Classes</Text>

      <TouchableOpacity style={styles.scan} onPress={startScan}>
        <Text style={styles.text}>
          {scanning ? "Scanning..." : "Scan Nearby"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={teachers}
        keyExtractor={(i) => String(i.session_id)}
        renderItem={({ item }) => {
          const inRange = nearby;

          return (
            <TouchableOpacity
              style={[
                styles.button,
                !inRange && styles.disabled,
              ]}
              disabled={!inRange}
              onPress={() => markAttendance(item.session_id)}
            >
              <Text style={styles.text}>
                Mark Attendance ({item.teacher_name})
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  scan: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  disabled: {
    backgroundColor: COLORS.border,
  },
  text: {
    color: "#000",
    textAlign: "center",
    fontWeight: "600",
  },
});
