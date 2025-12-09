import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    const devices = this.getNikoDevices(['light'], 'action');
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
