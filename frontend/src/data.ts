/** What the card works out from the stored nights: the days it shows, how good a value is, compliance and the room's bins. */
import type { Limits, Metric, Night, Room } from "./types";

export const DEFAULT_LIMITS: Limits = { ahi_limit: 5, leak_limit: 24, usage_hours: 4 };

/** How a value compares with its limit, for its colour. */
export type Level = "good" | "high" | "bad";

/** A date string moved by whole days. Dates are calendar days, so they are counted in UTC to keep clear of DST. */
export function addDays(date: string, days: number): string {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + days);
    return day.toISOString().slice(0, 10);
}

/** A night's value of a metric. Usage is in hours. */
export function metricValue(night: Night | undefined, metric: Metric): number | undefined {
    if (!night) {
        return undefined;
    }
    return metric === "usage" ? (night.usage_minutes === undefined ? undefined : night.usage_minutes / 60) : night[metric];
}

/** Whether a night had the machine on at all. myAir keeps a night without use as zeros. */
export function used(night: Night | undefined): boolean {
    return (night?.usage_minutes ?? 0) > 0;
}

/**
 * How good a value is. AHI is high from its limit and bad from twice it. Leak is high from its limit and bad from 5/3 of
 * it, which makes the usual 24 L/min a limit of 40. Usage is good from its hours, short below them and bad at none. The
 * score has no setting: good from 80, high (fair) from 60.
 */
export function level(metric: Metric, value: number | undefined, limits: Limits): Level | undefined {
    if (value === undefined) {
        return undefined;
    }
    switch (metric) {
        case "ahi":
            return value < limits.ahi_limit ? "good" : value < 2 * limits.ahi_limit ? "high" : "bad";
        case "leak":
            return value < limits.leak_limit ? "good" : value < (limits.leak_limit * 5) / 3 ? "high" : "bad";
        case "usage":
            return value >= limits.usage_hours ? "good" : value > 0 ? "high" : "bad";
        case "score":
            return value >= 80 ? "good" : value >= 60 ? "high" : "bad";
    }
}

/** The newest night the machine was used on, or the newest night when none was. */
export function latestNight(nights: Night[]): Night | undefined {
    return [...nights].reverse().find(used) ?? nights.at(-1);
}

/**
 * The last day a window ends on: the newest night, or last night when that is newer, so a window doesn't end at an
 * old night when myAir has stopped sending new ones.
 */
export function windowEnd(nights: Night[], today: string): string {
    const yesterday = addDays(today, -1);
    const newest = nights.at(-1)?.date;
    return newest && newest > yesterday ? newest : yesterday;
}

/** The `days` days ending on `end`, oldest first, each with its night when one is stored. */
export function nightsIn(nights: Night[], end: string, days: number): { date: string; night?: Night }[] {
    const byDate = new Map(nights.map((night) => [night.date, night]));
    return Array.from({ length: days }, (_, index) => {
        const date = addDays(end, index - days + 1);
        return { date, night: byDate.get(date) };
    });
}

/** The share of the 30 days ending on `end` with at least the usage limit, as a whole percentage. A day without a night counts as unused. */
export function compliance(nights: Night[], end: string, limits: Limits): number {
    const days = nightsIn(nights, end, 30);
    const kept = days.filter(({ night }) => (night?.usage_minutes ?? 0) >= limits.usage_hours * 60).length;
    return Math.round((kept / days.length) * 100);
}

export interface Bin {
    /** The bin's lower edge; it holds values from it up to the next step. */
    from: number;
    to: number;
    average: number;
    least: number;
    most: number;
    count: number;
}

/** The room's step between bins: a degree of temperature, five points of humidity. */
export function roomStep(room: Room): number {
    return room === "temperature" ? 1 : 5;
}

/** The nights used, with an AHI and the room's value, grouped by the room's value into steps, lowest first. */
export function bins(nights: Night[], room: Room): Bin[] {
    const step = roomStep(room);
    const groups = new Map<number, number[]>();
    for (const night of nights) {
        const value = night[room];
        if (!used(night) || value === undefined || night.ahi === undefined) {
            continue;
        }
        const from = Math.floor(value / step) * step;
        groups.set(from, [...(groups.get(from) ?? []), night.ahi]);
    }
    return [...groups.entries()]
        .sort(([a], [b]) => a - b)
        .map(([from, values]) => ({
            from,
            to: from + step,
            average: values.reduce((sum, value) => sum + value, 0) / values.length,
            least: Math.min(...values),
            most: Math.max(...values),
            count: values.length,
        }));
}

/** The nights used that have an AHI and the room's value, for the scatter. */
export function roomNights(nights: Night[], room: Room): Night[] {
    return nights.filter((night) => used(night) && night.ahi !== undefined && night[room] !== undefined);
}
