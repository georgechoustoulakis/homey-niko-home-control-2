import Homey from 'homey';
import { ConnectedControllerDevice } from '../drivers/connected-controller/device';
import { clearInterval } from 'node:timers';
import { NikoDeviceWithOwner } from '../drivers/connected-controller/NikoMqttClient';
import { DeviceStore } from './GenericDevicePairingData';

export abstract class NikoDevice extends Homey.Device {
  protected device!: NikoDeviceWithOwner;
  private interval!: NodeJS.Timeout;

  async onInit(): Promise<void> {
    await super.onInit();
    this.device = (this.getStore() as DeviceStore).device;
    this.homey.addListener(this.device.Uuid, this.onDeviceUpdate);
    this.interval = setInterval(this.updateDeviceAvailability, 10_000);
  }

  abstract updateStatus(): Promise<void>;

  private onDeviceUpdate = async (updatedDevice: NikoDeviceWithOwner) => {
    if (updatedDevice.Uuid === this.device.Uuid) {
      this.device = updatedDevice;
      await this.updateStatus();
    }
  };

  protected getConnectedController(): ConnectedControllerDevice | undefined {
    const controllerDriver = this.homey.drivers.getDriver('connected-controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];
    for (const controllerDevice of controllerDevices) {
      if (controllerDevice.getData().id === this.device.ownerControllerId) {
        return controllerDevice;
      }
    }
  }

  protected setNikoDeviceProps(props: Record<string, any>[]): void {
    const controller = this.getConnectedController();
    if (controller === undefined) {
      void this.setUnavailable('The Connected Controller no longer found.');
      return;
    }
    try {
      controller.setDeviceProps(this.device.Uuid, props);
    } catch (error: any) {
      void this.setUnavailable(
        'Failed to send command to Niko Home Control Controller. Please check the connection and try again.',
      );
      return;
    }
  }

  onUninit(): Promise<void> {
    this.homey.removeListener(this.device.Uuid, this.onDeviceUpdate);
    clearInterval(this.interval);
    return super.onUninit();
  }

  onDeleted() {
    this.homey.removeListener(this.device.Uuid, this.onDeviceUpdate);
    clearInterval(this.interval);
    super.onDeleted();
  }

  private updateDeviceAvailability = async () => {
    const connectedController = this.getConnectedController();
    const device = connectedController
      ?.getNikoByTypeAndModel(this.device.Type, [this.device.Model])
      .find((d) => d.Uuid === this.device.Uuid);
    if (connectedController === undefined) {
      return this.setUnavailable('The Connected Controller no longer found.');
    } else if (!connectedController.getAvailable()) {
      return this.setUnavailable('The Connected Controller found, but is offline.');
    } else if (device === undefined) {
      return this.setUnavailable(
        'The Connected Controller is available, but the device is not found in the list. Please check the Niko programming software.',
      );
    }
    return this.updateStatus();
  };
}
