import { NikoDriver } from '../../src/NikoDriver';
import { DevicePairingData } from '../../src/GenericDevicePairingData';

class NikoFourfoldComfortSensorDriver extends NikoDriver {
  async onPairListDevices(): Promise<DevicePairingData[]> {
    return this.getNikoByTypeAndModel('multisensor', [
      'thermoswitchx4feedback',
      'thermoventilationcontrollerfeedback',
    ]);
  }
}

module.exports = NikoFourfoldComfortSensorDriver;
