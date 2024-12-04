import { useMemo, useState } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";
import { PermissionsAndroid, Platform } from "react-native";
import * as ExpoDevice from "expo-device";

// SQLite stuff
import {initDatabase, exportTableToCSV} from "./Database";
import * as SQLite from "expo-sqlite/legacy";

// UUIDs for your service and characteristics
const SERVICE_UUID = "fafafafa-fafa-fafa-fafa-fafafafafafa";
const SPEED_UUID = "a3c87500-8ed3-4bdf-8a39-a01bebede295";
const RANGE_UUID = "4f548a6e-3e95-4afe-92b0-b0d9b32fb04a";
const BATTERY_UUID = "c94f81b6-7240-401b-8641-b09e746352dc";

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
  const [isConnectingTimeout, setIsConnectingTimeout] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const db = SQLite.openDatabase("DatabaseName.db");

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      return await requestAndroidPermissions();
    } else if (Platform.OS === "ios") {
      // iOS permissions are managed by the Info.plist configuration
      return true;
    }
    return false;
  };

  const requestAndroidPermissions = async (): Promise<boolean> => {
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
      const scanPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: "Bluetooth Scan Permission",
          message: "Bluetooth Low Energy requires Scan Permission",
          buttonPositive: "OK",
        }
      );
      const connectPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: "Bluetooth Connect Permission",
          message: "Bluetooth Low Energy requires Connect Permission",
          buttonPositive: "OK",
        }
      );
      const locationPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Bluetooth Low Energy requires Location",
          buttonPositive: "OK",
        }
      );
      return (
        scanPermission === PermissionsAndroid.RESULTS.GRANTED &&
        connectPermission === PermissionsAndroid.RESULTS.GRANTED &&
        locationPermission === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  };

  const scanForPeripherals = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        return;
      }
      if (device && (device.name || device.localName)) {
        setAllDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
  };

  const connectToDevice = async (device: Device) => {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      setDeviceName(device.name || "Unknown Device");
      setIsConnecting(true);
      setIsConnectingTimeout(false);

      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          setIsConnectingTimeout(true);
          reject(new Error("Connection timeout"));
        }, 15000);
      });

      const connectPromise = (async () => {
        const connectedDevice = await device.connect();
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setConnectedDevice(connectedDevice);

        monitorCharacteristic(connectedDevice, SPEED_UUID, setSpeedData);
        monitorCharacteristic(connectedDevice, RANGE_UUID, setRangeData);
        monitorCharacteristic(connectedDevice, BATTERY_UUID, setBatteryData);

        setIsConnecting(false);
      })();

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      console.error("Connection error:", error);
      setIsConnecting(false);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const monitorCharacteristic = (
    device: Device,
    characteristicUUID: string,
    setData: (data: string | null) => void
  ) => {
    device.monitorCharacteristicForService(SERVICE_UUID, characteristicUUID, (error, characteristic) => {
      if (error) {
        console.error(error);
        return;
      }
      if (characteristic?.value) {
        const decodedData = Buffer.from(characteristic.value, "base64").toString();
        const parsedValue = parseFloat(decodedData);
        setData(!isNaN(parsedValue) ? parsedValue.toString() : null);
      }
    });
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
