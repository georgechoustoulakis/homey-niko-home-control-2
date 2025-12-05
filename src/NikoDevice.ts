import Homey from 'homey';
import { ConnectedControllerDevice } from '../drivers/connected_controller/device';
import { clearInterval } from 'node:timers';
import { NikoDeviceWithOwner } from '../drivers/connected_controller/NikoMqttClient';

export abstract class NikoDevice extends Homey.Device {
  protected device!: NikoDeviceWithOwner;
  private interval!: NodeJS.Timeout;

  async onInit(): Promise<void> {
    await super.onInit();
    this.homey.addListener('nikohomecontrol2.deviceupdate', this.onDeviceUpdate);
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
    const controllerDriver = this.homey.drivers.getDriver('connected_controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];
    for (const controllerDevice of controllerDevices) {
      if (controllerDevice.getData().id === this.device.ownerControllerId) {
        return controllerDevice;
      }
    }
  }

  protected setNikoDeviceStatus(status: 'On' | 'Off'): { error?: string } | void {
    const controller = this.getConnectedController();
    if (controller === undefined) {
      return {
        error:
          '⚠️ The Connected Controller device is not found. Please add a Connected Controller first.',
      };
    }
    controller.setDeviceStatus(this.device.Uuid, status);
  }

  onUninit(): Promise<void> {
    clearInterval(this.interval);
    return super.onUninit();
  }

  private updateDeviceAvailability = async () => {
    const connectedController = this.getConnectedController();
    const device = connectedController
      ?.getNikoDevices(this.device.Model, this.device.Type)
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
    this.device = device;
    return this.updateStatus();
  };
}
