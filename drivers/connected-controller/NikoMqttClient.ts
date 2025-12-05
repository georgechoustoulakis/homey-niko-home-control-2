import { connect, IClientOptions, MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import { ConnectedControllerSettings } from './driver';

export type NikoModel = 'light' | 'dimmer' | 'sunblind' | 'alloff' | 'generic';
export type NikoType = 'relay' | 'dimmer' | 'motor' | 'action' | 'energyhome';

export interface NikoDeviceWithOwner extends NikoDevice {
  ownerControllerId: string;
}

const DEBUG_MQTT = false;

export interface NikoDevice {
  Uuid: string;
  Name: string;
  Model: NikoModel;
  Technology: 'nikohomecontrol' | string;
  Type: NikoType;
  Properties: Record<string, any>[]; // e.g. [{ Status: 'On' }]
  PropertyDefinitions: any; // TODO
  Online: 'True' | 'False'; // 'True' or 'False'
}

interface DeviceUpdate {
  Uuid: string;
  Properties: Record<string, any>[];
}

export enum TOPIC {
  CMD = 'hobby/control/devices/cmd',
  EVT = 'hobby/control/devices/evt',
  RSP = 'hobby/control/devices/rsp',
}

export enum NikoClientState {
  UNINITIALIZED,
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  DISCONNECTING,
  ERROR,
}

export class NikoMqttClient extends EventEmitter {
  private client: MqttClient | null = null;
  private readonly settings: ConnectedControllerSettings;
  private _state: NikoClientState = NikoClientState.UNINITIALIZED;

  private devices: NikoDevice[] = [];

  constructor(settings: ConnectedControllerSettings) {
    super();
    this.settings = settings;
  }

  private setState(newState: NikoClientState, message?: string) {
    if (this._state === newState) return;
    this._state = newState;
    this.emit('statechange', this._state, message);
  }

  get state(): NikoClientState {
    return this._state;
  }

  public connect(): void {
    if (this._state === NikoClientState.CONNECTING || this._state === NikoClientState.CONNECTED) {
      return;
    }
    this.setState(NikoClientState.CONNECTING);

    const options: IClientOptions = {
      username: this.settings.username,
      password: this.settings.jwt,
      rejectUnauthorized: false,
      reconnectPeriod: 10000,
      connectTimeout: 10000,
      protocol: 'mqtts',
    };

    this.client = connect(`mqtts://${this.settings.ip}:${this.settings.port}`, options);
    this.client.on('connect', this.onConnect);
    this.client.on('error', this.onError);
    this.client.on('close', this.onClose);
    this.client.on('message', this.handleMessage);
  }

  private onConnect = (): void => {
    this.subscribeTopics();
    this.requestDeviceList();
  };

  private onError = (err: Error): void => {
    if (DEBUG_MQTT) {
      console.log('Niko MQTT Client Error:', err.message);
    }

    // Check for non-recoverable authorization errors
    if (
      err.message.includes('Not authorized') ||
      err.message.includes('Bad user name or password')
    ) {
      this.setState(
        NikoClientState.ERROR,
        "Authorization failed. Please check the token in the device's settings.",
      );
      this.client?.end(true);
    } else {
      // For other errors (e.g., timeout, network issues),
      // the client will attempt to reconnect automatically.
      this.setState(NikoClientState.ERROR, err.message);
    }
  };

  private onClose = (): void => {
    if (this.state !== NikoClientState.ERROR) {
      this.setState(NikoClientState.DISCONNECTED);
    }
  };

  private subscribeTopics(): void {
    if (!this.client) return;
    this.client.subscribe(TOPIC.EVT);
    this.client.subscribe(TOPIC.RSP);
  }

  private requestDeviceList(): void {
    if (!this.client) return;
    const payload = JSON.stringify({ Method: 'devices.list' });
    this.client.publish(TOPIC.CMD, payload);
  }

  public getNikoDevices(model: NikoModel, type: NikoType): NikoDevice[] {
    return this.devices.filter((device) => device.Model === model && device.Type === type);
  }

  public async setDeviceProps(uuid: string, props: Record<string, any>[]): Promise<void> {
    if (!this.client || this.state !== NikoClientState.CONNECTED) {
      throw new Error('Not connected');
    }

    const payload = {
      Method: 'devices.control',
      Params: [
        {
          Devices: [
            {
              Uuid: uuid,
              Properties: props,
            },
          ],
        },
      ],
    };
    if (DEBUG_MQTT) {
      console.log(`Setting device ${uuid} status to`, props);
    }
    return new Promise((resolve, reject) => {
      this.client?.publish(TOPIC.CMD, JSON.stringify(payload), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private handleMessage = (topic: string, message: Buffer): void => {
    try {
      const payload = JSON.parse(message.toString());

      if (topic === TOPIC.RSP && payload.Method === 'devices.list') {
        const receivedDevices: NikoDevice[] = payload.Params?.[0]?.Devices || [];
        this.devices.length = 0;
        this.devices.push(...receivedDevices);
        if (DEBUG_MQTT) {
          console.log(`Niko MQTT client found ${this.devices.length} devices.`);
        }
        if (this.state !== NikoClientState.CONNECTED) {
          this.setState(NikoClientState.CONNECTED);
        }
        for (const device of this.devices) {
          this.emit('deviceupdate', device);
        }
      }

      if (topic === TOPIC.EVT && payload.Method === 'devices.status') {
        const updates: DeviceUpdate[] = payload.Params?.[0]?.Devices || [];

        updates.forEach((update: DeviceUpdate) => {
          const uuid = update.Uuid;
          const changedProps = update.Properties;
          if (DEBUG_MQTT) {
            console.log(`Device ${uuid} properties update:`, changedProps);
          }
          const device = this.devices.find((d) => d.Uuid === uuid);
          if (!device) {
            console.warn(`Warning: Received update for unknown device UUID: ${uuid}`);
            return;
          }

          if (device.Properties.length === update.Properties.length) {
            // shortcut
            device.Properties = changedProps;
          } else {
            for (const prop of changedProps) {
              const propKey = Object.keys(prop)[0];
              const existingProp = device.Properties.find((p) =>
                Object.prototype.hasOwnProperty.call(p, propKey),
              );
              if (existingProp) {
                existingProp[propKey] = prop[propKey];
              } else {
                device.Properties.push(prop);
              }
            }
          }

          this.emit('deviceupdate', device);
        });
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  };

  public disconnect(): void {
    if (this.client) {
      this.setState(NikoClientState.DISCONNECTING);
      this.client.end(true);
    }
  }
}
