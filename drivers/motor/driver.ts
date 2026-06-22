import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';
import { MOTOR_ACTION } from '../connected-controller/NikoTypes';

class NikoMotorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getDevicesByAction(MOTOR_ACTION);
  }
}

module.exports = NikoMotorDriver;
