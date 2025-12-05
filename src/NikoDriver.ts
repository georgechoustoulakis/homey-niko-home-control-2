import Homey from 'homey';
import {
  NikoDevice,
  NikoDeviceWithOwner,
  NikoModel,
  NikoType,
} from '../drivers/connected-controller/NikoMqttClient';
import { ConnectedControllerDevice } from '../drivers/connected-controller/device';

export abstract class NikoDriver extends Homey.Driver {
  protected getNikoDevices(model: NikoModel, type: NikoType): NikoDeviceWithOwner[] {
    const controllerDriver = this.homey.drivers.getDriver('connected_controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];

    if (controllerDevices.length === 0) {
      throw new Error('⚠️ First add a Connected Controller.');
    }

    const allDevices: NikoDeviceWithOwner[] = [];
    for (const controllerDevice of controllerDevices) {
      allDevices.push(...controllerDevice.getNikoDevices(model, type));
    }
    return allDevices;
  }
}
