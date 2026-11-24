/**
 * The card's visual editor: the machine, the view and its chart, how far back it reaches, the limits behind the colours
 * and the height's rounding. The height mode is set in YAML only.
 */
import { LitElement, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";

import { DEFAULT_LIMITS } from "./data";
import type { HomeAssistant } from "./hass";
import { browserLanguage, translate } from "./localize/localize";
import { DEFAULT_SCROLL_INDICATOR } from "./const";
import { scrollIndicatorData, scrollIndicatorSchema, tidyScrollIndicator } from "./fade";
import { rowStepData, rowStepSchema, tidyRowStep } from "./rows";
import type { SleepCardConfig } from "./types";

interface SchemaEntry {
    name: string;
}

/** The defaults shown in the form, and left out of the configuration it writes. */
const DEFAULTS: Partial<SleepCardConfig> = {
    view: "last_night",
    nights_chart: "bars",
    room_chart: "bins",
    metric: "ahi",
    room_line: "temperature",
    room: "temperature",
    days: 90,
    ...DEFAULT_LIMITS,
};

/** The integration's sensors, AHI first, as any of a machine's sensors finds its nights. */
export function cardEntities(hass: HomeAssistant): string[] {
    return Object.values(hass.entities ?? {})
        .filter(
            (entry) => entry?.platform === "resmed_myair_sleep" && entry.entity_id.startsWith("sensor.") && hass.states[entry.entity_id],
        )
        .sort((a, b) => Number(b?.translation_key === "ahi") - Number(a?.translation_key === "ahi"))
        .map((entry) => entry?.entity_id ?? "");
}

function select(name: string, values: string[], text: (key: string) => string): Record<string, unknown> {
    return {
        name,
        selector: { select: { mode: "dropdown", options: values.map((value) => ({ value, label: text(`editor.${name}_${value}`) })) } },
    };
}

function schema(config: SleepCardConfig, text: (key: string) => string): Record<string, unknown>[] {
    const view = config.view ?? DEFAULTS.view;
    const chart = config.nights_chart ?? DEFAULTS.nights_chart;
    const days = { name: "days", selector: { number: { min: 7, max: 3650, mode: "box", unit_of_measurement: text("editor.days_unit") } } };
    const viewParts =
        view === "nights"
            ? [
                  select("nights_chart", ["bars", "charts", "calendar"], text),
                  ...(chart === "charts" ? [] : [select("metric", ["ahi", "usage", "leak", "score"], text)]),
                  ...(chart === "bars" ? [select("room_line", ["none", "temperature", "humidity"], text)] : []),
                  days,
              ]
            : view === "room"
              ? [select("room_chart", ["bins", "scatter"], text), select("room", ["temperature", "humidity"], text), days]
              : [];
    const number = (name: string, step: number) => ({ name, selector: { number: { min: step, step, mode: "box" } } });
    return [
        { name: "entity", required: true, selector: { entity: { filter: [{ integration: "resmed_myair_sleep" }] } } },
        select("view", ["last_night", "nights", "room"], text),
        ...viewParts,
        {
            name: "limits",
            type: "expandable",
            flatten: true,
            schema: [number("ahi_limit", 0.5), number("leak_limit", 1), number("usage_hours", 0.5)],
        },
        ...scrollIndicatorSchema(text),
        ...rowStepSchema(config, text),
    ];
}

export class ResmedMyairSleepCardEditor extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @state() private config: SleepCardConfig = { type: "custom:resmed-myair-sleep-card", entity: "" };

    public setConfig(config: SleepCardConfig): void {
        this.config = { ...config };
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass) {
            return nothing;
        }
        return html`
            <ha-form
                .hass=${this.hass}
                .data=${{ ...DEFAULTS, ...scrollIndicatorData(rowStepData(this.config), DEFAULT_SCROLL_INDICATOR) }}
                .schema=${schema(this.config, (key) => this.text(key))}
                .computeLabel=${(entry: SchemaEntry) => this.text(`editor.${entry.name}`)}
                .computeHelper=${(entry: SchemaEntry) => this.helper(entry.name)}
                @value-changed=${this.valueChanged}
            ></ha-form>
        `;
    }

    private valueChanged(event: CustomEvent<{ value: SleepCardConfig }>): void {
        const config = tidyScrollIndicator(tidyRowStep({ ...event.detail.value }), DEFAULT_SCROLL_INDICATOR) as SleepCardConfig &
            Record<string, unknown>;
        for (const [key, value] of Object.entries(DEFAULTS)) {
            if (config[key] === value || config[key] == null) {
                delete config[key];
            }
        }
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    }

    private text(key: string): string {
        return translate(this.language(), key);
    }

    private helper(name: string): string | undefined {
        const key = `editor.${name}_helper`;
        const helper = translate(this.language(), key);
        return helper === key ? undefined : helper;
    }

    private language(): string {
        return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
    }
}

if (!customElements.get("resmed-myair-sleep-card-editor")) {
    customElements.define("resmed-myair-sleep-card-editor", ResmedMyairSleepCardEditor);
}

declare global {
    interface HTMLElementTagNameMap {
        "resmed-myair-sleep-card-editor": ResmedMyairSleepCardEditor;
    }
}
