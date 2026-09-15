// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Optional display override on any standard format.
 * `unit` remains the stable key (multi-axis, maps, UI config);
 * `customLabel` only changes the text shown after the number.
 */
export type WithCustomLabel = {
  customLabel?: string;
};

const DATE_UNITS = new Set([
  'datetime-iso',
  'datetime-us',
  'datetime-local',
  'date-iso',
  'date-us',
  'date-local',
  'time-local',
  'time-iso',
  'time-us',
  'relative-time',
  'unix-timestamp',
  'unix-timestamp-ms',
]);

/**
 * If customLabel is set, replace the standard unit suffix with the display label.
 * Uses the unit kind so formats without a space (%, °C, currency) still override correctly.
 * Date formats are left unchanged (customLabel only affects axis/legend via getUnitConfig).
 */
export function applyCustomLabel(formatted: string, customLabel?: string, unit?: string): string {
  const label = customLabel?.trim();
  if (!label) {
    return formatted;
  }

  if (unit && DATE_UNITS.has(unit)) {
    return formatted;
  }

  // Percent: "12.3%" → "12.3 pnr/mn"
  if (unit === 'percent' || unit === 'percent-decimal') {
    if (formatted.endsWith('%')) {
      return `${formatted.slice(0, -1).trimEnd()} ${label}`;
    }
  }

  // Temperature: "11°C" / "52°F"
  if (unit === 'celsius' && formatted.endsWith('°C')) {
    return `${formatted.slice(0, -2).trimEnd()} ${label}`;
  }
  if (unit === 'fahrenheit' && formatted.endsWith('°F')) {
    return `${formatted.slice(0, -2).trimEnd()} ${label}`;
  }

  // Throughput bits/bytes: "1.5KB/s" (no space before /s)
  if (
    unit === 'bits/sec' ||
    unit === 'decbits/sec' ||
    unit === 'bytes/sec' ||
    unit === 'decbytes/sec'
  ) {
    if (formatted.endsWith('/s')) {
      return `${formatted.slice(0, -2)}${label}`;
    }
  }

  // Common case: spaced unit id at end — "1.5K ops/sec", "42 decimal", "5 milliseconds"
  if (unit && formatted.endsWith(` ${unit}`)) {
    return `${formatted.slice(0, -(unit.length + 1))} ${label}`;
  }

  // Currency and other Intl forms: strip trailing currency code/symbol is unreliable;
  // if there is a trailing space-separated token that looks like a unit, replace it.
  // Avoid stripping date/time-like multi-token strings (already handled above).
  const lastSpace = formatted.lastIndexOf(' ');
  if (lastSpace > 0) {
    const suffix = formatted.slice(lastSpace + 1);
    // Only replace short suffixes (unit-like), not long remaining text
    if (suffix.length > 0 && suffix.length <= 24 && !/^\d/.test(suffix)) {
      return `${formatted.slice(0, lastSpace)} ${label}`;
    }
  }

  // No separable suffix (e.g. pure number from decimal): append label
  return `${formatted} ${label}`;
}
