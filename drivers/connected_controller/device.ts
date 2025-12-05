import Homey from 'homey';
import { ConnectedControllerSettings } from './driver';
import { NikoClientState, NikoDevice, NikoMqttClient } from './NikoMqttClient';

export class ConnectedControllerDevice extends Homey.Device {
  private settings!: ConnectedControllerSettings;
  private client!: NikoMqttClient;

  async onInit() {
    // TODO: Validate reconnection strategy.
    // TODO: IP address change must be detected with re-discovery strategy
    this.settings = this.getSettings();
    this.log('Connected Controller has been initialized with settings:', this.settings);
    void this.connect();
  }

  async onSettings(settings: any): Promise<string | void> {
    this.settings = settings.newSettings;
    if (settings.changedKeys.length > 0) {
      this.log('Device settings changed:', settings.changedKeys);
      await this.connect();
    }
    return await super.onSettings(settings);
  }

  async onUninit() {
    this.log('Connected Controller Device is being uninitialized');
    this.disconnect();
  }

  getNikoDevices(): NikoDevice[] {
    return this.client?.getDevices() ?? [];
  }

  setDeviceStatus(uuid: string, status: 'On' | 'Off'): void {
    this.client?.setDeviceStatus(uuid, status);
  }

  private onMqttStateChange = async (state: NikoClientState, message?: string) => {
    this.log('NikoMqttClient state changed to:', NikoClientState[state]);
    switch (state) {
      case NikoClientState.CONNECTED:
        await this.setAvailable();
        break;
      case NikoClientState.DISCONNECTED:
        await this.setUnavailable('Disconnected from Niko Home Control Controller.');
        break;
      case NikoClientState.ERROR:
        await this.setUnavailable(
          message || 'An unknown error occurred with the Niko Home Control Controller connection.',
        );
        break;
    }
  };

  async connect() {
    this.disconnect();
    const error = this.validDateSettings();
    if (error) {
      this.log('Connection settings are invalid:', error);
      await this.setUnavailable(error);
      return;
    }

    this.client = new NikoMqttClient(this.settings);
    this.client.addListener('statechange', this.onMqttStateChange);
    this.client.connect();
  }

  disconnect() {
    this.client?.disconnect();
    this.log('Disconnected from Niko Home Control Controller.');
  }

  private validDateSettings(): string | undefined {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!this.settings.ip || !ipRegex.test(this.settings.ip)) {
      return "Invalid IP address in the device's settings menu.";
    }
    if (!this.settings.port || isNaN(this.settings.port)) {
      return "Invalid port number in the device's settings menu.";
    }
    if (!this.settings.username || this.settings.username.trim() === '') {
      return "Username cannot be empty in the device's settings menu.";
    }
    if (!this.settings.jwt || this.settings.jwt.trim() === '') {
      return "Please enter the JWT in the device's settings menu.";
    }
    try {
      JSON.parse(Buffer.from(this.settings.jwt.split('.')[1], 'base64').toString());
      // todo validate?
    } catch (e) {
      return "Error parsing JWT. Please enter a valid JWT in the device's settings menu.";
    }
  }
}

module.exports = ConnectedControllerDevice;
