import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoAllOffDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('action', ['alloff']);
  }
}

module.exports = NikoAllOffDriver;
