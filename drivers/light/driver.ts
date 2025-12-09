import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    const devices = this.getNikoDevices(
      ['light', 'socket', 'switched-fan', 'switched-generic'],
      'action',
    );
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
