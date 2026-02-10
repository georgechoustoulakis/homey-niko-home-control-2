import { NikoDevice } from '../../src/NikoDevice';

class AllOffDevice extends NikoDevice {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    this.setNikoDeviceProps([{ BasicState: 'Triggered' }]);
  };

  async updateStatus(): Promise<void> {
    const allActiveProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'AllOffActive'),
    );
    const basicStateProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'BasicState'),
    );
    if (!allActiveProp || !basicStateProp) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    const isActive =
      allActiveProp.AllOffActive === 'True' || basicStateProp.BasicState === 'Triggered';
    await this.setCapabilityOptions('onoff', { setable: !isActive });
    await this.setCapabilityValue('onoff', isActive);
  }
}

module.exports = AllOffDevice;
