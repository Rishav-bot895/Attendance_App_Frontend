import { Alert, PermissionsAndroid, Platform } from "react-native";
import BleAdvertiser from "react-native-ble-advertiser";
import { DEBUG_LOG_INGEST } from "../constants/api";

const SERVICE_UUID = "12345678-1234-1234-1234-123456789ABC";

export function useBleAdvertiser() {
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const advertise = result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE];
        const connect = result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT];

        if (advertise !== 'granted' || connect !== 'granted') {
          Alert.alert("Permission Error", "Bluetooth permissions denied.");
          return false;
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Error", "Location permission denied.");
          return false;
        }
      }
    }
    return true;
  };

  // MODIFICATION: Accepts sessionId instead of username
  const startAdvertising = async (sessionId) => {
    try {
      console.log("Starting BLE setup for Session:", sessionId);

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return false;

      // MODIFICATION: Convert Session ID to byte array
      const idString = String(sessionId);
      const payload = [];
      for (let i = 0; i < idString.length; i++) {
        payload.push(idString.charCodeAt(i));
      }
      // #region agent log
      fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBleAdvertiser.js:startAdvertising',message:'Advertiser payload',data:{sessionId, idString, payload},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion

      BleAdvertiser.setCompanyId(0x00E0); 
      
      await BleAdvertiser.broadcast(SERVICE_UUID, payload, {
        advertiseMode: BleAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
        txPowerLevel: BleAdvertiser.ADVERTISE_TX_POWER_HIGH,
        connectable: false,
        // MODIFICATION: Turn off device name to save space
        // This ensures we don't hit the 31-byte limit
        includeDeviceName: false, 
        includeTxPowerLevel: false,
      });

      console.log("BLE advertising started successfully");
      return true;

    } catch (error) {
      console.log("BLE Error:", error);
      Alert.alert("BLE Error", error.message || "Failed to start advertising");
      return false;
    }
  };

  const stopAdvertising = async () => {
    try {
      await BleAdvertiser.stopBroadcast();
      console.log("BLE advertising stopped");
    } catch (error) {
      console.log("BLE stop error:", error);
    }
  };

  return {
    startAdvertising,
    stopAdvertising,
  };
}