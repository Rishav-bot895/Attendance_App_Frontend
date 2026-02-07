import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { DEBUG_LOG_INGEST } from "../constants/api";

const manager = new BleManager();
const SERVICE_UUID = "12345678-1234-1234-1234-123456789ABC";

// Helper: Decode Base64 to String without external libraries
function decodeManufacturerData(base64) {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = base64.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);

      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    // The first 2 bytes are Company ID. We slice them off.
    // However, the raw string above might look like garbage characters for the first 2 chars.
    // We just take the substring from index 2.
    return output.substring(2);
  } catch (e) {
    console.log("Decode error:", e);
    return null;
  }
}

export function useBle() {
  const [scanning, setScanning] = useState(false);
  const [foundSessionIds, setFoundSessionIds] = useState([]);

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

    setFoundSessionIds([]);
    setScanning(true);
    console.log("Starting BLE Scan...");
    // #region agent log
    fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBle.js:startScan',message:'Scan started',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        // #region agent log
        fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBle.js:scan-callback',message:'Scan error',data:{error: String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        return;
      }

      // #region agent log
      const suuids = device?.serviceUUIDs;
      const hasServiceUuid = Array.isArray(suuids) && suuids.includes(SERVICE_UUID);
      const hasManData = !!device?.manufacturerData;
      if (hasManData || (Array.isArray(suuids) && suuids.length > 0)) fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBle.js:device-seen',message:'Device in scan',data:{serviceUUIDs: suuids, hasServiceUuid, hasManData, manDataLen: device?.manufacturerData?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      // Check for Service UUID
      if (device?.serviceUUIDs?.includes(SERVICE_UUID)) {

        // If we have manufacturer data, try to decode the Session ID
        if (device.manufacturerData) {
            const detectedId = decodeManufacturerData(device.manufacturerData);

            // #region agent log
            fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBle.js:after-decode',message:'Decode result',data:{rawLen:device.manufacturerData?.length,detectedId,detectedType:typeof detectedId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion

            // Clean up any null bytes or whitespace
            const cleanId = detectedId ? detectedId.replace(/\0/g, '').trim() : null;

            if (cleanId) {
                console.log("Raw ManData:", device.manufacturerData, "Decoded:", cleanId);

                setFoundSessionIds((prev) => {
                    if (prev.includes(cleanId)) return prev;
                    // #region agent log
                    fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBle.js:add-session',message:'Adding to foundSessionIds',data:{cleanId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
                    // #endregion
                    return [...prev, cleanId];
                });
            }
        }
      }
    });

    // Scan for 5 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
      console.log("Scan stopped");
    }, 5000);
  };

  return {
    scanning,
    foundSessionIds,
    startScan,
  };
}