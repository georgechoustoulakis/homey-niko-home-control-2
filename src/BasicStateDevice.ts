import { NikoDevice } from './NikoDevice';
import { DeviceStore } from './GenericDevicePairingData';

export class BasicStateDevice extends NikoDevice {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('onoff', this.onValueChange);
    await this.updateStatus();
  }

  private onValueChange = async (value: boolean) => {
    if (!value) {
      await this.setCapabilityValue('onoff', true);
    }
    this.setNikoDeviceProps([{ BasicState: value ? 'Triggered' : 'Off' }]); // TODO: test this
  };

  async updateStatus(): Promise<void> {
    const stateProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'BasicState'),
    );
    if (!stateProp) {
      return this.setUnavailable('Device is misconfigured, please re-create it.');
    }
    await this.setAvailable();
    const isTriggered = stateProp.BasicState === 'Triggered' || stateProp.BasicState === 'On';
    await this.setCapabilityOptions('onoff', { setable: !isTriggered });
    await this.setCapabilityValue('onoff', isTriggered);
  }
}
