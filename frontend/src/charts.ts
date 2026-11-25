/** The card's charts, drawn as SVG at the width they are given. A bar chart's nights are hover columns for the card's tooltip, the scatter's dots carry theirs. */
import { nothing, svg } from "lit";
import type { SVGTemplateResult } from "lit";

/** The room the y axis's labels take on the left, and the x axis's dates at the bottom. */
const LEFT = 30;
const BOTTOM = 18;
const TOP = 6;

export interface Bar {
    value?: number;
    color: string;
}

export interface Line {
    values: (number | undefined)[];
    color: string;
    /** The line's own scale, labelled on the right. */
    label(value: number): string;
}

export interface BarOptions {
    width: number;
    height: number;
    goal?: { value: number; label: string };
    /** Labels under some of the bars, by their index. */
    dates?: Map<number, string>;
    line?: Line;
    /** The night under the pointer, whose column is lit. */
    hovered?: number;
    number(value: number): string;
}

/** The lowest round top for an axis holding `value`: 1, 2 or 5 times a power of ten, times four ticks. */
function roundTop(value: number): number {
    const step = value / 4;
    const power = 10 ** Math.floor(Math.log10(step || 1));
    const nice = [1, 2, 2.5, 5, 10].find((factor) => factor * power >= step) ?? 10;
    return nice * power * 4;
}

export function barChart(bars: Bar[], options: BarOptions): SVGTemplateResult {
    const { width, height, goal, dates, line, hovered } = options;
    const right = line ? 30 : 4;
    const bottom = dates ? BOTTOM : 2;
    const values = bars.flatMap((bar) => (bar.value === undefined ? [] : [bar.value]));
    const top = roundTop(Math.max(1, ...values, goal ? goal.value * 1.25 : 0));
    const plot = height - TOP - bottom;
    const y = (value: number): number => TOP + (1 - value / top) * plot;
    const slot = (width - LEFT - right) / Math.max(1, bars.length);
    const barWidth = Math.max(1, slot * 0.7);
    return svg`<svg width=${width} height=${height} role="img">
        ${[0, top / 2, top].map(
            (tick) => svg`<line class="grid ${tick ? "dashed" : ""}" x1=${LEFT} x2=${width - right} y1=${y(tick)} y2=${y(tick)}></line>
                <text class="axis" x=${LEFT - 5} y=${y(tick) + 3} text-anchor="end">${options.number(tick)}</text>`,
        )}
        ${hovered === undefined || hovered >= bars.length ? nothing : svg`<rect class="hover" x=${LEFT + hovered * slot} y=${TOP} width=${slot} height=${plot}></rect>`}
        ${bars.map((bar, index) =>
            bar.value === undefined
                ? nothing
                : svg`<rect x=${LEFT + index * slot + (slot - barWidth) / 2} y=${y(bar.value)} width=${barWidth}
                      height=${Math.max(1, TOP + plot - y(bar.value))} rx=${Math.min(2, barWidth / 3)} fill=${bar.color}
                      fill-opacity=${line ? 0.5 : 1}></rect>`,
        )}
        ${
            goal
                ? svg`<line class="goal" x1=${LEFT} x2=${width - right} y1=${y(goal.value)} y2=${y(goal.value)}></line>
                <text class="goal-label" x=${LEFT + 4} y=${y(goal.value) - 4}>${goal.label}</text>`
                : nothing
        }
        ${line ? lineOver(line, { width, right, plot, slot }) : nothing}
        ${
            dates
                ? [...dates].map(
                      ([index, label]) =>
                          svg`<text class="axis" x=${LEFT + index * slot + slot / 2} y=${height - 4} text-anchor="middle">${label}</text>`,
                  )
                : nothing
        }
        ${bars.map((_, index) => svg`<rect class="hit" data-index=${index} x=${LEFT + index * slot} y=${TOP} width=${slot} height=${plot}></rect>`)}
    </svg>`;
}

export interface Box {
    left: number;
    top: number;
    width: number;
}

/**
 * Where a hovered column's tooltip goes in the card, in the card's own pixels when it is drawn at `scale`: half a column
 * beside the column, on its right in the card's left half and, as `x` from the card's right edge, on its left in the
 * right half, level with the chart's top.
 */
export function tooltipPosition(column: Box, card: Box, chartTop: number, scale: number): { x: number; top: number; flip: boolean } {
    const middle = (column.left + column.width / 2 - card.left) / scale;
    const width = card.width / scale;
    const flip = middle > width / 2;
    const gap = column.width / scale;
    return { x: flip ? width - middle + gap : middle + gap, top: (chartTop - card.top) / scale, flip };
}

