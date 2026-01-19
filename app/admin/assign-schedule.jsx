import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";

import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AssignScheduleScreen() {
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
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Assign Teacher Schedule</Text>

        <Text style={styles.label}>Teacher Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter teacher username"
          placeholderTextColor={COLORS.muted}
          value={teacherUsername}
          autoCapitalize="none"
          onChangeText={setTeacherUsername}
        />

        <Text style={styles.label}>Day</Text>
        <View style={styles.dayRow}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.dayButton,
                day === d && styles.dayButtonActive,
              ]}
              onPress={() => setDay(d)}
            >
              <Text
                style={[
                  styles.dayText,
                  day === d && styles.dayTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Start Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="10:00"
          placeholderTextColor={COLORS.muted}
          value={startTime}
          onChangeText={setStartTime}
        />

        <Text style={styles.label}>End Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="11:00"
          placeholderTextColor={COLORS.muted}
          value={endTime}
          onChangeText={setEndTime}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    color: COLORS.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.text,
    fontSize: 13,
  },
  dayTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
