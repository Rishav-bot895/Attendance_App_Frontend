import { Alert, PermissionsAndroid, Platform } from "react-native";
import BleAdvertiser from "react-native-ble-advertiser";
import { DEBUG_LOG_INGEST } from "../constants/api";

const SERVICE_UUID = "12345678-1234-1234-1234-123456789ABC";

export function useBleAdvertiser() {
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        if (Platform.Version >= 31) {
          // Android 12+
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          console.log("Permission results:", result);

          const allGranted = Object.values(result).every(
            (status) => status === PermissionsAndroid.RESULTS.GRANTED
          );

          if (!allGranted) {
            Alert.alert(
              "Permission Error",
              "All Bluetooth permissions are required. Please enable them in Settings."
            );
            return false;
          }
        } else {
          // Android 11 and below
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Error", "Location permission is required.");
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error("Permission request error:", error);
        return false;
      }
    }
    return true;
  };

  const startAdvertising = async (sessionId) => {
    try {
      console.log("=== Starting BLE Advertising ===");
      console.log("Session ID:", sessionId);
      console.log("Android Version:", Platform.Version);

      // Step 1: Check permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.log("❌ Permissions denied");
        return false;
      }
      console.log("✅ Permissions granted");

      // Step 2: Check if BLE is supported
      const isSupported = await BleAdvertiser.getAdapterState()
        .then((result) => {
          console.log("BLE Adapter State:", result);
          return result === "STATE_ON";
        })
        .catch((error) => {
          console.log("⚠️ Could not check adapter state:", error);
          return true; // Assume it's on and try anyway
        });

      if (!isSupported) {
        Alert.alert(
          "Bluetooth Error",
          "Please turn on Bluetooth and try again."
        );
        return false;
      }

      // Step 3: Prepare payload (keep it minimal)
      const idString = String(sessionId);
      console.log("Session ID String:", idString, "Length:", idString.length);

      // Convert to byte array
      const payload = [];
      for (let i = 0; i < idString.length && i < 20; i++) {
        // Limit to 20 bytes
        payload.push(idString.charCodeAt(i));
      }

      console.log("Payload bytes:", payload);
      console.log("Payload length:", payload.length);

      // Log to debug endpoint
      fetch(DEBUG_LOG_INGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "useBleAdvertiser.js:startAdvertising",
          message: "Starting advertisement",
          data: {
            sessionId,
            idString,
            payload,
            payloadLength: payload.length,
            androidVersion: Platform.Version,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          hypothesisId: "H5",
        }),
      }).catch(() => {});

      // Step 4: Set company ID
      try {
        BleAdvertiser.setCompanyId(0x00e0);
        console.log("✅ Company ID set");
      } catch (error) {
        console.log("⚠️ Could not set company ID:", error);
      }

      // Step 5: Start broadcasting
      console.log("Starting broadcast...");
      
      await BleAdvertiser.broadcast(SERVICE_UUID, payload, {
        advertiseMode: BleAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
        txPowerLevel: BleAdvertiser.ADVERTISE_TX_POWER_HIGH,
        connectable: false,
        includeDeviceName: false,
        includeTxPowerLevel: false,
      });

      console.log("✅ BLE advertising started successfully");
      
      // Verify it's actually broadcasting
      setTimeout(async () => {
        try {
          const state = await BleAdvertiser.getAdapterState();
          console.log("Adapter state after broadcast:", state);
        } catch (e) {
          console.log("Could not verify adapter state:", e);
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error("❌ BLE Advertising Error:", error);
      console.error("Error stack:", error.stack);

      // Log to debug endpoint
      fetch(DEBUG_LOG_INGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "useBleAdvertiser.js:startAdvertising:error",
          message: "Advertisement failed",
          data: {
            error: String(error),
            errorMessage: error.message,
            errorStack: error.stack,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          hypothesisId: "H5",
        }),
      }).catch(() => {});

      Alert.alert(
        "BLE Error",
        `Failed to start advertising: ${error.message || "Unknown error"}\n\nPlease try:\n1. Restart Bluetooth\n2. Restart the app\n3. Check Android version compatibility`
      );
      return false;
    }
  };

  const stopAdvertising = async () => {
    try {
      console.log("Stopping BLE advertising...");
      await BleAdvertiser.stopBroadcast();
      console.log("✅ BLE advertising stopped");
    } catch (error) {
      console.error("❌ BLE stop error:", error);
    }
  };

  return {
    startAdvertising,
    stopAdvertising,
  };
}