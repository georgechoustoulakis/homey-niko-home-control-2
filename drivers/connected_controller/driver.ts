import Homey, { DiscoveryResultMDNSSD } from 'homey';
import { GenericDevicePairingData } from '../../src/GenericDevicePairingData';
import { randomUUID } from 'node:crypto';

export interface ConnectedControllerSettings {
  name: string;
  ip: string;
  port: number;
  username: string;
  jwt: string;
}

export interface ConnectedControllerPairingData extends GenericDevicePairingData {
  settings: ConnectedControllerSettings;
}

export class ConnectedControllerDriver extends Homey.Driver {
  async onPairListDevices(): Promise<ConnectedControllerPairingData[]> {
    const discoveryStrategy = this.homey.discovery.getStrategy('niko_home_control');
    const results = discoveryStrategy.getDiscoveryResults() as {
      [x: string]: DiscoveryResultMDNSSD;
    };

    const devicesFound: ConnectedControllerPairingData[] = Object.values(results).map((result) => ({
      name: `Connected Controller (${result.address})`,
      data: {
        id: result.name, // Must be unique, this is how Homey identifies the device.
      },
      settings: {
        name: result.name,
        ip: result.address,
        port: 8884,
        username: 'hobby',
        jwt: '',
      },
    }));
    randomUUID();
    devicesFound.push({
      name: 'Manual Configuration',
      data: {
        id: 'manual_entry_' + randomUUID(),
      },
      settings: {
        name: 'Connected Controller',
        ip: '',
        port: 8884,
        username: 'hobby',
        jwt: '',
      },
    });

    this.log('Devices found during pairing:', devicesFound);
    return devicesFound;
  }
}

module.exports = ConnectedControllerDriver;
