import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { FAN_ACTION } from '../connected-controller/NikoTypes';

class NikoFanDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel(FAN_ACTION);
  }
}

module.exports = NikoFanDriver;
