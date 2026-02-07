import { useEffect, useState } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { DEBUG_LOG_INGEST } from "../constants/api";

const manager = new BleManager();
// IMPORTANT: Service UUID must be lowercase for Android
const SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";

// Helper: Decode Base64 to String
function decodeManufacturerData(base64) {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = base64.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error("Invalid base64 string");
    }

    for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    // Remove company ID (first 2 bytes)
    return output.substring(2);
  } catch (e) {
    console.log("Decode error:", e);
    return null;
  }
}

export function useBle() {
  const [scanning, setScanning] = useState(false);
  const [foundSessionIds, setFoundSessionIds] = useState([]);
  const [bluetoothState, setBluetoothState] = useState("Unknown");

  useEffect(() => {
    // Check initial Bluetooth state
    checkBluetoothState();

    // Subscribe to Bluetooth state changes
    const subscription = manager.onStateChange((state) => {
      console.log("Bluetooth state:", state);
      setBluetoothState(state);
      
      if (state === "PoweredOff") {
        Alert.alert(
          "Bluetooth is Off",
          "Please turn on Bluetooth to scan for nearby teachers"
        );
      }
    }, true);

    return () => {
      subscription.remove();
      manager.stopDeviceScan();
    };
  }, []);

  const checkBluetoothState = async () => {
    try {
      const state = await manager.state();
      console.log("Current Bluetooth state:", state);
      setBluetoothState(state);
      return state === "PoweredOn";
    } catch (error) {
      console.error("Error checking Bluetooth state:", error);
      return false;
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const permissions = Platform.Version >= 31 
          ? [
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]
          : [
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ];

        console.log("Requesting permissions:", permissions);

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log("Permission results:", granted);

        const allGranted = Object.values(granted).every(
          (s) => s === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            "Permissions Required",
            "Bluetooth and Location permissions are required to scan for nearby teachers. Please grant them in Settings."
          );
          return false;
        }

        return true;
      } catch (error) {
        console.error("Permission error:", error);
        Alert.alert("Permission Error", String(error));
        return false;
      }
    }
    return true;
  };

  const startScan = async () => {
    try {
      console.log("=== Starting BLE Scan ===");

      // Step 1: Check Bluetooth state
      const isBluetoothOn = await checkBluetoothState();
      if (!isBluetoothOn) {
        Alert.alert(
          "Bluetooth is Off",
          "Please turn on Bluetooth to scan for nearby teachers"
        );
        return;
      }

      // Step 2: Request permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.log("❌ Permissions denied");
        return;
      }

      console.log("✅ Permissions granted");

      // Step 3: Clear previous results and start scanning
      setFoundSessionIds([]);
      setScanning(true);

      // Log scan start
      fetch(DEBUG_LOG_INGEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'useBle.js:startScan',
          message: 'Scan started',
          data: { bluetoothState },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'H4'
        })
      }).catch(() => {});

      console.log("Scanning for devices...");
      let devicesFound = 0;
      let devicesWithService = 0;

      manager.startDeviceScan(
        null, // Scan for all devices
        { 
          allowDuplicates: true,
          scanMode: 1, // Low latency mode
        },
        (error, device) => {
          if (error) {
            console.error("❌ Scan error:", error);
            
            // Log error
            fetch(DEBUG_LOG_INGEST, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'useBle.js:scan-error',
                message: 'Scan error occurred',
                data: { 
                  error: String(error),
                  errorCode: error.errorCode,
                  reason: error.reason 
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                hypothesisId: 'H4'
              })
            }).catch(() => {});

            // Stop scanning on error
            manager.stopDeviceScan();
            setScanning(false);
            
            Alert.alert(
              "Scan Error",
              `Failed to scan: ${error.message || error}\n\nPlease try:\n1. Turn Bluetooth off and on\n2. Restart the app\n3. Check app permissions`
            );
            return;
          }

          if (!device) return;

          devicesFound++;

          // Log every device seen
          const serviceUUIDs = device.serviceUUIDs || [];
          const hasServiceUuid = serviceUUIDs.some(uuid => 
            uuid.toLowerCase() === SERVICE_UUID.toLowerCase()
          );
          const hasManData = !!device.manufacturerData;

          console.log(`Device: ${device.name || device.id}`);
          console.log(`  Services: ${serviceUUIDs.join(', ') || 'none'}`);
          console.log(`  Has manufacturer data: ${hasManData}`);
          console.log(`  Has our service: ${hasServiceUuid}`);

          // Log interesting devices
          if (hasManData || serviceUUIDs.length > 0) {
            fetch(DEBUG_LOG_INGEST, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'useBle.js:device-seen',
                message: 'Device detected',
                data: {
                  deviceName: device.name,
                  deviceId: device.id,
                  serviceUUIDs,
                  hasServiceUuid,
                  hasManData,
                  manDataLen: device.manufacturerData?.length,
                  rssi: device.rssi
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                hypothesisId: 'H1'
              })
            }).catch(() => {});
          }

          // Check if this device has our service UUID
          if (hasServiceUuid) {
            devicesWithService++;
            console.log("✅ Found device with our service UUID!");

            // Try to decode manufacturer data
            if (device.manufacturerData) {
              const detectedId = decodeManufacturerData(device.manufacturerData);

              console.log("Manufacturer data (base64):", device.manufacturerData);
              console.log("Decoded ID:", detectedId);

              // Log decode result
              fetch(DEBUG_LOG_INGEST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: 'useBle.js:after-decode',
                  message: 'Decode result',
                  data: {
                    rawLen: device.manufacturerData?.length,
                    detectedId,
                    detectedType: typeof detectedId
                  },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  hypothesisId: 'H2'
                })
              }).catch(() => {});

              // Clean up the ID
              const cleanId = detectedId ? detectedId.replace(/\0/g, '').trim() : null;

              if (cleanId) {
                console.log("✅ Clean session ID:", cleanId);

                setFoundSessionIds((prev) => {
                  if (prev.includes(cleanId)) {
                    return prev;
                  }

                  console.log("Adding session ID to list:", cleanId);

                  // Log success
                  fetch(DEBUG_LOG_INGEST, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: 'useBle.js:add-session',
                      message: 'Adding to foundSessionIds',
                      data: { cleanId },
                      timestamp: Date.now(),
                      sessionId: 'debug-session',
                      hypothesisId: 'H3'
                    })
                  }).catch(() => {});

                  return [...prev, cleanId];
                });
              } else {
                console.log("⚠️ Could not decode manufacturer data");
              }
            } else {
              console.log("⚠️ Device has service UUID but no manufacturer data");
            }
          }
        }
      );

      // Stop scan after 8 seconds
      setTimeout(() => {
        manager.stopDeviceScan();
        setScanning(false);
        
        console.log("=== Scan Complete ===");
        console.log(`Devices found: ${devicesFound}`);
        console.log(`Devices with our service: ${devicesWithService}`);
        console.log(`Session IDs detected: ${foundSessionIds.length}`);

        // Show result to user
        if (foundSessionIds.length === 0 && devicesWithService === 0) {
          Alert.alert(
            "No Teachers Found",
            `Scanned ${devicesFound} devices but found no active teachers nearby.\n\nMake sure:\n• Teacher has started attendance\n• You're close to the teacher\n• Bluetooth is working properly\n\nYou can also use Manual Entry to enter the session code.`
          );
        } else if (foundSessionIds.length === 0 && devicesWithService > 0) {
          Alert.alert(
            "Detection Issue",
            `Found ${devicesWithService} teacher(s) broadcasting but couldn't read session IDs.\n\nPlease use Manual Entry to enter the session code.`
          );
        } else {
          Alert.alert(
            "Teachers Found",
            `Found ${foundSessionIds.length} active teacher(s) nearby!`
          );
        }

        // Log final results
        fetch(DEBUG_LOG_INGEST, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'useBle.js:scan-complete',
            message: 'Scan finished',
            data: {
              devicesFound,
              devicesWithService,
              sessionIdsFound: foundSessionIds.length,
              sessionIds: foundSessionIds
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            hypothesisId: 'H4'
          })
        }).catch(() => {});
      }, 8000); // 8 seconds

    } catch (error) {
      console.error("❌ Unexpected error:", error);
      setScanning(false);
      Alert.alert("Error", `Scan failed: ${error.message}`);
    }
  };

  return {
    scanning,
    foundSessionIds,
    startScan,
    bluetoothState,
  };
}