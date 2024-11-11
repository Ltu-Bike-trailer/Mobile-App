///* eslint-disable no-bitwise */

import { useMemo, useState } from "react";
import {
  BleManager,
  Device,
} from "react-native-ble-plx";
import { Buffer } from "buffer";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";

// UUIDs for your service and characteristic
const SERVICE_UUID = "fafafafa-fafa-fafa-fafa-fafafafafafa"; // Cart ID
const SPEED_UUID = "a3c87500-8ed3-4bdf-8a39-a01bebede295"; // speed service
const RANGE_UUID = "4f548a6e-3e95-4afe-92b0-b0d9b32fb04a"; // range service (Later changed to battery * range/Bpercentage)
const BATTERY_UUID = "c94f81b6-7240-401b-8641-b09e746352dc"; // battery service

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  speedData: string | null;
  rangeData: string | null;
  batteryData: string | null;
  isConnecting: boolean;
  isConnectingTimeout: boolean;
  deviceName: string | null;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [speedData, setSpeedData] = useState<string | null>(null);
  const [rangeData, setRangeData] = useState<string | null>(null);
  const [batteryData, setBatteryData] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isConnectingTimeout, setIsConnectingTimeout] = useState<boolean>(false);
  

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        return await requestAndroid31Permissions();
      }
    }
    return true;
  };

  // ANDROID SPECIFICS (Needed in order to work since android 31)
  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Bluetooth Scan Permission",
        message: "Bluetooth Low Energy requires Scan Permission",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Bluetooth Connect Permission",
        message: "Bluetooth Low Energy requires Connect Permission",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
      bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
      fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const scanForPeripherals = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        return;
      }

      if (device && (device.name || device.localName)) {
        console.log("Device found:", device.name || device.localName);
      }

      if (device) {
        const deviceName = device.name || device.localName || "Unknown Device";
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const connectToDevice = async (device: Device) => {
    let timeoutId: NodeJS.Timeout | null = null; // Here we declare timeoutId to track the timeout
    try {
      setDeviceName(device.name);
      setIsConnecting(true); // Trying to connect to a device (popup for users)
      setIsConnectingTimeout(false); // Reset timeout indicator on each connection attempt
  
      // Sets a timeout for the connection attempt
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          setIsConnectingTimeout(true);
          reject(new Error("Failed to connect to device"));
        }, 15000); // 15 seconds timeout
      });
  
      const connectPromise = (async () => {
        const connectedDevice = await device.connect();
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setConnectedDevice(connectedDevice);

        // Clear the timeout if connection succeeds (else we get "retry" popup no matter what)
        if (timeoutId) clearTimeout(timeoutId);

        // Subscribe to notifications from the characteristic inside (speed value)
        connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          SPEED_UUID,
          (error, characteristic) => {
            if (error) {
              console.error(error);
              return;
            }

            if (characteristic?.value) {
              // Decode the Base64 value received
              const data = Buffer.from(characteristic.value, "base64").toString();

              // Attempt to parse the data as a float
              const speedValue = parseFloat(data);

              // Check if speedValue is a valid number
              if (!isNaN(speedValue)) {
                setSpeedData(speedValue.toString()); // Update to string representation
              } else {
                setSpeedData(null); // Set to null if not a valid number
              }
            
              console.log("Speed data:", data);
            }
          }
        );

        // Subscribe to notifications from the characteristic inside (Range value)
        connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          RANGE_UUID,
          (error, characteristic) => {
            if (error) {
              console.error(error);
              return;
            }

            if (characteristic?.value) {
              // Decode the Base64 value received
              const data = Buffer.from(characteristic.value, "base64").toString();

              // Attempt to parse the data as a float
              const rangeValue = parseFloat(data);

              // Check if speedValue is a valid number
              if (!isNaN(rangeValue)) {
                setRangeData(rangeValue.toString()); // Update to string representation
              } else {
                setRangeData(null); // Set to null if not a valid number
              }
            
              console.log("Range data:", data);
            }
          }
        );

        // Subscribe to notifications from the characteristic inside (battery value)
        connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          BATTERY_UUID,
          (error, characteristic) => {
            if (error) {
              console.error(error);
              return;
            }

            if (characteristic?.value) {
              // Decode the Base64 value received
              const data = Buffer.from(characteristic.value, "base64").toString();

              // Attempt to parse the data as a float
              const batteryValue = parseFloat(data);

              // Check if speedValue is a valid number
              if (!isNaN(batteryValue)) {
                setBatteryData(batteryValue.toString()); // Update to string representation
              } else {
                setBatteryData(null); // Set to null if not a valid number
              }
            
              console.log("Battery data:", data);
            }
          }
        );

        setIsConnecting(false); // Successfully connected to new device (set false to remove popup modal)
        setIsConnectingTimeout(false);
      })();

    // Wait for promises to conclude, connection and/or timeout
    await Promise.race([connectPromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Connection error:", errorMessage);
  
    setIsConnecting(false); // Hide connection modal on failure
    setIsConnectingTimeout(errorMessage === "Failed to connect to device"); // Only set timeout flag if it's a timeout error
    if (timeoutId) clearTimeout(timeoutId);
  }
  if (timeoutId) clearTimeout(timeoutId);
};

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
    }
  };

  return {
    requestPermissions,
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    connectedDevice,
    speedData,
    rangeData,
    batteryData,
    allDevices,
    isConnecting,
    isConnectingTimeout,
    deviceName,
  };
}

export default useBLE;
