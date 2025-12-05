'use strict';

import Homey from 'homey';

module.exports = class NikoHomeControlApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('NikoHomeControlApp has been initialized');
  }
};
