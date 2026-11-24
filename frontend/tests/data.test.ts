import { describe, expect, it } from "vitest";

import { DEFAULT_LIMITS, addDays, bins, compliance, latestNight, level, nightsIn, roomNights, windowEnd } from "../src/data";
import type { Night } from "../src/types";

const night = (date: string, fields: Partial<Night> = {}): Night => ({ date, usage_minutes: 400, ahi: 2, ...fields });

describe("days", () => {
    it("move across a month and DST without losing a day", () => {
        expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
        expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
        expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    });

    it("end at the newest night, or last night when myAir is behind", () => {
        expect(windowEnd([night("2026-11-23")], "2026-11-24")).toBe("2026-11-23");
        expect(windowEnd([night("2026-11-10")], "2026-11-24")).toBe("2026-11-23");
        expect(windowEnd([], "2026-11-24")).toBe("2026-11-23");
    });

    it("of a window keep their place when a night is missing", () => {
        const days = nightsIn([night("2026-11-21"), night("2026-11-23")], "2026-11-23", 3);
        expect(days.map((day) => [day.date, day.night?.date])).toEqual([
            ["2026-11-21", "2026-11-21"],
            ["2026-11-22", undefined],
            ["2026-11-23", "2026-11-23"],
        ]);
    });
});

describe("levels", () => {
    it.each([
        ["ahi", 4.9, "good"],
        ["ahi", 5, "high"],
        ["ahi", 9.9, "high"],
        ["ahi", 10, "bad"],
        ["leak", 23.9, "good"],
        ["leak", 24, "high"],
        ["leak", 39.9, "high"],
        ["leak", 40, "bad"],
        ["usage", 4, "good"],
        ["usage", 3.9, "high"],
        ["usage", 0, "bad"],
        ["score", 80, "good"],
        ["score", 60, "high"],
        ["score", 59, "bad"],
    ] as const)("%s %d is %s", (metric, value, expected) => {
        expect(level(metric, value, DEFAULT_LIMITS)).toBe(expected);
    });

    it("follow the limits set", () => {
        expect(level("ahi", 3, { ...DEFAULT_LIMITS, ahi_limit: 2 })).toBe("high");
        expect(level("usage", 5, { ...DEFAULT_LIMITS, usage_hours: 6 })).toBe("high");
    });

    it("leave a missing value without one", () => {
        expect(level("ahi", undefined, DEFAULT_LIMITS)).toBeUndefined();
    });
});

describe("the nights", () => {
    it("show the newest used night as last night, past a night without use", () => {
        expect(latestNight([night("2026-11-22"), night("2026-11-23", { usage_minutes: 0 })])?.date).toBe("2026-11-22");
        expect(latestNight([night("2026-11-23", { usage_minutes: 0 })])?.date).toBe("2026-11-23");
    });

    it("count compliance over 30 days, a missing night as unused", () => {
        const nights = Array.from({ length: 30 }, (_, index) =>
            night(addDays("2026-11-23", -index), { usage_minutes: index < 15 ? 240 : 239 }),
        );
        expect(compliance(nights, "2026-11-23", DEFAULT_LIMITS)).toBe(50);
        expect(compliance(nights.slice(0, 15), "2026-11-23", DEFAULT_LIMITS)).toBe(50);
        expect(compliance([], "2026-11-23", DEFAULT_LIMITS)).toBe(0);
    });

    it("group into the room's steps with their average AHI, leaving out nights without use or a value", () => {
        const nights = [
            night("2026-11-01", { temperature: 18.2, ahi: 2 }),
            night("2026-11-02", { temperature: 18.9, ahi: 4 }),
            night("2026-11-03", { temperature: 21, ahi: 6 }),
            night("2026-11-04", { temperature: 19.5, usage_minutes: 0, ahi: 0 }),
            night("2026-11-05", { ahi: 9 }),
        ];
        expect(bins(nights, "temperature")).toEqual([
            { from: 18, to: 19, average: 3, least: 2, most: 4, count: 2 },
            { from: 21, to: 22, average: 6, least: 6, most: 6, count: 1 },
        ]);
        expect(bins([night("2026-11-01", { humidity: 47 })], "humidity")).toEqual([
            { from: 45, to: 50, average: 2, least: 2, most: 2, count: 1 },
        ]);
        expect(roomNights(nights, "temperature").map((entry) => entry.date)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    });
});
