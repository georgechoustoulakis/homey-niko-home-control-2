import { NikoDevice } from '../../src/NikoDevice';
import { NikoProperty, ThermoMqttDevice } from '../connected-controller/NikoTypes';

export class NikoComfortSensorDevice extends NikoDevice<ThermoMqttDevice> {
  async onInit(): Promise<void> {
    await super.onInit();
    await this.updateStatus();
  }

  async updateStatus(): Promise<void> {
    const temp = this.getProperty(NikoProperty.AMBIENT_TEMPERATURE);
    const humidity = this.getProperty(NikoProperty.HUMIDITY);
    if (!temp || !humidity) {
      return this.setUnavailable('Something is wrong with the device.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('measure_temperature', Number(temp));
    await this.setCapabilityValue('measure_humidity', Number(humidity));
  }
}

module.exports = NikoComfortSensorDevice;
