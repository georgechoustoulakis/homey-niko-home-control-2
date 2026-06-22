import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { THERMO_SWITCH_X4 } from '../connected-controller/NikoTypes';

class NikoFourfoldComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel(THERMO_SWITCH_X4);
  }
}

module.exports = NikoFourfoldComfortSensorDriver;
