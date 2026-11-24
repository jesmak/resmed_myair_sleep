import type { HeightConfig } from "./height";
import type { RowStepConfig } from "./rows";

/** A stored night, as the integration's `resmed_myair_sleep/nights` command returns it. Every field but the date is optional. */
export interface Night {
    date: string;
    start?: string;
    end?: string;
    usage_minutes?: number;
    ahi?: number;
    leak?: number;
    mask_pairs?: number;
    score?: number;
    usage_score?: number;
    ahi_score?: number;
    mask_score?: number;
    leak_score?: number;
    temperature?: number;
    temperature_min?: number;
    temperature_max?: number;
    humidity?: number;
    humidity_min?: number;
    humidity_max?: number;
}

export type View = "last_night" | "nights" | "room";
export type NightsChart = "bars" | "charts" | "calendar";
export type RoomChart = "scatter" | "bins";
export type Metric = "ahi" | "usage" | "leak" | "score";
export type Room = "temperature" | "humidity";

export interface Limits {
    /** A night's AHI is good below this. */
    ahi_limit: number;
    /** A night's mask leak is good below this, in L/min. */
    leak_limit: number;
    /** A night's usage is good from this many hours up. */
    usage_hours: number;
}

export interface SleepCardConfig extends HeightConfig, RowStepConfig, Partial<Limits> {
    type: string;
    entity: string;
    view?: View;
    nights_chart?: NightsChart;
    room_chart?: RoomChart;
    metric?: Metric;
    /** The room's value drawn over the bars, or none. */
    room_line?: Room | "none";
    room?: Room;
    days?: number;
}
