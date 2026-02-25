import Homey from 'homey';
import { ConnectedControllerSettings } from './driver';
import {
  NikoClientState,
  NikoDeviceWithOwner,
  NikoModel,
  NikoMqttClient,
  NikoType,
} from './NikoMqttClient';
import { clearInterval } from 'node:timers';

export class ConnectedControllerDevice extends Homey.Device {
  private settings!: ConnectedControllerSettings;
  private client!: NikoMqttClient;

  private remainingDaysInterval!: NodeJS.Timeout;

  async onInit() {
    // TODO: Validate reconnection strategy.
    // TODO: IP address change must be detected with re-discovery strategy

    // Add capability if it doesn't exist (for existing devices)
    if (!this.hasCapability('jwt_remaining_days')) {
      await this.addCapability('jwt_remaining_days');
    }

    this.settings = this.getSettings();
    await this.updateJwtRemainingDays();
    await this.connect();
    this.remainingDaysInterval = setInterval(this.updateJwtRemainingDays, 3_600_000);
    await super.onInit();
  }

  async onSettings(settings: any): Promise<string | void> {
    this.settings = settings.newSettings;
    await this.updateJwtRemainingDays();
    if (settings.changedKeys.length > 0) {
      await this.connect();
    }
    return await super.onSettings(settings);
  }

  async onUninit() {
    this.unload();
    return await super.onUninit();
  }

  async connect(): Promise<void> {
    this.disconnect();

    const settingsError = this.checkSettingsForErrors();
    if (settingsError) {
      return await this.setUnavailable(settingsError);
    }

    await this.updateJwtRemainingDays();

    if (this.getCapabilityValue('jwt_remaining_days') < 0) {
      return await this.setUnavailable(
        "The provided JWT has expired. Please enter a valid JWT in the device's settings menu.",
      );
    }

    this.client = new NikoMqttClient({
      settings: this.settings,
      homey: this.homey,
      ownerControllerId: this.getData().id,
    });
    this.client.addListener('statechange', this.onMqttStateChange);
    this.client.connect();
  }

  private checkSettingsForErrors(): string | undefined {
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
  }

  private readonly updateJwtRemainingDays = async () => {
    if (this.settings.jwt === undefined || this.settings.jwt.trim() === '') {
      void this.setCapabilityValue('jwt_remaining_days', 0).catch(this.error);
      return;
    }
    try {
      const jwtPayload = JSON.parse(
        Buffer.from(this.settings.jwt.split('.')[1], 'base64').toString(),
      );

      if (jwtPayload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingSeconds = jwtPayload.exp - currentTime;
        const remainingDays = Math.floor(remainingSeconds / (60 * 60 * 24));
        await this.setCapabilityValue('jwt_remaining_days', remainingDays);
      } else {
        await this.setCapabilityValue('jwt_remaining_days', 0);
      }
    } catch (e) {
      await this.setCapabilityValue('jwt_remaining_days', 0);
    }
  };

  disconnect() {
    this.client?.removeListener('statechange', this.onMqttStateChange);
    this.client?.disconnect();
  }

  unload() {
    clearInterval(this.remainingDaysInterval);
    this.disconnect();
  }

  async onDeleted() {
    this.unload();
    super.onDeleted();
  }

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

}

module.exports = ConnectedControllerDevice;
