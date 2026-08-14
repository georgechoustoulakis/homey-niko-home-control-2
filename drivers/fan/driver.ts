import { DevicePairingData, NikoDriver } from '../../src/NikoDriver';
import { NikoModel, NikoType } from '../connected-controller/NikoTypes';

class NikoFanDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction({
      types: NikoType.ACTION,
      models: [NikoModel.FAN],
    });
  }
}

module.exports = NikoFanDriver;
