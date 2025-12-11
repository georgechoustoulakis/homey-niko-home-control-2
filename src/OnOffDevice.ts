import { NikoDevice } from './NikoDevice';
import { DeviceStore } from './GenericDevicePairingData';

export class OnOffDevice extends NikoDevice {
  async onInit(): Promise<void> {
    this.device = (this.getStore() as DeviceStore).device;
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    this.setNikoDeviceProps([{ Status: value ? 'On' : 'Off' }]);
  };

  async updateStatus(): Promise<void> {
    const statusProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Status'),
    );
    if (!statusProp) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('onoff', statusProp.Status === 'On');
  }
}
