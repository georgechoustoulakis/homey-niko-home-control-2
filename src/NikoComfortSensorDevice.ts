import { NikoDevice } from './NikoDevice';

export class NikoComfortSensorDevice extends NikoDevice {
  async onInit(): Promise<void> {
    await super.onInit();
    await this.updateStatus();
  }

  async updateStatus(): Promise<void> {
    const tempProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'AmbientTemperature'),
    );
    const humidityProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Humidity'),
    );
    if (!tempProp || !humidityProp) {
      return this.setUnavailable('Something is wrong with the device.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('measure_temperature', Number(tempProp.AmbientTemperature));
    await this.setCapabilityValue('measure_humidity', Number(humidityProp.Humidity));
  }
}
