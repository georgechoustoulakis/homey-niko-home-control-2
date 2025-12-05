import Homey from 'homey';
import { NikoDevice } from '../drivers/connected_controller/NikoMqttClient';
import { ConnectedControllerDevice } from '../drivers/connected_controller/device';

export class NikoDriver extends Homey.Driver {
  protected getNikoDevicesByModel(type: string): NikoDevice[] {
    const controllerDriver = this.homey.drivers.getDriver('connected_controller');
    const controllerDevices = controllerDriver.getDevices() as ConnectedControllerDevice[];

    if (controllerDevices.length === 0) {
      throw new Error('⚠️ First add a Connected Controller.');
    }

    const allNikoDevices = controllerDevices.flatMap((controllerDevice) =>
      controllerDevice.getNikoDevices(),
    );
    console.log(allNikoDevices);

    return allNikoDevices.filter((nikoDevice) => nikoDevice.Model === type);
  }
}
