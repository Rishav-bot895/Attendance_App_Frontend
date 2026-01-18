import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";

import { useServer } from "../../context/ServerContext"; // ✅ FIXED PATH

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AssignScheduleScreen() {
  // ✅ Hook moved INSIDE component (required by React)
  const { serverIp } = useServer();
  const BASE_URL = `https://attendance-app-backend-p9ce.onrender.com`;

  const [teacherUsername, setTeacherUsername] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssignSchedule = async () => {
    if (!teacherUsername || !startTime || !endTime) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/admin/assign-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_username: teacherUsername,
          day,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to assign schedule");
        return;
      }

      Alert.alert("Success", data.message, [
        { text: "OK", onPress: () => router.back() },
      ]);

      setTeacherUsername("");
      setStartTime("");
      setEndTime("");
      setDay("Monday");
    } catch (err) {
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Teacher Schedule</Text>

      <Text style={styles.label}>Teacher Username</Text>
      <TextInput
        style={styles.input}
        value={teacherUsername}
        onChangeText={setTeacherUsername}
        autoCapitalize="none"
        placeholder="Enter teacher username"
      />

      <Text style={styles.label}>Day</Text>
      <View style={styles.dayRow}>
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayButton, day === d && styles.dayButtonActive]}
            onPress={() => setDay(d)}
          >
            <Text
              style={[styles.dayText, day === d && styles.dayTextActive]}
            >
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Start Time (HH:MM)</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={setStartTime}
        placeholder="10:00"
      />

      <Text style={styles.label}>End Time (HH:MM)</Text>
      <TextInput
        style={styles.input}
        value={endTime}
        onChangeText={setEndTime}
        placeholder="11:00"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleAssignSchedule}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Assigning..." : "Assign Schedule"}
        </Text>
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: "#1e90ff",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonActive: {
    backgroundColor: "#1e90ff",
  },
  dayText: {
    fontSize: 13,
    color: "#000",
  },
  dayTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#1e90ff",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
