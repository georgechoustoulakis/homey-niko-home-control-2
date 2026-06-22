import { NikoDevice } from '../../src/NikoDevice';
import { NikoDeviceKey } from '../connected-controller/NikoTypes';

class NikoDimmer extends NikoDevice<NikoDeviceKey.DIMMER> {
  async onInit(): Promise<void> {
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
    const status = this.getProperty('Status');
    const brightness = this.getProperty('Brightness');

    if (!status || !brightness) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('onoff', status === 'On');
    await this.setCapabilityValue('dim', Number(brightness) / 100);
  }
}

module.exports = NikoDimmer;
