import { NikoDeviceWithOwner } from '../drivers/connected-controller/NikoMqttClient';

export interface GenericDevicePairingData {
  name: string;
  data: {
    id: string;
  };
}

export interface DevicePairingData extends GenericDevicePairingData {
  store: DeviceStore;
}

export interface DeviceStore {
  device: NikoDeviceWithOwner;
}
