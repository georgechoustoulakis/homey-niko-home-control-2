import { NikoDeviceKey } from '../connected-controller/NikoTypes';
import { NikoDevice } from '../../src/NikoDevice';

export class NikoLightDevice extends NikoDevice<NikoDeviceKey.RELAY> {
  async onInit(): Promise<void> {
    await super.onInit();
    await this.updateDeviceClassIfNeeded();
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

  private async updateDeviceClassIfNeeded(): Promise<void> {
    if (this.rawDevice.Model === 'light' && this.getClass() !== 'light') {
      await this.setClass('light');
    } else {
      // Users can select through the UI what device type is plugged in.
      await this.setClass('socket');
    }
  }
}

module.exports = NikoLightDevice;