/** A line over the bars on a scale of its own, from a step under its least value to a step over its most. */
function lineOver(line: Line, frame: { width: number; right: number; plot: number; slot: number }): SVGTemplateResult | typeof nothing {
    const present = line.values.flatMap((value) => (value === undefined ? [] : [value]));
    if (!present.length) {
        return nothing;
    }
    const low = Math.floor(Math.min(...present)) - 1;
    const high = Math.ceil(Math.max(...present)) + 1;
    const y = (value: number): number => TOP + (1 - (value - low) / (high - low)) * frame.plot;
    const x = (index: number): number => LEFT + index * frame.slot + frame.slot / 2;
    let path = "";
    let drawing = false;
    line.values.forEach((value, index) => {
        if (value === undefined) {
            drawing = false;
            return;
        }
        path += `${drawing ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`;
        drawing = true;
    });
    // Drawn over a halo of the card's background, so it stands apart from the bars under it.
    return svg`<path class="halo" d=${path}></path>
        <path d=${path} fill="none" stroke=${line.color} stroke-width="2.5" stroke-linejoin="round"></path>
        ${line.values.map((value, index) =>
            value === undefined ? nothing : svg`<circle class="dot" cx=${x(index)} cy=${y(value)} r="2.6" fill=${line.color}></circle>`,
        )}
        ${[low, high].map(
            (value) =>
                svg`<text class="axis" x=${frame.width - frame.right + 4} y=${y(value) + 3} fill=${line.color}>${line.label(value)}</text>`,
        )}`;
}

export interface Point {
    x: number;
    y: number;
    color: string;
    tooltip: string;
    /** Left undrawn, while the axes still make room for it. */
    hidden?: boolean;
}

export interface ScatterOptions {
    width: number;
    height: number;
    /** The x axis's labels fall on multiples of this. */
    step: number;
    goal?: number;
    xTitle: string;
    yTitle: string;
    number(value: number): string;
}

export function scatter(points: Point[], options: ScatterOptions): SVGTemplateResult {
    const { width, height, step } = options;
    const bottom = BOTTOM + 14;
    const left = LEFT + 12;
    const middle = TOP + (height - TOP - bottom) / 2;
    const xs = points.map((point) => point.x);
    const low = Math.floor(Math.min(...xs) - step / 2);
    const high = Math.ceil(Math.max(...xs) + step / 2);
    const top = roundTop(Math.max(options.goal ? options.goal * 1.6 : 0, ...points.map((point) => point.y)));
    const x = (value: number): number => left + ((value - low) / (high - low)) * (width - left - 8);
    const y = (value: number): number => TOP + (1 - value / top) * (height - TOP - bottom);
    const ticks: number[] = [];
    for (let tick = Math.ceil(low / step) * step; tick <= high; tick += step) {
        ticks.push(tick);
    }
    return svg`<svg width=${width} height=${height} role="img">
        ${[0, top / 4, top / 2, (top * 3) / 4, top].map(
            (tick) => svg`<line class="grid dashed" x1=${left} x2=${width - 8} y1=${y(tick)} y2=${y(tick)}></line>
                <text class="axis" x=${left - 5} y=${y(tick) + 3} text-anchor="end">${options.number(tick)}</text>`,
        )}
        ${ticks.map((tick) => svg`<text class="axis" x=${x(tick)} y=${height - bottom + 14} text-anchor="middle">${options.number(tick)}</text>`)}
        <text class="axis" transform="translate(9 ${middle}) rotate(-90)" text-anchor="middle">${options.yTitle}</text>
        <text class="axis" x=${(width + left) / 2} y=${height - 3} text-anchor="middle">${options.xTitle}</text>
        ${options.goal === undefined ? nothing : svg`<line class="goal" x1=${left} x2=${width - 8} y1=${y(options.goal)} y2=${y(options.goal)}></line>`}
        ${points
            .filter((point) => !point.hidden)
            .map(
                (point) =>
                    svg`<circle cx=${x(point.x)} cy=${y(point.y)} r="4.5" fill=${point.color} fill-opacity="0.85"><title>${point.tooltip}</title></circle>`,
            )}
    </svg>`;
}

export interface TimelineOptions {
    width: number;
    /** The session's start and end as hours from the evening's midnight, so 23:30 is 23.5 and 07:15 the next morning 31.25. */
    start?: number;
    end?: number;
    startLabel: string;
    endLabel: string;
    hourLabel(hour: number): string;
}

/** The night from 20:00 to noon, with the session as a bar on it. */
export function timeline(options: TimelineOptions): SVGTemplateResult {
    const { width } = options;
    const from = 20;
    const to = 36;
    const x = (hour: number): number => 8 + ((Math.min(to, Math.max(from, hour)) - from) / (to - from)) * (width - 16);
    const hours = [20, 24, 28, 32, 36];
    const bar =
        options.start === undefined || options.end === undefined
            ? nothing
            : svg`<rect class="session" x=${x(options.start)} y="10" width=${Math.max(2, x(options.end) - x(options.start))} height="18" rx="6"></rect>
                <text class="session-label" x=${x(options.start) + 6} y="23">${options.startLabel}</text>
                <text class="session-label" x=${x(options.end) - 6} y="23" text-anchor="end">${options.endLabel}</text>`;
    return svg`<svg width=${width} height="46" role="img">
        ${hours.map(
            (hour) => svg`<line class="grid" x1=${x(hour)} x2=${x(hour)} y1="8" y2="30"></line>
                <text class="axis" x=${x(hour)} y="44" text-anchor="middle">${options.hourLabel(hour % 24)}</text>`,
        )}
        ${bar}
    </svg>`;
}
