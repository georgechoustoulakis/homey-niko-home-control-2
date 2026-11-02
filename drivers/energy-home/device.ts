import { NikoDevice } from '../../src/NikoDevice';
import { EnergyHomeMqttDevice, NikoProperty } from '../../src/niko/NikoTypes';
import { floorToQuarter, toNikoLocalTime } from '../../src/niko/NikoMeasurements';
import { LivePowerRequester, toWatt } from '../../src/shared/LivePower';

const POLL_INTERVAL_MS = 5 * 60_000;
// Only ask for quarters that ended a while ago, so Niko has logged them completely.
const QUARTER_SETTLE_MS = 5 * 60_000;
// Homey books energy at the moment the total increases, so recovered quarters show up as a spike.
// Up to 3 hours is recovered (a small spike); anything older is skipped, so totals may undercount.
const MAX_CATCH_UP_MS = 3 * 60 * 60_000;
const ENERGY_TOTALS_KEY = 'energyTotals';

type EnergyTotal = { lastQuarterEnd: string; kwh: number };
type EnergyTotals = { imported: EnergyTotal; exported: EnergyTotal };

const TOTALS: { key: keyof EnergyTotals; capability: string; property: NikoProperty }[] = [
  {
    key: 'imported',
    capability: 'meter_power.imported',
    property: NikoProperty.ELECTRICAL_ENERGY_FROM_GRID,
  },
  {
    key: 'exported',
    capability: 'meter_power.exported',
    property: NikoProperty.ELECTRICAL_ENERGY_TO_GRID,
  },
];

class NikoEnergyHomeDevice extends NikoDevice<EnergyHomeMqttDevice> {
  private readonly livePower = new LivePowerRequester(() =>
    this.setNikoDeviceProps([{ [NikoProperty.REPORT_INSTANT_USAGE]: 'True' }]),
  );
  private energyTotalsInterval?: NodeJS.Timeout;
  private energyTotalsStarted = false;

  async onInit(): Promise<void> {
    await super.onInit();
    for (const { capability } of TOTALS) {
      if (!this.hasCapability(capability)) await this.addCapability(capability);
    }
    this.energyTotalsInterval = this.homey.setInterval(
      () => this.updateEnergyTotals().catch(this.error),
      POLL_INTERVAL_MS,
    );
    await this.syncWithController();
  }

  async onUninit(): Promise<void> {
    this.homey.clearInterval(this.energyTotalsInterval);
    await super.onUninit();
  }

  async onDeleted(): Promise<void> {
    this.homey.clearInterval(this.energyTotalsInterval);
  }

  async updateStatus(): Promise<void> {
    await this.setAvailable();
    // At app start the controller connects after the device initializes: start once it is online.
    if (!this.energyTotalsStarted) {
      this.energyTotalsStarted = true;
      this.updateEnergyTotals().catch(this.error);
    }

    const fromGrid = toWatt(this.getProperty(NikoProperty.ELECTRICAL_POWER_FROM_GRID));
    const toGrid = toWatt(this.getProperty(NikoProperty.ELECTRICAL_POWER_TO_GRID));
    if (fromGrid !== undefined || toGrid !== undefined) {
      // Homey expects the home's net power: positive while importing, negative while exporting.
      await this.setCapabilityValue('measure_power', (fromGrid ?? 0) - (toGrid ?? 0));
    }

    const monthlyPeak = toWatt(
      this.getProperty(NikoProperty.ELECTRICAL_MONTHLY_PEAK_POWER_FROM_GRID),
    );
    if (monthlyPeak !== undefined) {
      await this.setCapabilityValue('measure_power.monthly_peak', monthlyPeak);
    }

    this.livePower.onUpdate(this.getProperty(NikoProperty.REPORT_INSTANT_USAGE));
  }

  /**
   * Niko logs energy per quarter-hour and only serves it over REST. The totals are summed here and
   * only ever increase, as Homey Energy requires; they start at 0 when the device is added.
   */
  private async updateEnergyTotals(): Promise<void> {
    const controller = this.getConnectedController();
    if (!controller?.isOnline()) return;

    const timeZone = this.homey.clock.getTimezone();
    const endDate = floorToQuarter(new Date(Date.now() - QUARTER_SETTLE_MS));
    const end = toNikoLocalTime(endDate, timeZone);
    const oldestStart = toNikoLocalTime(new Date(endDate.getTime() - MAX_CATCH_UP_MS), timeZone);
    const totals: EnergyTotals = this.getStoreValue(ENERGY_TOTALS_KEY) ?? {
      imported: { lastQuarterEnd: end, kwh: 0 },
      exported: { lastQuarterEnd: end, kwh: 0 },
    };

    for (const { key, capability, property } of TOTALS) {
      const total = totals[key];
      if (total.lastQuarterEnd < end) {
        const start = total.lastQuarterEnd > oldestStart ? total.lastQuarterEnd : oldestStart;
        const quarters = await controller.fetchQuarterValues(
          this.device.Uuid,
          property,
          start,
          end,
        );
        for (const quarter of quarters) {
          if (quarter.end <= total.lastQuarterEnd) continue;
          total.kwh += quarter.value / 1000;
          total.lastQuarterEnd = quarter.end;
        }
      }
      await this.setCapabilityValue(capability, Math.round(total.kwh * 1000) / 1000);
    }
    await this.setStoreValue(ENERGY_TOTALS_KEY, totals);
  }
}

module.exports = NikoEnergyHomeDevice;
