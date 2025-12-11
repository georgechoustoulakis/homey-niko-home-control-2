import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoMotorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('action', [
      'rolldownshutter',
      'sunblind',
      'gate',
      'venetianblind',
    ]);
  }
}

module.exports = NikoMotorDriver;
