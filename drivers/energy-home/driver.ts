import { DevicePairingData, NikoDriver } from '../../src/NikoDriver';
import { NikoModel, NikoType } from '../../src/niko/NikoTypes';

// Niko names this device "energyhome" and the name cannot be changed in the Niko software.
const NIKO_DEFAULT_NAME = 'energyhome';

class NikoEnergyHomeDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction({
      types: NikoType.ENERGY_HOME,
      models: [NikoModel.GENERIC],
    }).map((device) =>
      device.name.trim().toLowerCase() === NIKO_DEFAULT_NAME
        ? { ...device, name: this.homey.__('pair.energyHomeName') }
        : device,
    );
  }
}

module.exports = NikoEnergyHomeDriver;
