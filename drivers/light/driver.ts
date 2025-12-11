import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    const devices = this.getNikoByTypeAndModel('action', [
      'light',
      'socket',
      'switched-fan',
      'switched-generic',
    ]);
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
