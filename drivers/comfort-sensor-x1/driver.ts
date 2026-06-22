import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { THERMO_SWITCH_X1 } from '../connected-controller/NikoTypes';

class NikoSingleComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(THERMO_SWITCH_X1);
  }
}

module.exports = NikoSingleComfortSensorDriver;
