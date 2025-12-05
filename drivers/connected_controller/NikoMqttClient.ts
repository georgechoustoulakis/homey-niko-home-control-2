import { connect, MqttClient, IClientOptions } from 'mqtt';
import { EventEmitter } from 'events';
import { ConnectedControllerSettings } from './driver';

export interface NikoDevice {
  Uuid: string;
  Name: string;
  Model: string;
  Type: string;
  Properties: Record<string, any>; // e.g. { Status: "On", Brightness: "100" }
  Online: string; // 'True' or 'False'
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

  private devices: Map<string, NikoDevice> = new Map();

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
    console.log('Niko MQTT Client Error:', err.message);

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

  public getDevices(): NikoDevice[] {
    return Array.from(this.devices.values());
  }

  public getDevice(uuid: string): NikoDevice | undefined {
    return this.devices.get(uuid);
  }

  public async setDeviceStatus(
    uuid: string,
    status: 'On' | 'Off',
    brightness?: number,
  ): Promise<void> {
    if (!this.client || this.state !== NikoClientState.CONNECTED) {
      throw new Error('Not connected');
    }

    const properties: any = { Status: status };
    if (brightness !== undefined) {
      properties.Brightness = String(brightness);
    }

    const payload = {
      Method: 'devices.control',
      Params: [
        {
          Devices: [
            {
              Uuid: uuid,
              Properties: [properties],
            },
          ],
        },
      ],
    };

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

        this.devices.clear();
        receivedDevices.forEach((dev) => {
          this.devices.set(dev.Uuid, dev);
        });

        console.log(`Niko MQTT client found ${this.devices.size} devices.`);
        this.setState(NikoClientState.CONNECTED);
      }

      if (topic === TOPIC.EVT && payload.Method === 'devices.status') {
        const updates = payload.Params?.[0]?.Devices || [];

        updates.forEach((update: any) => {
          const uuid = update.Uuid;
          const newProps = update.Properties?.[0];

          if (this.devices.has(uuid) && newProps) {
            const cachedDevice = this.devices.get(uuid)!;
            cachedDevice.Properties = { ...cachedDevice.Properties, ...newProps };
            this.devices.set(uuid, cachedDevice);

            this.emit('deviceupdate', { uuid, properties: newProps });
          }
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
