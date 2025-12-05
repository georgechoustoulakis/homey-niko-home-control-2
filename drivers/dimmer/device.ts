import { NikoDevice } from '../../src/NikoDevice';
import { DeviceStore } from '../../src/GenericDevicePairingData';

class NikoDimmer extends NikoDevice {
  async onInit(): Promise<void> {
    this.device = (this.getStore() as DeviceStore).device;
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    this.registerCapabilityListener('dim', this.onDimValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    this.setNikoDeviceProps([{ Status: value ? 'On' : 'Off' }]);
  };

  private onDimValueChange = async (value: number) => {
    this.setNikoDeviceProps([{ Brightness: String((value * 100).toFixed(0)) }]);
  };

  async updateStatus(): Promise<void> {
    const statusProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Status'),
    );
    const brightnessProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Brightness'),
    );
    if (!statusProp || !brightnessProp) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('onoff', statusProp.Status === 'On');
    await this.setCapabilityValue('dim', Number(brightnessProp.Brightness) / 100);
  }
}

module.exports = NikoDimmer;
