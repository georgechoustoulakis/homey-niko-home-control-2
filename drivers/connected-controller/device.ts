import Homey from 'homey';
import { ConnectedControllerSettings } from './driver';
import {
  NikoClientState,
  NikoDevice,
  NikoDeviceWithOwner,
  NikoModel,
  NikoMqttClient,
  NikoType,
} from './NikoMqttClient';

export class ConnectedControllerDevice extends Homey.Device {
  private settings!: ConnectedControllerSettings;
  private client!: NikoMqttClient;

  async onInit() {
    // TODO: Validate reconnection strategy.
    // TODO: IP address change must be detected with re-discovery strategy
    this.settings = this.getSettings();
    void this.connect();
  }

  async onSettings(settings: any): Promise<string | void> {
    this.settings = settings.newSettings;
    if (settings.changedKeys.length > 0) {
      await this.connect();
    }
    return await super.onSettings(settings);
  }

  async onUninit() {
    this.disconnect();
  }

  getNikoByTypeAndModel(type: NikoType, models: NikoModel[]): NikoDeviceWithOwner[] {
    if (!this.getAvailable()) {
      return [];
    }
    const devices = this.client?.getNikoByTypeAndModel(type, models) ?? [];
    return devices.map((device) => ({
      ...device,
      ownerControllerId: this.getData().id,
    }));
  }

  setDeviceProps(uuid: string, props: Record<string, any>[]): void {
    this.client?.setDeviceProps(uuid, props);
  }

  private onDeviceUpdate = async (device: NikoDevice) => {
    this.homey.emit('nikohomecontrol2.deviceupdate', {
      ...device,
      ownerControllerId: this.getData().id,
    });
  };

  private onMqttStateChange = async (state: NikoClientState, message?: string) => {
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
        setTimeout(() => {
          void this.connect();
        }, 30_000);
        break;
    }
  };

  async connect(): Promise<void> {
    this.disconnect();
    // Validate settings
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!this.settings.ip || !ipRegex.test(this.settings.ip)) {
      return await this.setUnavailable("Invalid IP address in the device's settings menu.");
    }
    if (!this.settings.port || isNaN(this.settings.port)) {
      return await this.setUnavailable("Invalid port number in the device's settings menu.");
    }
    if (!this.settings.username || this.settings.username.trim() === '') {
      return await this.setUnavailable("Username cannot be empty in the device's settings menu.");
    }
    if (!this.settings.jwt || this.settings.jwt.trim() === '') {
      return await this.setUnavailable("Please enter the JWT in the device's settings menu.");
    }
    try {
      JSON.parse(Buffer.from(this.settings.jwt.split('.')[1], 'base64').toString());
      // todo validate?
      // todo check expiration?
      // todo notification before expiration?
    } catch (e) {
      return await this.setUnavailable(
        "Error parsing JWT. Please enter a valid JWT in the device's settings menu.",
      );
    }

    this.client = new NikoMqttClient(this.settings);
    this.client.addListener('statechange', this.onMqttStateChange);
    this.client.addListener('deviceupdate', this.onDeviceUpdate);
    this.client.connect();
  }

  disconnect() {
    this.client?.removeListener('statechange', this.onMqttStateChange);
    this.client?.removeListener('deviceupdate', this.onDeviceUpdate);
    this.client?.disconnect();
  }

  async onDeleted() {
    this.disconnect();
  }
}

module.exports = ConnectedControllerDevice;
