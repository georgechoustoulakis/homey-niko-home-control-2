import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoDimmerDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('action', ['dimmer']);
  }
}

module.exports = NikoDimmerDriver;
