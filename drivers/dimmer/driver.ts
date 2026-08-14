import { DevicePairingData, NikoDriver } from '../../src/NikoDriver';
import { NikoModel, NikoType } from '../connected-controller/NikoTypes';

class NikoDimmerDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction({
      types: NikoType.ACTION,
      models: [NikoModel.DIMMER],
    });
  }
}

module.exports = NikoDimmerDriver;
