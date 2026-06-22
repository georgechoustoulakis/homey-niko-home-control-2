import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { THERMO_SWITCH_X6 } from '../connected-controller/NikoTypes';

class NikoSixfoldComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(THERMO_SWITCH_X6);
  }
}

module.exports = NikoSixfoldComfortSensorDriver;
