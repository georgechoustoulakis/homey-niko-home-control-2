import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoSixfoldComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('multisensor', ['thermoswitchx6feedback']);
  }
}

module.exports = NikoSixfoldComfortSensorDriver;
