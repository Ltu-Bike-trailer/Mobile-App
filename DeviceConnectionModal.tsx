import React, { FC, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Device } from "react-native-ble-plx";

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
  const { item, connectToPeripheral, closeModal } = props;

  const connectAndCloseModal = useCallback(() => {
    connectToPeripheral(item.item);
    closeModal();
  }, [closeModal, connectToPeripheral, item.item]);

  return (
    <TouchableOpacity
      onPress={connectAndCloseModal}
      style={modalStyle.ctaButton}
    >
      <Text style={modalStyle.ctaButtonText}>{item.item.name}</Text>
    </TouchableOpacity>
  );
};

const DeviceModal: FC<DeviceModalProps> = (props) => {
  const { devices, visible, connectToPeripheral, closeModal } = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToPeripheral={connectToPeripheral}
          closeModal={closeModal}
        />
      );
    },
    [closeModal, connectToPeripheral]
  );

  return (
    <Modal
      style={modalStyle.modalContainer}
      animationType="slide"
      transparent={false}
      visible={visible}
        
    >
      <SafeAreaView style={modalStyle.modalTitle}>
        <Text style={modalStyle.modalTitleText}>
          Tap on a device to connect
        </Text>
        <FlatList
          contentContainerStyle={modalStyle.modalFlatlistContiner}
          data={devices} // devices
          renderItem={renderDeviceModalListItem}  //renderDeviceModalListItem //renderItem={({item}) => <Item title={item.title} />}
        />
        <TouchableOpacity 
          style={modalStyle.modalBackBtn}
          onPress={closeModal}
        >
          <Text style={modalStyle.ctaButtonText}>
            Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const modalStyle = StyleSheet.create({
  modalContainer: {
    //flex: 1,
    backgroundColor: "wheat",
  },
  modalFlatlistContiner: {
    //flex: 1,
    marginTop: 25,
    justifyContent: "center",
  },
  modalCellOutline: {
    borderWidth: 1,
    borderColor: "black",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  modalTitle: {
    flex: 1,
    backgroundColor: "wheat",
  },
  modalTitleText: {
    marginTop: 40,
    fontSize: 30,
    fontWeight: "bold",
    marginHorizontal: 20,
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#ff9e7a",
    justifyContent: "center",
    //alignItems: "center",
    textAlign: "right",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
    paddingLeft: 25,
  },
  ctaButtonText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black",
  },
  scrollView: {
    //backgroundColor: "#2a2e30",
    marginHorizontal: 20,
  },
  modalBackBtn: {
    backgroundColor: "coral",
    justifyContent: "center",
    alignItems: "center",
    height: 55,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
  },
});

export default DeviceModal;
