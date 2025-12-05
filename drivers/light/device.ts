import { NikoDevice } from '../../src/NikoDevice';
import { NikoLightStore } from './driver';

class NikoLight extends NikoDevice {
  async onInit(): Promise<void> {
    this.device = (this.getStore() as NikoLightStore).device;
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    this.setNikoDeviceStatus(value ? 'On' : 'Off');
  };

  private async updateStatus(): Promise<void> {
    const statusProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Status'),
    );
    if (!statusProp) {
      console.warn(`Warning: Device "${this.device.Name}" has no 'Status' property.`);
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('onoff', statusProp.Status === 'On');
  }
}

module.exports = NikoLight;
