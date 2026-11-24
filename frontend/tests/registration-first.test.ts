import { expect, test, vi } from "vitest";

// A file of its own, as the first copy has to be loaded into a page that has none.
test("the first copy registers the card and its editor, lists it in the picker and logs its version", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await import("../src/resmed-myair-sleep-card");

    expect(customElements.get("resmed-myair-sleep-card")).toBeDefined();
    expect(customElements.get("resmed-myair-sleep-card-editor")).toBeDefined();
    const registry = window as unknown as { customCards?: { type: string }[] };
    expect(registry.customCards?.filter((card) => card.type === "resmed-myair-sleep-card")).toEqual([
        {
            type: "resmed-myair-sleep-card",
            name: "ResMed myAir Sleep",
            description: expect.any(String),
            documentationURL: "https://github.com/jesmak/resmed_myair_sleep#sleep-card",
            preview: true,
        },
    ]);
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[0]).toContain("RESMED-MYAIR-SLEEP-CARD");
});
