import { NikoDevice } from './NikoDevice';
import { NikoDeviceKey } from '../drivers/connected-controller/NikoTypes';

export class NikoComfortSensorDevice extends NikoDevice<NikoDeviceKey.THERMO_SWITCH_X1> {
  async onInit(): Promise<void> {
    await super.onInit();
    await this.updateStatus();
  }

  async updateStatus(): Promise<void> {
    const temp = this.getProperty('AmbientTemperature');
    const humidity = this.getProperty('Humidity');
    if (!temp || !humidity) {
      return this.setUnavailable('Something is wrong with the device.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('measure_temperature', Number(temp));
    await this.setCapabilityValue('measure_humidity', Number(humidity));
  }
}
