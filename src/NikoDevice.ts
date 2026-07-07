import Homey from 'homey';
import { ConnectedControllerDevice } from '../drivers/connected-controller/device';
import { clearInterval } from 'node:timers';
import { NikoDeviceWithOwner } from '../drivers/connected-controller/NikoMqttClient';
import { DeviceStore } from './GenericDevicePairingData';
import { NikoDeviceKey, NikoPayloadRegistry } from '../drivers/connected-controller/NikoTypes';

type KeysOfUnion<T> = T extends T ? keyof T : never;
type ValueOfKeyInUnion<T, K extends PropertyKey> = T extends Record<K, infer V> ? V : never;
type PayloadProps<K extends NikoDeviceKey> = NikoPayloadRegistry[K]['Properties'][number];

export abstract class NikoDevice<K extends NikoDeviceKey> extends Homey.Device {
  private _device!: NikoDeviceWithOwner; // TODO merge NikoDeviceWithOwner with Payload?
  private interval!: NodeJS.Timeout;

  async onInit(): Promise<void> {
    await super.onInit();
    this._device = (this.getStore() as DeviceStore).device;
    this.homey.addListener(this._device.Uuid, this.onDeviceUpdate);
    this.interval = this.homey.setInterval(this.updateDeviceAvailability, 30_000);
  }

  abstract updateStatus(): Promise<void>;

  get device(): NikoPayloadRegistry[K] {
    return this._device as unknown as NikoPayloadRegistry[K];
  }

  protected getProperty<TKey extends KeysOfUnion<PayloadProps<K>>>(
    key: TKey,
  ): ValueOfKeyInUnion<PayloadProps<K>, TKey> | undefined {
    const properties = this.device.Properties;

    if (!Array.isArray(properties)) {
      return undefined;
    }

    const statusProp = properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, key),
    );

    return statusProp
      ? ((statusProp as Record<string, any>)[key as string] as ValueOfKeyInUnion<
          PayloadProps<K>,
          TKey
        >)
      : undefined;
  }

  private onDeviceUpdate = async (updatedDevice: NikoDeviceWithOwner) => {
    this._device = updatedDevice;
    await this.updateStatus();
  };

  protected getConnectedController(): ConnectedControllerDevice | undefined {
    const controllerDriver = this.homey.drivers.getDriver('connected-controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];
    for (const controllerDevice of controllerDevices) {
      if (controllerDevice.getData().id === this._device.ownerControllerId) {
        return controllerDevice;
      }
    }
  }

  protected setNikoDeviceProps(
    props: Partial<NikoPayloadRegistry[K]['Properties'][number]>[],
  ): void {
    const controller = this.getConnectedController();
    if (controller === undefined) {
      void this.setUnavailable('The Connected Controller no longer found.');
      return;
    }
    try {
      controller.setDeviceProps(this._device.Uuid, props);
    } catch (error: any) {
      void this.setUnavailable(
        'Failed to send command to Niko Home Control Controller. Please check the connection and try again.',
      );
      return;
    }
  }

  onUninit(): Promise<void> {
    this.homey.removeListener(this._device.Uuid, this.onDeviceUpdate);
    clearInterval(this.interval);
    return super.onUninit();
  }

  onDeleted() {
    this.homey.removeListener(this._device.Uuid, this.onDeviceUpdate);
    clearInterval(this.interval);
    super.onDeleted();
  }

  private updateDeviceAvailability = async () => {
    const connectedController = this.getConnectedController();
    if (connectedController === undefined) {
      return this.setUnavailable('The Connected Controller no longer found.');
    } else if (!connectedController.getAvailable()) {
      return this.setUnavailable('The Connected Controller found, but is offline.');
    }
    const device = connectedController
      .getNikoByTypeAndModel(this._device.Type, [this._device.Model])
      .find((d) => d.Uuid === this._device.Uuid);
    if (device === undefined) {
      return this.setUnavailable(
        'The Connected Controller is available, but the device is not found in the list. Please check the Niko programming software.',
      );
    }
    return this.updateStatus();
  };
}
