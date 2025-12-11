import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('multisensor', [
      'thermoswitchx1',
      'thermoswitchx1feedback',
      'thermoswitchx2feedback',
      'thermoswitchx4feedback',
      'thermoswitchx6feedback',
      'thermoventilationcontrollerfeedback',
    ]);
  }
}

module.exports = NikoComfortSensorDriver;
