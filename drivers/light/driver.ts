import { NikoDriver } from '../../src/NikoDriver';
import { GenericDevicePairingData } from '../../src/GenericDevicePairingData';

export interface NikoLightStore {
  uuid: string;
}

export interface NikoLightPairingData extends GenericDevicePairingData {
  store: NikoLightStore;
}

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<NikoLightPairingData[]> {
    const devices = this.getNikoDevicesByModel('light');
    return devices.map((nikoDevice) => ({
      name: nikoDevice.Name,
      data: {
        id: nikoDevice.Uuid,
      },
      store: {
        uuid: nikoDevice.Uuid,
      },
    }));
  }
}

module.exports = NikoLightDriver;
