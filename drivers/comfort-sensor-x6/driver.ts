import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { NIKO_ACTIONS, NikoDeviceKey } from '../connected-controller/NikoTypes';

class NikoSixfoldComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(NIKO_ACTIONS[NikoDeviceKey.THERMO_SWITCH_X6]);
  }
}

module.exports = NikoSixfoldComfortSensorDriver;
