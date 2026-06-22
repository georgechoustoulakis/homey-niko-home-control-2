import { NikoDevice } from '../../src/NikoDevice';
import { NikoDeviceKey } from '../connected-controller/NikoTypes';

class MoodDevice extends NikoDevice<NikoDeviceKey.MOOD> {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    if (value) {
      this.setNikoDeviceProps([{ BasicState: 'Triggered' }]);
    }
  };

  async updateStatus(): Promise<void> {
    const mood = this.getProperty('MoodActive');
    const state = this.getProperty('BasicState');
    if (!mood || !state) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    const isActive = mood === 'True' || state === 'Triggered';
    await this.setCapabilityOptions('onoff', { setable: !isActive });
    await this.setCapabilityValue('onoff', isActive);
    await this.setCapabilityValue('onoff', isActive);
  }
}

module.exports = MoodDevice;
