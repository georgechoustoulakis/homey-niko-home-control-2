import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoDimmerDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    const devices = this.getNikoByTypeAndModel('action', ['dimmer']);
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

module.exports = NikoDimmerDriver;
