import { NikoDevice } from '../../src/NikoDevice';
import { NikoDeviceKey } from '../connected-controller/NikoTypes';

class NikoFanDevice extends NikoDevice<NikoDeviceKey.FAN> {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('fan_mode', this.onStateChange);
    await this.updateStatus();
  }

  private onStateChange = async (state: 'Low' | 'Medium' | 'High' | 'Boost') => {
    this.setNikoDeviceProps([{ FanSpeed: state }]);
  };

  async updateStatus(): Promise<void> {
    const fanSpeed = this.getProperty('FanSpeed');
    if (!fanSpeed) {
      return this.setUnavailable('Device received incorrect state. Please report this issue.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('fan_mode', fanSpeed);
  }
}

module.exports = NikoFanDevice;
