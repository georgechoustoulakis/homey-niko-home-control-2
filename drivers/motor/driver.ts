import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoMotorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    const devices = this.getNikoByTypeAndModel('action', [
      'rolldownshutter',
      'sunblind',
      'gate',
      'venetianblind',
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

module.exports = NikoMotorDriver;
