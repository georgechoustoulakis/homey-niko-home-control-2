import Homey from 'homey';
import { ConnectedControllerDevice } from '../drivers/connected_controller/device';

export class NikoDevice extends Homey.Device {
  onInit(): Promise<void> {
    return super.onInit();
  }

  // abstract onUpdate: () => void;

  protected setDeviceStatus(uuid: string, status: 'On' | 'Off'): void {
    const controllerDriver = this.homey.drivers.getDriver('connected_controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];

    for (const controllerDevice of controllerDevices) {
      controllerDevice.setDeviceStatus(uuid, status);
    }
  }
}
