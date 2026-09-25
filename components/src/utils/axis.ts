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

import type { XAXisComponentOption, YAXisComponentOption } from 'echarts';
import merge from 'lodash/merge';

import type { FormatOptions } from '../model';
import { formatValue } from '../model';

export interface YAxisConfig {
  format?: FormatOptions;
  position?: 'left' | 'right';
  show?: boolean;
  min?: number;
  max?: number;
}

// Character width multipliers (approximate for typical UI fonts)
const CHAR_WIDTH_BASE = 7;
const AXIS_LABEL_PADDING = 16;

function estimateLabelWidth(format: FormatOptions | undefined, maxValue: number): number {
  const formattedLabel = formatValue(maxValue, format);
  const fallback = Math.max(formattedLabel.length * CHAR_WIDTH_BASE, 28);
  if (typeof document === 'undefined') {
    return fallback;
  }
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return fallback;
    }
    context.font = '12px sans-serif';
    return Math.max(context.measureText(formattedLabel).width, 28);
  } catch {
    return fallback;
  }
}

/*
 * Populate yAxis or xAxis properties, returns an Array since multiple axes are supported
 */
export function getFormattedAxis(axis?: YAXisComponentOption | XAXisComponentOption, unit?: FormatOptions): unknown[] {
  const AXIS_DEFAULT = {
    type: 'value',
    boundaryGap: [0, '10%'],
    axisLabel: {
      formatter: (value: number): string => {
        return formatValue(value, unit);
      },
    },
  };
  return [merge(AXIS_DEFAULT, axis)];
}

export interface MultipleYAxesLayout {
  axes: YAXisComponentOption[];
  /** Pixels for ECharts grid.right so the outermost right-axis labels are not clipped. */
  rightGridPadding: number;
}

/**
 * Create multiple Y axes for ECharts (left base + right additional) and the grid.right
 * padding required so the last right axis labels are fully visible.
 */
export function getFormattedMultipleYAxesLayout(
  baseAxis: YAXisComponentOption | undefined,
  baseFormat: FormatOptions | undefined,
  additionalFormats: FormatOptions[],
  maxValues?: number[],
): MultipleYAxesLayout {
  const axes: YAXisComponentOption[] = [];

  const baseAxisConfig: YAXisComponentOption = merge(
    {
      type: 'value',
      position: 'left',
      boundaryGap: [0, '10%'],
      axisLabel: {
        formatter: (value: number): string => {
          return formatValue(value, baseFormat);
        },
      },
    },
    baseAxis,
  );
  axes.push(baseAxisConfig);

  let cumulativeOffset = 0;
  additionalFormats.forEach((format, index) => {
    const labelWidth = estimateLabelWidth(format, maxValues?.[index] ?? 1000) + AXIS_LABEL_PADDING;
    axes.push({
      type: 'value',
      position: 'right',
      offset: cumulativeOffset,
      boundaryGap: [0, '10%'],
      axisLabel: {
        formatter: (value: number): string => {
          return formatValue(value, format);
        },
        hideOverlap: true,
      },
      splitLine: {
        show: false,
      },
      show: baseAxis?.show,
    });
    cumulativeOffset += labelWidth;
  });

  return {
    axes,
    // Full stack of right-axis label bands (containLabel alone does not cover offset>0 axes).
    rightGridPadding: cumulativeOffset > 0 ? cumulativeOffset : 20,
  };
}

export function getFormattedMultipleYAxes(
  baseAxis: YAXisComponentOption | undefined,
  baseFormat: FormatOptions | undefined,
  additionalFormats: FormatOptions[],
  maxValues?: number[],
): YAXisComponentOption[] {
  return getFormattedMultipleYAxesLayout(baseAxis, baseFormat, additionalFormats, maxValues).axes;
}
