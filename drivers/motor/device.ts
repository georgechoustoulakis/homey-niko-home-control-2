import { NikoDevice } from '../../src/NikoDevice';

class NikoMotor extends NikoDevice {
  async onInit(): Promise<void> {
    await super.onInit();
    this.registerCapabilityListener('windowcoverings_state', this.onStateChange as any);

    if (!this.hasCapability('windowcoverings_set')) {
      await this.addCapability('windowcoverings_set');
    }
    this.registerCapabilityListener('windowcoverings_set', this.onSetPosition as any);
    await this.updateStatus();
  }

  private onStateChange = async (state: 'up' | 'idle' | 'down') => {
    if (state === 'up') {
      return this.setNikoDeviceProps([{ Action: 'Open' }]);
    }
    if (state === 'down') {
      return this.setNikoDeviceProps([{ Action: 'Close' }]);
    }
    return this.setNikoDeviceProps([{ Action: 'Stop' }]);
  };

  private onSetPosition = async (position: number) => {
    return this.setNikoDeviceProps([{ Position: String((position * 100).toFixed(0)) }]);
  };

  async updateStatus(): Promise<void> {
    const movingProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Moving'),
    );
    const positionProp = this.device.Properties.find((prop) =>
      Object.prototype.hasOwnProperty.call(prop, 'Position'),
    );
    await this.setAvailable();
    if (movingProp !== undefined && movingProp.Moving === 'False') {
      await this.setCapabilityValue('windowcoverings_state', 'idle');

      // Only set the position after moving is complete, because the sensor is not reporting
      // the correct position during movement.
      if (positionProp !== undefined) {
        await this.setCapabilityValue('windowcoverings_set', Number(positionProp.Position) / 100);
      }
    }
  }
}

module.exports = NikoMotor;
