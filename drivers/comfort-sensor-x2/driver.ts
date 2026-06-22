import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { THERMO_SWITCH_X2 } from '../connected-controller/NikoTypes';

class NikoDoubleComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(THERMO_SWITCH_X2);
  }
}

module.exports = NikoDoubleComfortSensorDriver;
