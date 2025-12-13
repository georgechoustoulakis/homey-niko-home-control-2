import { connect, IClientOptions, MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import { ConnectedControllerSettings } from './driver';
import Homey from 'homey/lib/Homey';
import { Device } from 'homey';

const NIKO_MODELS = [
  'light',
  'socket',
  'switched-fan',
  'switched-generic',
  'dimmer',
  'rolldownshutter',
  'sunblind',
  'gate',
  'venetianblind',
  'alloff',
  'generic',
  'flag',
  'thermoswitchx1',
  'thermoswitchx1feedback',
  'thermoswitchx2feedback',
  'thermoswitchx4feedback',
  'thermoswitchx6feedback',
  'thermoventilationcontrollerfeedback',
  'overallcomfort',
] as const;

const NIKO_TYPES = ['relay', 'dimmer', 'motor', 'action', 'energyhome', 'multisensor'] as const;

export type NikoType = (typeof NIKO_TYPES)[number];
export type NikoModel = (typeof NIKO_MODELS)[number];

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

type DeviceListUpdate = {
  Method: 'devices.control';
  Params: [
    {
      Devices: DeviceUpdate[];
    },
  ];
};

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

type QueuedUpdate = { uuid: string; props: Record<string, any>[] };
const UPDATE_QUEUE_DELAY_MS = 50;

export class NikoMqttClient extends EventEmitter {
  private readonly settings: ConnectedControllerSettings;
  private readonly homey: Homey;
  private readonly ownerControllerId: string;

  private client: MqttClient | null = null;
  private _state: NikoClientState = NikoClientState.UNINITIALIZED;
  private _updateInterval: any | undefined = undefined;

  private queuedUpdates: QueuedUpdate[] = [];
  private batchTimeout: any | undefined = undefined;

  private devices: NikoDevice[] = [];

  constructor(config: {
    settings: ConnectedControllerSettings;
    homey: Device.Homey;
    ownerControllerId: string;
  }) {
    super();
    const { settings, homey, ownerControllerId } = config;
    this.homey = homey;
    this.ownerControllerId = ownerControllerId;
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
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
    this._updateInterval = setInterval(this.requestDeviceList, 15 * 60_000);
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
    if (!this.client || !this.client.connected) return;
    const payload = JSON.stringify({ Method: 'devices.list' });
    this.client.publish(TOPIC.CMD, payload);
  }

  public getNikoByTypeAndModel(type: NikoType, models: NikoModel[]): NikoDevice[] {
    return this.devices.filter((device) => device.Type === type && models.includes(device.Model));
  }

  public async setDeviceProps(uuid: string, props: Record<string, any>[]): Promise<void> {
    if (!this.client || this.state !== NikoClientState.CONNECTED) {
      throw new Error('Not connected');
    }
    if (DEBUG_MQTT) {
      console.log(`Queueing device ${uuid} properties update:`, props);
    }
    this.queuedUpdates.push({ uuid, props });
    this.sendBatchedUpdate();
  }

  private sendBatchedUpdate = (): void => {
    if (!this.client || this.state !== NikoClientState.CONNECTED) {
      this.queuedUpdates = [];
      return;
    }

    if (this.batchTimeout) {
      return;
    }

    if (this.queuedUpdates.length === 0) {
      return;
    }
    this.batchTimeout = setTimeout(() => {
      const payload: DeviceListUpdate = {
        Method: 'devices.control',
        Params: [
          {
            Devices: [],
          },
        ],
      };

      for (const update of this.queuedUpdates) {
        payload.Params[0].Devices.push({
          Uuid: update.uuid,
          Properties: update.props,
        });
      }
      this.queuedUpdates = [];

      if (DEBUG_MQTT) {
        console.log(`Sending batched ${payload.Params[0].Devices.length} device updates`);
      }

      this.client?.publish(TOPIC.CMD, JSON.stringify(payload));
      this.batchTimeout = undefined;
      this.sendBatchedUpdate();
    }, UPDATE_QUEUE_DELAY_MS);
  };

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
          if (DEBUG_MQTT) {
            console.log(
              `Device loaded: ${device.Name} (${device.Uuid}), ${device.Type}, ${device.Model}, Properties:`,
              device.Properties,
            );
          }
          this.sendUpdate(device);
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
            if (DEBUG_MQTT) {
              console.warn(`Warning: Received update for unknown device UUID: ${uuid}`);
            }
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

          this.sendUpdate(device);
        });
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  };

  private sendUpdate(device: NikoDevice): void {
    if (
      !device.Uuid ||
      NIKO_TYPES.indexOf(device.Type) === -1 ||
      NIKO_MODELS.indexOf(device.Model) === -1
    ) {
      if (DEBUG_MQTT) {
        console.log(
          `Skipping unsupported device ${device.Name} (${device.Uuid}), ${device.Type}, ${device.Model}`,
        );
      }
      return;
    }
    if (DEBUG_MQTT) {
      console.log(`Emitting device update for ${device.Name} (${device.Uuid})`);
    }
    const deviceWithOwner: NikoDeviceWithOwner = {
      ...device,
      ownerControllerId: this.ownerControllerId,
    };
    this.homey.emit(device.Uuid, deviceWithOwner);
  }

  public disconnect(): void {
    if (this.client) {
      this.setState(NikoClientState.DISCONNECTING);
      this.client.end(true);
    }
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = undefined;
    }
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }
    this.queuedUpdates = [];
  }
}
