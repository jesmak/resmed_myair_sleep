import { describe, expect, it } from "vitest";

import { tooltipPosition } from "../src/charts";

describe("tooltipPosition", () => {
    const card = { left: 100, top: 50, width: 400 };

    it("puts the tooltip on the right of a column in the card's left half", () => {
        expect(tooltipPosition({ left: 150, top: 120, width: 4 }, card, 130, 1)).toEqual({ x: 56, top: 80, flip: false });
    });

    it("puts it on the left of a column in the right half, measured from the card's right edge", () => {
        expect(tooltipPosition({ left: 450, top: 120, width: 4 }, card, 130, 1)).toEqual({ x: 52, top: 80, flip: true });
    });

    it("keeps a column on the middle line on the right", () => {
        expect(tooltipPosition({ left: 298, top: 120, width: 4 }, card, 130, 1).flip).toBe(false);
    });

    it("gives the card's own pixels when the card is drawn scaled", () => {
        const drawn = { left: 100, top: 50, width: 200 };
        expect(tooltipPosition({ left: 125, top: 85, width: 2 }, drawn, 90, 0.5)).toEqual({ x: 56, top: 80, flip: false });
        expect(tooltipPosition({ left: 275, top: 85, width: 2 }, drawn, 90, 0.5)).toEqual({ x: 52, top: 80, flip: true });
    });
});
