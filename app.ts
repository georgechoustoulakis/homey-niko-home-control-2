import Homey from 'homey';

export class NikoHomeControlApp extends Homey.App {
  async onInit() {
    this.log('NikoHomeControlApp has been initialized');
  }
}

module.exports = NikoHomeControlApp;
