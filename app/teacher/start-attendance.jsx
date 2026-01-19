import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";
import BleAdvertiser from "react-native-ble-advertiser";

export default function StartAttendanceScreen() {
  const { user, setSession } = useAuth();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/teacher/start-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });

      const d = await r.json();
      if (!r.ok) {
        Alert.alert("Error", d.message);
        return;
      }

      // 🔥 START BLE ADVERTISING USING TEACHER UUID
      await BleAdvertiser.broadcast(
        user.beacon_id,
        [],
        {
          advertiseMode: BleAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
          txPowerLevel: BleAdvertiser.ADVERTISE_TX_POWER_HIGH,
          connectable: false,
        }
      );

      await setSession(d.session_id);
      router.replace("/teacher/absent-students");
    } catch (e) {
      Alert.alert("Error", "Failed to start attendance");
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Attendance</Text>
      <TouchableOpacity style={styles.button} onPress={start} disabled={loading}>
        <Text style={styles.text}>
          {loading ? "Starting..." : "Start Attendance"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 24 },
  title: { color: COLORS.text, fontSize: 22, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12 },
  text: { textAlign: "center", fontWeight: "600", color: "#000" },
});
