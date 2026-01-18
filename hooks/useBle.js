import { useEffect, useRef, useState } from "react";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import { BleManager } from "react-native-ble-plx";

export function useBle() {
  const managerRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [nearby, setNearby] = useState(false);

  // -----------------------------
  // INIT BLE MANAGER
  // -----------------------------
  useEffect(() => {
    managerRef.current = new BleManager();

    return () => {
      managerRef.current?.destroy();
    };
  }, []);

  // -----------------------------
  // PERMISSIONS (ANDROID)
  // -----------------------------
  const requestPermissions = async () => {
    if (Platform.OS !== "android") return true;

    try {
      const permissions = [];

      if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
      }

      permissions.push(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      const results = await PermissionsAndroid.requestMultiple(permissions);

      return permissions.every(
        (p) => results[p] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.log("Permission error:", err);
      return false;
    }
  };

  // -----------------------------
  // START SCAN
  // -----------------------------
  const startScan = async () => {
    if (!managerRef.current || scanning) return;

    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        "Permission Required",
        "Bluetooth and Location permissions are required to scan for teachers."
      );
      return;
    }

    setScanning(true);
    setNearby(false);

    try {
      managerRef.current.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.log("BLE scan error:", error.message);
            stopScan();
            return;
          }

          // 🔵 SIMPLE PROXIMITY LOGIC (unchanged behavior)
          if (device && device.rssi !== null && device.rssi > -65) {
            setNearby(true);
            stopScan();
          }
        }
      );
    } catch (err) {
      console.log("BLE fatal error:", err);
      stopScan();
    }
  };

  // -----------------------------
  // STOP SCAN
  // -----------------------------
  const stopScan = () => {
    if (managerRef.current) {
      managerRef.current.stopDeviceScan();
    }
    setScanning(false);
  };

  return {
    scanning,
    nearby,
    startScan,
  };
}
