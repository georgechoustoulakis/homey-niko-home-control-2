import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { LIGHT_ACTION } from '../connected-controller/NikoTypes';

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return super.getDevicesByAction(LIGHT_ACTION);
  }
}

module.exports = NikoLightDriver;
