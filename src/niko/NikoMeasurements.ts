import https from 'node:https';
import { NikoConnectionSettings } from './NikoMqttClient';

const QUARTER_MS = 15 * 60_000;
const REQUEST_TIMEOUT_MS = 15_000;

/** One quarter-hour of logged energy, labelled with its end time in the controller's local time. */
export type NikoQuarterValue = { end: string; value: number };

// The REST API takes and returns local time without offset ("2026-10-31T21:45:00"), so these
// strings compare chronologically. Edge case: the repeated hour when DST ends has duplicate labels.
export function toNikoLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .replace(' ', 'T');
}

/** The API rejects interval starts that are not on a quarter-hour. */
export function floorToQuarter(date: Date): Date {
  return new Date(Math.floor(date.getTime() / QUARTER_MS) * QUARTER_MS);
}

/** Raw quarter-hour values of a logged property, after `startExclusive` up to `endInclusive`. */
export function fetchQuarterValues(
  connection: Pick<NikoConnectionSettings, 'ip' | 'jwt'>,
  uuid: string,
  property: string,
  startExclusive: string,
  endInclusive: string,
): Promise<NikoQuarterValue[]> {
  const query = new URLSearchParams({ IntervalStart: startExclusive, IntervalEnd: endInclusive });
  const path = `/measurements/v1/devices/${encodeURIComponent(uuid)}/properties/${encodeURIComponent(property)}?${query}`;
  return new Promise((resolve, reject) => {
    const request = https.get(
      {
        host: connection.ip,
        path,
        // The controller uses a self-signed certificate, like its MQTT broker.
        rejectUnauthorized: false,
        headers: { Authorization: `Bearer ${connection.jwt}` },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => (body += chunk));
        response.on('end', () => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Measurements ${property}: HTTP ${response.statusCode} ${body.slice(0, 200)}`,
              ),
            );
            return;
          }
          try {
            const values: { DateTime: string; Value: number }[] = JSON.parse(body).Values ?? [];
            resolve(values.map(({ DateTime, Value }) => ({ end: DateTime, value: Value })));
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error(`Measurements ${property}: timeout`)));
    request.on('error', reject);
  });
}
