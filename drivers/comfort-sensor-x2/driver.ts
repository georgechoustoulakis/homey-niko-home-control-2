import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoDoubleComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('multisensor', ['thermoswitchx2feedback']);
  }
}

module.exports = NikoDoubleComfortSensorDriver;
