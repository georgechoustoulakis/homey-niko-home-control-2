import { NikoDevice } from '../../src/NikoDevice';
import { DeviceStore } from '../../src/GenericDevicePairingData';

class NikoLight extends NikoDevice {
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

module.exports = NikoLight;
