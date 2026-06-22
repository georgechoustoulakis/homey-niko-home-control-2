import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { ALL_OFF_ACTION } from '../connected-controller/NikoTypes';

class NikoAllOffDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(ALL_OFF_ACTION);
  }
}

module.exports = NikoAllOffDriver;
