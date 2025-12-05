import Homey from 'homey';
import { ConnectedControllerSettings } from './driver';

class ConnectedControllerDevice extends Homey.Device {
  async onInit() {
    const settings = this.getSettings() as ConnectedControllerSettings;
    this.log('Connected Controller Device settings:', settings);
  }
}

module.exports = ConnectedControllerDevice;
