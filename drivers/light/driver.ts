import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('action', [
      'light',
      'socket',
      'switched-fan',
      'switched-generic',
    ]);
  }
}

module.exports = NikoLightDriver;
