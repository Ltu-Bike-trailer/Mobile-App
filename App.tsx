import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceModal from "./DeviceConnectionModal";
import { PulseIndicator } from "./PulseIndicator";
import useBLE from "./useBLE";
import { Picture } from "@shopify/react-native-skia";

const App = () => {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    heartRate,
    disconnectFromDevice,
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

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.CartTitleWrapper}>
        {connectedDevice ? (
          <>
            <PulseIndicator />
            <Text style={styles.CartTitleText}>Speed:</Text>:
            <Text style={styles.CartText}>{heartRate} km/h</Text>
          </>
        ) : (
          <Text style={styles.CartTitleText}>
            Please Connect to a Cart
          </Text>
        )}
      </View>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>here</Text>
      </View>
      <TouchableOpacity
        onPress={connectedDevice ? disconnectFromDevice : openModal}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaButtonText}>
          {connectedDevice ? "Disconnect" : "Connect"}
        </Text>
      </TouchableOpacity>
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "wheat",
  },
  CartTitleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  CartTitleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 30,
    color: "black",
  },
  CartText: {
    fontSize: 25,
    marginTop: 15,
  },
  ctaButton: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 55,
    marginHorizontal: 20,
    marginBottom: 300,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
  },
  iconBox: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 100,
    marginHorizontal: 50,
    marginBottom: 100,
    borderRadius: 8,
  },
  iconText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black"
  }
});

export default App;
