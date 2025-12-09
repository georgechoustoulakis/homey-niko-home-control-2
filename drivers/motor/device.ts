import { NikoDevice } from '../../src/NikoDevice';
import { DeviceStore } from '../../src/GenericDevicePairingData';

class NikoMotor extends NikoDevice {
  async onInit(): Promise<void> {
    this.device = (this.getStore() as DeviceStore).device;
    await super.onInit();
    this.registerCapabilityListener('windowcoverings_state', this.onStateChange as any);
    await this.updateStatus();
  }

  private onStateChange = async (state: 'up' | 'idle' | 'down') => {
    if (state === 'up') {
      return this.setNikoDeviceProps([{ Action: 'Open' }]);
    }
    if (state === 'down') {
      return this.setNikoDeviceProps([{ Action: 'Close' }]);
    }
    return this.setNikoDeviceProps([{ Action: 'Stop' }]);
  };

  async updateStatus(): Promise<void> {
    const movingProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Moving'),
    );
    await this.setAvailable();
    if (movingProp !== undefined && movingProp.Moving === 'False') {
      await this.setCapabilityValue('windowcoverings_state', 'idle');
    }
  }
}

module.exports = NikoMotor;
