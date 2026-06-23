import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { NIKO_ACTIONS, NikoDeviceKey } from '../connected-controller/NikoTypes';

class NikoLightDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return super.getDevicesByAction(NIKO_ACTIONS[NikoDeviceKey.LIGHT]);
  }
}

module.exports = NikoLightDriver;
