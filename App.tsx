import React, { useState, FC, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import DeviceModal from "./DeviceConnectionModal";
import useBLE from "./useBLE";
import {initDatabase, exportTableToCSV} from "./Database";
import * as SQLite from "expo-sqlite/legacy";

const App = () => {
  const db = SQLite.openDatabase("DatabaseName.db");
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    speedData, // speed value from BLE service
    batteryData, // battery value from BLE service 
    rangeData, // range value from BLE service
    isConnecting, // wait module for BLE connection
    isConnectingTimeout, // Timeout error
    deviceName, // device name
  } = useBLE();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => { // Connection modal will show
    initDatabase(db);
    setIsModalVisible(true);
    scanForDevices();
  };
  
  const handleRetry = () => {
    openModal();  // Restart the connection process by reopening the modal and scanning for devices.
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* If a device is connected, display its data, otherwise show connect prompt */}
      {connectedDevice ? (
        <View>
          {/* Device Name */}
          <View style={styles.CartNameWrapper}>
            <Text style={styles.cartName}>
              Name: {connectedDevice.name || 'Unnamed Device'}
            </Text>
          </View>
      
          {/* Range */}
          <View style={styles.iconBox}>
            <View style={styles.iconContent}>
              <Text style={styles.iconHeader}>Range:</Text>
              {/* Placeholder for actual range data */}
              <Text style={styles.iconText}>
                {rangeData ? `${rangeData} m` : "Unknown Range"}
              </Text>
              <Image
                source={require("./assets/images/bike.png")}
                style={styles.image}
              />
            </View>
          </View>

          {/* Speed */}
          <View style={styles.iconBox}>
            <View style={styles.iconContent}>
              <Text style={styles.iconHeader}>Speed:</Text>
              {/* Display received data or fallback to (0 km/h) */}
              <Text style={styles.iconText}>
                {speedData ? `${speedData} km/h` : "Unknown Speed"}
              </Text>
              <Image
                source={require("./assets/images/speed.png")}
                style={styles.image}
              />
            </View>
          </View>
      
          {/* Battery */}
          <View style={styles.iconBox}>
            <View style={styles.iconContent}>
              <Text style={styles.iconHeader}>Battery:</Text>
              {/* Placeholder for actual battery data */}
              <Text style={styles.iconText}>
                {batteryData ? `${batteryData} %` : "Unknown Battery"}
              </Text>
            </View>
          </View>
      
          {/* Disconnect Button */}
          <TouchableOpacity
            onPress={disconnectFromDevice}
            style={styles.disButton}
          >
            <Text style={styles.ctaButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.CartTitleWrapper}>
          {/* Show the "Please connect" message and Connect button */}
          <Text style={styles.CartTitleText}>Please Connect to a Cart</Text>

          <TouchableOpacity
            onPress={openModal}
            style={styles.conButton}
          >
            <Text style={styles.ctaButtonText}>Connect to device</Text>
          </TouchableOpacity>
        </View>
      ) }

      {/* Modal for displaying available devices */}
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />

      {/* Waiting for connection status modal */}
      <Modal
        transparent={true}
        visible={isConnecting}
        animationType="fade"
      >
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator size="large" color="#ffe5b4" />
            <Text style={styles.modalText}>
              Connecting to device...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Timeout and retry case */}
        <Modal
          transparent={true} 
          visible={isConnectingTimeout}
          animationType="fade"
        >

          <View style={styles.modalBackground}>
            <View style={styles.timeoutIndicatorWrapper}>
              <Text style={styles.modalText}>
                Could not connect to device: {deviceName || "Unknown"}
              </Text>
              <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                <Text style={styles.ctaButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "wheat",
  },
  CartTitleWrapper: {
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100,
  },
  CartNameWrapper: {
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  CartTitleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 30,
    marginTop: 70,
    color: "black",
  },
  cartName: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 70,
    color: "black",
  },
  ctaButton: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: "80%",
    marginHorizontal: "20%",
    borderRadius: 10,
    marginTop: 60,
  },
  conButton: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: "80%",
    marginHorizontal: "20%",
    borderRadius: 10,
    marginTop: 250,
  },
  ctaButtonText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
  },
  iconBox: {
    backgroundColor: "#2a2e30",
    paddingTop: 20,
    paddingLeft: 25,
    height: 100,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 8,
  },
  iconContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconHeader: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
  iconText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  image: {
    width: 140,
    height: 80,
    resizeMode: "contain",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  activityIndicatorWrapper: {
    backgroundColor: "#FFFFFF",
    height: 100,
    width: 200,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalText: {
    marginTop: 10,
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  timeoutIndicatorWrapper: {
    backgroundColor: "#FFFFFF",
    height: 120,
    width: 250,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // BUTTONS
  retryButton: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    width: 100,
    borderRadius: 10,
  },
  disButton: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: "80%",
    marginHorizontal: "10%",
    borderRadius: 10,
    marginTop: 40,
  },
});

export default App;
