import { NikoDevice } from '../../src/NikoDevice';

class NikoFanDevice extends NikoDevice {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('fan_mode', this.onStateChange as any);
    await this.updateStatus();
  }

  private onStateChange = async (state: 'up' | 'idle' | 'down') => {
    this.setNikoDeviceProps([{ FanSpeed: state }]);
  };

  async updateStatus(): Promise<void> {
    const fanSpeed = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'FanSpeed'),
    );
    if (!fanSpeed) {
      return this.setUnavailable('Device received incorrect state. Please report this issue.');
    }
    await this.setAvailable();
    await this.setCapabilityValue('fan_mode', fanSpeed.FanSpeed);
  }
}

module.exports = NikoFanDevice;
