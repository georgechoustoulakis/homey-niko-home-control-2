import Homey from 'homey';
import { NikoDevice } from '../../src/NikoDevice';
import { NikoLightStore } from './driver';

class NikoLight extends NikoDevice {
  private uuid!: string;

  async onInit() {
    const store = this.getStore() as NikoLightStore;
    this.uuid = store.uuid;
    this.registerCapabilityListener('onoff', this.onValueChange);
  }

  private onValueChange = async (value: boolean) => {
    this.log(`The 'onoff' capability value has changed to: ${value}`);
    this.setDeviceStatus(this.uuid, value ? 'On' : 'Off');
  };

  async onAdded() {
    this.log('MyDevice has been added');
  }

  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  async onDeleted() {
    this.log('MyDevice has been deleted');
  }
}

module.exports = NikoLight;
