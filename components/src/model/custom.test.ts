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

import { describe, expect, it } from 'vitest';

import { applyCustomLabel } from './custom';
import { formatValue } from './units';

describe('applyCustomLabel', () => {
  it('replaces spaced unit suffix', () => {
    expect(applyCustomLabel('1.5K ops/sec', 'pnr/mn', 'ops/sec')).toBe('1.5K pnr/mn');
  });

  it('replaces percent suffix without leaving %', () => {
    expect(applyCustomLabel('12%', 'load', 'percent')).toBe('12 load');
  });

  it('replaces celsius suffix', () => {
    expect(applyCustomLabel('11°C', 'room', 'celsius')).toBe('11 room');
  });

  it('does not mutilate date formats', () => {
    const iso = '2024-01-15T12:00:00.000Z';
    expect(applyCustomLabel(iso, 'ignored', 'datetime-iso')).toBe(iso);
  });

  it('returns unchanged when label empty', () => {
    expect(applyCustomLabel('42 ops/sec', '', 'ops/sec')).toBe('42 ops/sec');
    expect(applyCustomLabel('42 ops/sec', undefined, 'ops/sec')).toBe('42 ops/sec');
  });
});

describe('formatValue with customLabel', () => {
  it('keeps unit key ops/sec and shows custom label', () => {
    expect(
      formatValue(1500, { unit: 'ops/sec', shortValues: true, customLabel: 'pnr/mn' }),
    ).toBe('1.5K pnr/mn');
  });

  it('works with decimal base', () => {
    expect(formatValue(12.34, { unit: 'decimal', decimalPlaces: 1, customLabel: 'pax/mn' })).toBe('12.3 pax/mn');
  });

  it('percent custom label replaces %', () => {
    const out = formatValue(0.5, { unit: 'percent', customLabel: 'util' });
    expect(out).not.toContain('%');
    expect(out).toContain('util');
  });

  it('without customLabel is unchanged', () => {
    expect(formatValue(10, { unit: 'ops/sec' })).toBe('10 ops/sec');
  });
});
