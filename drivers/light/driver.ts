import { NikoDriver } from '../../src/NikoDriver';
import { GenericDevicePairingData } from '../../src/GenericDevicePairingData';
import { NikoDeviceWithOwner } from '../connected-controller/NikoMqttClient';

export interface NikoLightStore {
  device: NikoDeviceWithOwner;
}

export interface NikoLightPairingData extends GenericDevicePairingData {
  store: NikoLightStore;
}

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<NikoLightPairingData[]> {
    const devices = this.getNikoDevices('light', 'action');
    return devices.map((nikoDevice) => ({
      name: nikoDevice.Name,
      data: {
        id: nikoDevice.Uuid,
      },
      store: {
        device: nikoDevice,
      },
    }));
  }
}

module.exports = NikoLightDriver;
