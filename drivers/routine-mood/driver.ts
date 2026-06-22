import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { MOOD_ACTION } from '../connected-controller/NikoTypes';

class NikoMoodDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel(MOOD_ACTION);
  }
}

module.exports = NikoMoodDriver;
