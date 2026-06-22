import { NikoDevice } from './NikoDevice';
import { NikoDeviceKey } from '../drivers/connected-controller/NikoTypes';

export class OnOffDevice extends NikoDevice<NikoDeviceKey.LIGHT> {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    this.setNikoDeviceProps([{ Status: value ? 'On' : 'Off' }]);
  };

  async updateStatus(): Promise<void> {
    const status = this.getProperty('Status');
    if (status === undefined) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('onoff', status === 'On');
  }
}
