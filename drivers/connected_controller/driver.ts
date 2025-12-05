import Homey, { DiscoveryResultMDNSSD } from 'homey';
import { GenericDevicePairingData } from '../../src/Utils';

export interface ConnectedControllerSettings {
  name: string;
  ip: string;
  port: number;
  username: string;
  jwt: string | undefined;
}

export interface ConnectedControllerPairingData extends GenericDevicePairingData {
  name: string;
  data: {
    id: string;
  };
  settings: ConnectedControllerSettings;
}

class ConnectedControllerDriver extends Homey.Driver {
  async onPairListDevices(): Promise<ConnectedControllerPairingData[]> {
    const discoveryStrategy = this.homey.discovery.getStrategy('niko_home_control');
    const results = discoveryStrategy.getDiscoveryResults() as {
      [x: string]: DiscoveryResultMDNSSD;
    };

    const devicesFound: ConnectedControllerPairingData[] = Object.values(results).map((result) => ({
      name: `NHC2 ${result.name}`,
      data: {
        id: result.name, // Must be unique, this is how Homey identifies the device.
      },
      settings: {
        name: result.name,
        ip: result.address,
        port: 8884,
        username: 'hobby',
        jwt: undefined,
      },
    }));
    this.log('Devices found during pairing:', devicesFound);
    return devicesFound;
  }
}

module.exports = ConnectedControllerDriver;
