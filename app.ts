import Homey from 'homey';

export class NikoHomeControlApp extends Homey.App {
  async onInit() {
    // TODO dont register the same event name for every device
    this.homey.setMaxListeners(Infinity);
  }
}

module.exports = NikoHomeControlApp;
