import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { DIMMER_ACTION } from '../connected-controller/NikoTypes';

class NikoDimmerDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(DIMMER_ACTION);
  }
}

module.exports = NikoDimmerDriver;
