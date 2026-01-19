import { useEffect, useState } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { BleManager } from "react-native-ble-plx";

const manager = new BleManager();

// RSSI threshold (tune if needed)
const RSSI_THRESHOLD = -72;


export function useBle() {
  const [nearby, setNearby] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return Object.values(granted).every(
        (s) => s === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  };

  const startScan = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    setNearby(false);
    setScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("BLE scan error:", error);
        return;
      }

      // 🔥 RSSI-based proximity check
      if (device?.rssi !== null && device?.rssi !== undefined) {
        if (device.rssi > RSSI_THRESHOLD) {
          setNearby(true);
        }
      }
    });

    // Stop scan after 6 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 6000);
  };

  return {
    nearby,
    scanning,
    startScan,
  };
}
