import Homey from 'homey';
import { NikoDeviceWithOwner } from '../drivers/connected-controller/NikoMqttClient';
import { ConnectedControllerDevice } from '../drivers/connected-controller/device';
import { DevicePairingData } from './GenericDevicePairingData';
import { AllNikoActions } from '../drivers/connected-controller/NikoTypes';

export abstract class NikoDriver extends Homey.Driver {
  protected getDevicesByAction(action: AllNikoActions): DevicePairingData[] {
    const controllerDriver = this.homey.drivers.getDriver('connected-controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];

    if (controllerDevices.length === 0) {
      throw new Error('⚠️ First add a Connected Controller.');
    }

    const allDevices: NikoDeviceWithOwner[] = [];
    for (const controllerDevice of controllerDevices) {
      allDevices.push(...controllerDevice.getNikoByTypeAndModel(action.types, action.models));
    }
    return allDevices.map((nikoDevice) => ({
      name: nikoDevice.Name,
      data: {
        id: nikoDevice.Uuid,
      },
      store: {
        device: nikoDevice,
      },
    }));
  }
}
