import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoSingleComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('multisensor', ['thermoswitchx1', 'thermoswitchx1feedback']);
  }
}

module.exports = NikoSingleComfortSensorDriver;
