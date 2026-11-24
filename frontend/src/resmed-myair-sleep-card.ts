/**
 * A dashboard card for the ResMed myAir Sleep integration: last night, the nights over time, or sleep against the
 * bedroom's temperature or humidity, all drawn from the nights the integration keeps.
 */
import { LitElement, css, html, nothing } from "lit";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";

import { barChart, scatter, timeline, tooltipPosition } from "./charts";
import type { Bar } from "./charts";
import { CARD_VERSION } from "./const";
import {
    DEFAULT_LIMITS,
    addDays,
    bins,
    compliance,
    latestNight,
    level,
    metricValue,
    nightsIn,
    roomNights,
    roomStep,
    used,
    windowEnd,
} from "./data";
import type { Level } from "./data";
import { cardEntities } from "./editor";
import { ScrollFade, fadeStyles } from "./fade";
import type { HomeAssistant } from "./hass";
import { gridMinRows, heightCardSize, heightMode, heightStyle, validHeight } from "./height";
import { browserLanguage, translate } from "./localize/localize";
import { drawnScale, fillLimit, filledHeight, filledStyle, spareRoom, validRowStep } from "./rows";
import type { Limits, Metric, Night, NightsChart, Room, RoomChart, SleepCardConfig, View } from "./types";

const VIEWS: View[] = ["last_night", "nights", "room"];
const NIGHTS_CHARTS: NightsChart[] = ["bars", "charts", "calendar"];
const ROOM_CHARTS: RoomChart[] = ["scatter", "bins"];
const METRICS: Metric[] = ["ahi", "usage", "leak", "score"];
const ROOMS: Room[] = ["temperature", "humidity"];
const DEFAULT_DAYS = 90;
const RETRY = 60_000;

/** Each chart's height on automatic rows before the rows are filled, and the least it is drawn with when held. */
const BAR_CHART = 170;
const SMALL_CHART = 64;
const SCATTER_CHART = 220;
const MIN_CHART = 90;
const MIN_SMALL_CHART = 40;
/** The most each of a chart's gaps, to the part above and the part below, grows before the chart grows. */
const CHART_GAP_PX = 20;

/**
 * The least a card is held to, measured: a view drawing a chart keeps its header, the chart at its least and its foot,
 * a view of rows its header and one row of the part that scrolls, and the calendar two of a month's weeks.
 */
const MIN_HEIGHTS: Record<string, number> = {
    last_night: 184,
    bars: 224,
    charts: 342,
    calendar: 200,
    scatter: 214,
    bins: 150,
};

const LEVEL_COLORS: Record<Level, string> = {
    good: "var(--sleep-good)",
    high: "var(--sleep-high)",
    bad: "var(--sleep-bad)",
};

interface CardRegistration {
    type: string;
    name: string;
    description: string;
    documentationURL?: string;
    preview?: boolean;
}

/**
 * The locales Home Assistant's number format setting asks for, as its own frontend reads it: `numberFormatToLocale`, except
 * none, which `formatNumberToParts` writes in en-US without grouping.
 */
function numberLocale(hass: HomeAssistant | undefined, language: string): string | string[] | undefined {
    switch (hass?.locale?.number_format) {
        case "comma_decimal":
            return ["en-US", "en"];
        case "decimal_comma":
            return ["de", "es", "it"];
        case "space_comma":
            return ["fr", "sv", "cs"];
        case "quote_decimal":
            return ["de-CH"];
        case "none":
            return "en-US";
        case "system":
            return undefined;
        default:
            return language;
    }
}

export class ResmedMyairSleepCard extends LitElement {
    @property({ attribute: false }) public hass?: HomeAssistant;
    @property({ attribute: false }) public layout?: string;
    @state() private config?: SleepCardConfig;
    @state() private nights?: Night[];
    @state() private error?: string;
    /** What the viewer picked on the card itself, over the config's starting choice. */
    @state() private picked: { metric?: Metric; line?: Room | "none"; room?: Room } = {};
    /** The content's width, which the charts are drawn for. */
    @state() private width = 0;
    /** The room a chart has been given over its own height, or under it when held, and its gaps' growth. */
    @state() private extra = 0;
    @state() private gap = 0;
    /** On automatic rows, the height that fills the card's rows. */
    @state() private filled = 0;
    /** A card held to a limit it would grow past, in pixels. */
    @state() private held = 0;
    /** The night under the pointer in a bar chart, and where its tooltip goes in the card. */
    @state() private hovered?: { index: number; x: number; top: number; flip: boolean };
    private fetchedFor?: string;
    private retry?: number;
    private frame?: number;
    private readonly resizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => this.measureSoon());
    private observed?: Element;
    /** The calendar last scrolled to its newest month, so a user's own scrolling stays until the calendar is drawn anew. */
    private scrolledCalendar?: Element;

    public constructor() {
        super();
        new ScrollFade(this, () => (this.isHeld() ? [...this.renderRoot.querySelectorAll<HTMLElement>(".scroller")] : []));
    }

    public static getConfigElement(): HTMLElement {
        return document.createElement("resmed-myair-sleep-card-editor");
    }

    /** Offers the integration's first machine when the card is added from the picker. */
    public static getStubConfig(hass?: HomeAssistant): Record<string, unknown> {
        return { entity: (hass ? cardEntities(hass)[0] : undefined) ?? "" };
    }

    public setConfig(config: SleepCardConfig): void {
        const language = browserLanguage();
        if (!config?.entity || typeof config.entity !== "string") {
            throw new Error(translate(language, "error.invalid_configuration"));
        }
        const invalid =
            (config.view != null && !VIEWS.includes(config.view)) ||
            (config.nights_chart != null && !NIGHTS_CHARTS.includes(config.nights_chart)) ||
            (config.room_chart != null && !ROOM_CHARTS.includes(config.room_chart)) ||
            (config.metric != null && !METRICS.includes(config.metric)) ||
            (config.room != null && !ROOMS.includes(config.room)) ||
            (config.room_line != null && config.room_line !== "none" && !ROOMS.includes(config.room_line)) ||
            [config.days, config.ahi_limit, config.leak_limit, config.usage_hours].some(
                (value) => value != null && (typeof value !== "number" || !(value > 0)),
            ) ||
            (config.days != null && !Number.isInteger(config.days));
        if (invalid) {
            throw new Error(translate(language, "error.invalid_option"));
        }
        if (!validHeight(config)) {
            throw new Error(translate(language, "error.invalid_height"));
        }
        if (!validRowStep(config)) {
            throw new Error(translate(language, "error.invalid_row_step"));
        }
        if (config.entity !== this.config?.entity) {
            this.nights = undefined;
            this.fetchedFor = undefined;
            this.error = undefined;
            window.clearTimeout(this.retry);
            this.retry = undefined;
        }
        this.picked = {};
        this.config = { ...config };
    }

    public getCardSize(): number {
        return heightCardSize(this.config ?? {}, 5, this.minimum());
    }

    public getGridOptions(): Record<string, unknown> {
        return { columns: 12, rows: "auto", min_columns: 6, min_rows: gridMinRows(this.minimum()) };
    }

    public connectedCallback(): void {
        super.connectedCallback();
        if (this.hass) {
            this.requestUpdate();
        }
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        this.resizes?.disconnect();
        this.observed = undefined;
        cancelAnimationFrame(this.frame ?? 0);
        if (this.retry !== undefined) {
            window.clearTimeout(this.retry);
            this.retry = undefined;
            this.fetchedFor = undefined;
        }
    }

    protected shouldUpdate(changed: PropertyValues): boolean {
        if ([...changed.keys()].some((key) => key !== "hass") || !this.config) {
            return true;
        }
        const previous = changed.get("hass") as HomeAssistant | undefined;
        return (
            !previous ||
            this.deviceEntities().some((id) => previous.states[id] !== this.hass?.states[id]) ||
            previous.entities !== this.hass?.entities ||
            previous.locale !== this.hass?.locale ||
            previous.language !== this.hass?.language
        );
    }

    protected render(): TemplateResult | typeof nothing {
        if (!this.hass || !this.config) {
            return nothing;
        }
        if (!this.hass.states[this.config.entity]) {
            return this.message(this.text("error.entity_not_found", { entity: this.config.entity }));
        }
        if (this.error) {
            return this.message(this.error);
        }
        const held = this.isHeld();
        const view = this.view();
        const classes = [held ? "held" : "", this.chartHeight() === undefined ? "spread" : ""].join(" ");
        return html`
            <ha-card class=${classes} style=${this.cardStyle()}>
                <div class="card" @pointermove=${this.hover} @pointerdown=${this.hover} @pointerleave=${this.unhover}>
                    ${this.nights && this.width ? this.content(view) : nothing}
                </div>
                ${this.tooltip()}
            </ha-card>
        `;
    }

    protected updated(changed: PropertyValues): void {
        void this.fetch();
        const card = this.renderRoot.querySelector("ha-card");
        if (card && card !== this.observed) {
            this.resizes?.disconnect();
            this.resizes?.observe(card);
            this.observed = card;
        }
        if (![...changed.keys()].every((key) => ["extra", "gap", "filled", "held", "hovered"].includes(String(key)))) {
            this.measureSoon();
        }
        const calendar = this.renderRoot.querySelector(".scroller.calendar");
        if (calendar && calendar !== this.scrolledCalendar && calendar.scrollHeight > calendar.clientHeight) {
            calendar.scrollTop = calendar.scrollHeight;
            this.scrolledCalendar = calendar;
        }
    }

    // ---- Data ----

    private async fetch(): Promise<void> {
        const hass = this.hass;
        const entity = this.config?.entity;
        if (!hass?.callWS || !entity || !hass.states[entity] || this.retry !== undefined) {
            return;
        }
        // A new night or upload changes one of the machine's sensors, though not always the card's own.
        const key = [entity, ...this.deviceEntities().map((id) => hass.states[id]?.last_updated ?? "")].join("|");
        if (key === this.fetchedFor) {
            return;
        }
        this.fetchedFor = key;
        try {
            const result = await hass.callWS<{ nights: Night[] }>({ type: "resmed_myair_sleep/nights", entity_id: entity });
            if (key === this.fetchedFor) {
                this.nights = result.nights;
                this.error = undefined;
            }
        } catch (error) {
            if (key !== this.fetchedFor) {
                return;
            }
            if ((error as { code?: string })?.code === "not_found") {
                this.error = this.text("error.not_supported", { entity });
                return;
            }
            this.error = this.text("error.fetch_failed");
            this.retry = window.setTimeout(() => {
                this.retry = undefined;
                this.fetchedFor = undefined;
                this.error = undefined;
            }, RETRY);
        }
    }

    /** The card's sensor and the other sensors of its machine, found through its device in the registry. */
    private deviceEntities(): string[] {
        const entity = this.config?.entity ?? "";
        const device = this.hass?.entities?.[entity]?.device_id;
        if (!device) {
            return [entity];
        }
        return Object.values(this.hass?.entities ?? {}).flatMap((entry) => (entry && entry.device_id === device ? [entry.entity_id] : []));
    }

    // ---- Settings ----

    private view(): View {
        return this.config?.view ?? "last_night";
    }

    /** What the card draws: the view, or for the views over time and the room, their chart. */
    private shape(): string {
        const view = this.view();
        if (view === "nights") {
            return this.config?.nights_chart ?? "bars";
        }
        if (view === "room") {
            return this.config?.room_chart ?? "bins";
        }
        return view;
    }

    private limits(): Limits {
        return {
            ahi_limit: this.config?.ahi_limit ?? DEFAULT_LIMITS.ahi_limit,
            leak_limit: this.config?.leak_limit ?? DEFAULT_LIMITS.leak_limit,
            usage_hours: this.config?.usage_hours ?? DEFAULT_LIMITS.usage_hours,
        };
    }

    private metric(): Metric {
        return this.picked.metric ?? this.config?.metric ?? "ahi";
    }

    private line(): Room | "none" {
        return this.picked.line ?? this.config?.room_line ?? "temperature";
    }

    private room(): Room {
        return this.picked.room ?? this.config?.room ?? "temperature";
    }

    private days(): number {
        return this.config?.days ?? DEFAULT_DAYS;
    }

    private minimum(): number {
        return MIN_HEIGHTS[this.shape()] ?? MIN_HEIGHTS.last_night;
    }

    /** The chart's own height on automatic rows, or undefined for a view of rows. */
    private chartHeight(): number | undefined {
        switch (this.shape()) {
            case "bars":
                return BAR_CHART;
            case "charts":
                return 4 * SMALL_CHART;
            case "scatter":
                return SCATTER_CHART;
            default:
                return undefined;
        }
    }

    // ---- Views ----

    private content(view: View): TemplateResult {
        const nights = this.nights ?? [];
        if (!nights.length) {
            return html`${this.head(this.text(`view.${view}`))}
                <div class="part muted">${this.text("common.no_nights")}</div>`;
        }
        if (view === "last_night") {
            return this.lastNight(nights);
        }
        if (view === "nights") {
            const shape = this.shape();
            return shape === "calendar" ? this.calendar(nights) : shape === "charts" ? this.smallCharts(nights) : this.bars(nights);
        }
        return this.shape() === "scatter" ? this.scatterView(nights) : this.binsView(nights);
    }

    private head(title: string, aside?: TemplateResult | string): TemplateResult {
        return html`<div class="head part">
            <span class="title">${title}</span>${aside ? html`<span class="aside">${aside}</span>` : nothing}
        </div>`;
    }

    private chips<T extends string>(options: T[], chosen: T, pick: (value: T) => void, label: (value: T) => string): TemplateResult {
        return html`<div class="chips part">
            ${options.map(
                (value) =>
                    html`<button class="chip ${value === chosen ? "on" : ""}" aria-pressed=${value === chosen} @click=${() => pick(value)}>
                        ${label(value)}
                    </button>`,
            )}
        </div>`;
    }

    private lastNight(nights: Night[]): TemplateResult {
        const night = latestNight(nights) as Night;
        const limits = this.limits();
        const score = night.score;
        const scoreLevel = level("score", score, limits);
        const chip =
            score === undefined
                ? undefined
                : html`<span class="score" style="color: ${LEVEL_COLORS[scoreLevel ?? "good"]}"
                      >${this.text("last.score", { score: String(score) })}</span
                  >`;
        const parts: [string, number | undefined, number][] = [
            ["usage", night.usage_score, 70],
            ["ahi", night.ahi_score, 5],
            ["mask", night.mask_score, 5],
            ["leak", night.leak_score, 20],
        ];
        const shown = parts.filter(([, value]) => value !== undefined);
        const row = (icon: string, label: string, value: string, metric?: Metric, raw?: number) => {
            const mark = metric ? level(metric, raw, limits) : undefined;
            return html`<div class="figure">
                <ha-icon icon=${icon}></ha-icon><span class="label">${label}</span>
                <span class="value"
                    >${value}${mark ? html`<span class="dot" style="background: ${LEVEL_COLORS[mark]}"></span>` : nothing}</span
                >
            </div>`;
        };
        const usage = night.usage_minutes;
        return html`
            ${this.head(this.text("view.last_night"), html`<span class="date">${this.dayLabel(night.date)}</span>${chip ?? nothing}`)}
            <div class="part">
                ${night.start && night.end ? this.session(night) : html`<div class="muted">${this.text("last.no_session")}</div>`}
            </div>
            ${
                shown.length
                    ? html`<div class="parts part">
                          ${shown.map(
                              ([key, value, most]) =>
                                  html`<span class="score-part">${this.text(`last.part_${key}`)} <b>${value}</b>/${most}</span>`,
                          )}
                      </div>`
                    : nothing
            }
            <div class="scroller part">
                <div class="figures">
                    ${row("mdi:lungs", "AHI", this.number(night.ahi, 1), "ahi", night.ahi)}
                    ${row("mdi:timer-outline", this.text("metric.usage"), usage === undefined ? "–" : this.duration(usage), "usage", metricValue(night, "usage"))}
                    ${row("mdi:face-mask", this.text("metric.leak"), `${this.number(night.leak, 1)} L/min`, "leak", night.leak)}
                    ${row("mdi:face-mask-outline", this.text("last.mask_pairs"), this.number(night.mask_pairs, 0))}
                    ${
                        night.temperature === undefined
                            ? nothing
                            : row(
                                  "mdi:thermometer",
                                  this.text("room.temperature"),
                                  `${this.number(night.temperature, 1)} ${this.temperatureUnit()}`,
                              )
                    }
                    ${night.humidity === undefined ? nothing : row("mdi:water-percent", this.text("room.humidity"), `${this.number(night.humidity, 0)} %`)}
                </div>
            </div>
        `;
    }

    private session(night: Night): TemplateResult {
        const start = night.start as string;
        const end = night.end as string;
        return html`${timeline({
            width: this.width,
            start: this.hourOfNight(start, night.date),
            end: this.hourOfNight(end, night.date),
            startLabel: this.time(start),
            endLabel: this.time(end),
            hourLabel: (hour) => String(hour).padStart(2, "0"),
        })}`;
    }

    /** The nights of the window, each as a bar of the metric, coloured by its level. */
    private bars(nights: Night[]): TemplateResult {
        const metric = this.metric();
        const days = nightsIn(nights, windowEnd(nights, this.today()), this.days());
        const line = this.line();
        const height = BAR_CHART + this.extra;
        return html`
            ${this.head(this.text("view.nights"))}
            ${this.chips(
                METRICS,
                metric,
                (value) => (this.picked = { ...this.picked, metric: value }),
                (value) => this.text(`metric.${value}`),
            )}
            <div class="chart part">
                ${barChart(this.barsOf(days, metric), {
                    width: this.width,
                    height,
                    hovered: this.hovered?.index,
                    goal: this.goal(metric),
                    dates: this.dateLabels(days.map(({ date }) => date)),
                    line:
                        line === "none"
                            ? undefined
                            : {
                                  values: days.map(({ night }) => (used(night) ? night?.[line] : undefined)),
                                  color: line === "temperature" ? "var(--sleep-temperature)" : "var(--sleep-humidity)",
                                  label: (value) => `${this.number(value, 0)}${line === "temperature" ? "°" : "%"}`,
                              },
                    number: (value) => this.number(value, value % 1 ? 1 : 0),
                })}
            </div>
            ${this.chips(
                ["none", ...ROOMS] as (Room | "none")[],
                line,
                (value) => (this.picked = { ...this.picked, line: value }),
                (value) => this.text(value === "none" ? "room.none" : `room.with_${value}`),
            )}
        `;
    }

    private smallCharts(nights: Night[]): TemplateResult {
        const days = nightsIn(nights, windowEnd(nights, this.today()), this.days());
        const height = SMALL_CHART + this.extra / 4;
        return html`
            ${this.head(this.text("view.nights"))}
            ${METRICS.map(
                (metric, index) =>
                    html`<div class="small part">
                        <div class="small-label">
                            ${this.text(`metric.${metric}`)}${metric === "usage" ? ", h" : metric === "leak" ? ", L/min" : ""}
                        </div>
                        ${barChart(this.barsOf(days, metric), {
                            width: this.width,
                            height: height + (index === METRICS.length - 1 ? 16 : 0),
                            hovered: this.hovered?.index,
                            goal: this.goal(metric),
                            dates: index === METRICS.length - 1 ? this.dateLabels(days.map(({ date }) => date)) : undefined,
                            number: (value) => this.number(value, value % 1 ? 1 : 0),
                        })}
                    </div>`,
            )}
        `;
    }

    private calendar(nights: Night[]): TemplateResult {
        const metric = this.metric();
        const limits = this.limits();
        const end = windowEnd(nights, this.today());
        const days = nightsIn(nights, end, this.days());
        const byDate = new Map(days.map((day) => [day.date, day.night]));
        const months = [...new Set(days.map(({ date }) => date.slice(0, 7)))];
        const weekdays = Array.from({ length: 7 }, (_, index) =>
            new Intl.DateTimeFormat(this.language(), { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + index))),
        );
        const cell = (date: string) => {
            if (!byDate.has(date)) {
                return html`<div class="day outside"></div>`;
            }
            const night = byDate.get(date);
            const value = metricValue(night, metric);
            const unused = !used(night);
            const mark = unused ? undefined : level(metric, value, limits);
            const tooltip = `${this.dayLabel(date)} · ${unused ? this.text("calendar.unused") : `${this.text(`metric.${metric}`)} ${this.value(metric, value)}`}`;
            return html`<div class="day ${unused ? "unused" : (mark ?? "")}" title=${tooltip}>${Number(date.slice(8))}</div>`;
        };
        return html`
            ${this.head(this.text("view.nights"), this.text("calendar.compliance", { value: String(compliance(nights, end, limits)) }))}
            ${this.chips(
                METRICS,
                metric,
                (value) => (this.picked = { ...this.picked, metric: value }),
                (value) => this.text(`metric.${value}`),
            )}
            <div class="scroller calendar part">
                <div class="months">
                    ${months.map((month) => {
                        const first = `${month}-01`;
                        const length = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
                        // The first month starts at the week of the window's first day, not with weeks of empty days.
                        const weekday = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
                        const shown = days[0] && days[0].date > first ? addDays(days[0].date, -weekday(days[0].date)) : first;
                        const from = shown < first ? first : shown;
                        const skipped = Number(from.slice(8)) - 1;
                        return html`<div class="month">
                            <div class="month-name">${this.monthLabel(first)}</div>
                            <div class="grid">
                                ${weekdays.map((day) => html`<div class="weekday">${day}</div>`)}
                                ${Array.from({ length: weekday(from) }, () => html`<div></div>`)}
                                ${Array.from({ length: length - skipped }, (_, index) => cell(addDays(from, index)))}
                            </div>
                        </div>`;
                    })}
                </div>
            </div>
            <div class="legend part">
                <span class="good">${this.text("calendar.good")}</span><span class="high">${this.text("calendar.high")}</span>
                <span class="bad">${this.text("calendar.bad")}</span><span class="unused">${this.text("calendar.unused")}</span>
            </div>
        `;
    }

    /** The nights of the window, for the room's views. */
    private windowNights(nights: Night[]): Night[] {
        return nightsIn(nights, windowEnd(nights, this.today()), this.days()).flatMap(({ night }) => (night ? [night] : []));
    }

    private scatterView(nights: Night[]): TemplateResult {
        const room = this.room();
        const limits = this.limits();
        const points = roomNights(this.windowNights(nights), room);
        const leak = limits.leak_limit;
        const most = Math.round((leak * 5) / 3);
        return html`
            ${this.head(this.text("view.room"), this.text("room.nights", { count: String(points.length) }))}
            ${this.chips(
                ROOMS,
                room,
                (value) => (this.picked = { ...this.picked, room: value }),
                (value) => this.text(`room.${value}`),
            )}
            <div class="chart part">
                ${
                    points.length
                        ? scatter(
                              points.map((night) => ({
                                  x: night[room] as number,
                                  y: night.ahi as number,
                                  color: LEVEL_COLORS[level("leak", night.leak, limits) ?? "good"],
                                  tooltip: `${this.dayLabel(night.date)} · AHI ${this.number(night.ahi, 1)} · ${this.roomValue(room, night[room])} · ${this.text("metric.leak")} ${this.number(night.leak, 1)} L/min`,
                              })),
                              {
                                  width: this.width,
                                  height: SCATTER_CHART + this.extra,
                                  step: roomStep(room),
                                  goal: limits.ahi_limit,
                                  xTitle: `${this.text(`room.${room}`)}, ${room === "temperature" ? this.temperatureUnit() : "%"}`,
                                  number: (value) => this.number(value, value % 1 ? 1 : 0),
                              },
                          )
                        : html`<div class="muted empty" style="height: ${SCATTER_CHART + this.extra}px">${this.text("room.empty")}</div>`
                }
            </div>
            <div class="legend part">
                <span class="good">${this.text("room.leak_below", { value: this.number(leak, 0) })}</span>
                <span class="high">${this.number(leak, 0)}–${this.number(most, 0)}</span>
                <span class="bad">${this.text("room.leak_over", { value: this.number(most, 0) })}</span>
            </div>
        `;
    }

    private binsView(nights: Night[]): TemplateResult {
        const room = this.room();
        const limits = this.limits();
        const list = bins(this.windowNights(nights), room);
        const most = Math.max(2 * limits.ahi_limit, ...list.map((bin) => bin.average));
        const count = list.reduce((sum, bin) => sum + bin.count, 0);
        const unit = room === "temperature" ? this.temperatureUnit() : "%";
        return html`
            ${this.head(this.text("view.room"), this.text("room.nights", { count: String(count) }))}
            ${this.chips(
                ROOMS,
                room,
                (value) => (this.picked = { ...this.picked, room: value }),
                (value) => this.text(`room.${value}`),
            )}
            ${
                list.length
                    ? html`<div class="bins-head part">
                              <span>${this.text(`room.${room}`)}</span><span>${this.text("room.average_ahi")}</span
                              ><span>${this.text("room.ahi_nights")}</span>
                          </div>
                          <div class="scroller part">
                              ${list.map(
                                  (bin) =>
                                      html`<div
                                          class="bin"
                                          title=${this.text("room.bin_tooltip", { count: String(bin.count), least: this.number(bin.least, 1), most: this.number(bin.most, 1) })}
                                      >
                                          <span class="muted">${this.number(bin.from, 0)}–${this.number(bin.to, 0)} ${unit}</span>
                                          <span class="track"
                                              ><span
                                                  class="fill"
                                                  style="width: ${(bin.average / most) * 100}%; background: ${LEVEL_COLORS[level("ahi", bin.average, limits) ?? "good"]}"
                                              ></span
                                          ></span>
                                          <span class="figure-value"
                                              >${this.number(bin.average, 1)} <span class="muted">· ${bin.count}</span></span
                                          >
                                      </div>`,
                              )}
                          </div>`
                    : html`<div class="part muted">${this.text("room.empty")}</div>`
            }
        `;
    }

    /** A bar chart's night under the pointer. A touch keeps its tooltip until the next touch elsewhere. */
    private readonly hover = (event: PointerEvent): void => {
        const target = event.target as SVGElement;
        const card = this.renderRoot.querySelector<HTMLElement>("ha-card");
        if (!target.classList?.contains("hit") || !card) {
            this.hovered = undefined;
            return;
        }
        // The chart is the card's first svg in the views that have hover columns.
        const chart = card.querySelector("svg")?.getBoundingClientRect() ?? target.getBoundingClientRect();
        const position = tooltipPosition(target.getBoundingClientRect(), card.getBoundingClientRect(), chart.top, drawnScale(card));
        const index = Number(target.dataset.index);
        if (this.hovered?.index !== index || this.hovered.flip !== position.flip) {
            this.hovered = { index, ...position };
        }
    };

    private readonly unhover = (event: PointerEvent): void => {
        if (event.pointerType !== "touch") {
            this.hovered = undefined;
        }
    };

    /** The hovered night's date and values: the shown metric with the room's line, or all four beside the small charts. */
    private tooltip(): TemplateResult | typeof nothing {
        const hovered = this.hovered;
        const shape = this.shape();
        if (!hovered || !this.nights || (shape !== "bars" && shape !== "charts")) {
            return nothing;
        }
        const day = nightsIn(this.nights, windowEnd(this.nights, this.today()), this.days())[hovered.index];
        if (!day) {
            return nothing;
        }
        const night = day.night;
        const line = this.line();
        const row = (color: string, label: string, value: string) =>
            html`<div class="tip-row">
                <span class="tip-dot" style="background: ${color}"></span>${label}<span class="tip-value">${value}</span>
            </div>`;
        const rows = !used(night)
            ? [html`<div class="muted">${this.text("calendar.unused")}</div>`]
            : [
                  ...(shape === "charts" ? METRICS : [this.metric()]).map((metric) => {
                      const value = metricValue(night, metric);
                      return row(this.color(metric, value), this.text(`metric.${metric}`), this.value(metric, value));
                  }),
                  ...(shape === "bars" && line !== "none" && night?.[line] !== undefined
                      ? [
                            row(
                                line === "temperature" ? "var(--sleep-temperature)" : "var(--sleep-humidity)",
                                this.text(`room.${line}`),
                                this.roomValue(line, night[line]),
                            ),
                        ]
                      : []),
              ];
        const side = hovered.flip ? `right: ${hovered.x}px` : `left: ${hovered.x}px`;
        return html`<div class="tip" style="${side}; top: ${hovered.top}px">
            <div class="tip-date">${this.weekdayLabel(day.date)} ${this.dayLabel(day.date)}</div>
            ${rows}
        </div>`;
    }

    /** A metric's colour by its level, or the score's own. */
    private color(metric: Metric, value: number | undefined): string {
        const mark = metric === "score" ? undefined : level(metric, value, this.limits());
        return mark ? LEVEL_COLORS[mark] : "var(--sleep-score)";
    }

    private barsOf(days: { date: string; night?: Night }[], metric: Metric): Bar[] {
        return days.map(({ night }) => {
            const value = metricValue(night, metric);
            return {
                value,
                color: this.color(metric, value),
            };
        });
    }

    private goal(metric: Metric): { value: number; label: string } | undefined {
        const limits = this.limits();
        switch (metric) {
            case "ahi":
                return { value: limits.ahi_limit, label: this.text("goal.below", { value: this.number(limits.ahi_limit, 0) }) };
            case "leak":
                return {
                    value: limits.leak_limit,
                    label: this.text("goal.below", { value: `${this.number(limits.leak_limit, 0)} L/min` }),
                };
            case "usage":
                return {
                    value: limits.usage_hours,
                    label: this.text("goal.at_least", { value: `${this.number(limits.usage_hours, 0)} h` }),
                };
            default:
                return undefined;
        }
    }

    /** About five dates under the bars, by the bars' index. */
    private dateLabels(dates: string[]): Map<number, string> {
        const step = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor(this.width / 70))));
        return new Map(dates.flatMap((date, index) => (index % step === 0 ? [[index, this.dayLabel(date)] as [number, string]] : [])));
    }

    // ---- Sizing ----

    private measureSoon(): void {
        cancelAnimationFrame(this.frame ?? 0);
        this.frame = requestAnimationFrame(() => this.measure());
    }

    /**
     * The content's width, then the height. Held to a height, a chart takes the room left from the other parts, at
     * least its least, and a view of rows scrolls its rows. On automatic rows in a sections view, the card fills whole
     * rows, the chart taking what that leaves over or, in a view of rows, the room spread between the parts.
     */
    private measure(): void {
        const card = this.renderRoot.querySelector<HTMLElement>("ha-card");
        const inner = card?.querySelector<HTMLElement>(":scope > .card");
        if (!card || !inner || !card.clientWidth || !this.config) {
            return;
        }
        const style = getComputedStyle(inner);
        const width = Math.floor(inner.clientWidth - px(style.paddingLeft) - px(style.paddingRight));
        if (width !== this.width) {
            this.width = width;
            return;
        }
        const chart = this.chartHeight();
        const content = this.contentHeight(card, inner);
        if (content === undefined) {
            return;
        }
        const room = this.heldRoom(card, content);
        if (room !== undefined) {
            this.filled = 0;
            if (chart !== undefined) {
                const least = this.shape() === "charts" ? 4 * MIN_SMALL_CHART : MIN_CHART;
                // `content` was drawn with the chart's current room, which the chart gives back first.
                const extra = Math.max(least - chart, this.extra + Math.floor(room - content));
                this.grow(chart, extra);
            }
            return;
        }
        const limit = fillLimit(this.config, this.layout, this.minimum());
        if (!limit) {
            this.filled = 0;
            this.grow(chart, 0);
            return;
        }
        // Measured as drawn without the room the chart and its gaps were given.
        const own = content - (chart === undefined ? 0 : this.extra + 2 * this.gap);
        const filled = filledHeight(own, this.config, limit);
        this.filled = filled;
        this.grow(chart, chart === undefined ? 0 : spareRoom(filled, own));
    }

    /**
     * Gives a chart `extra` pixels over its own height, of which the first widen its gaps above and below, up to 20 px
     * each. The small charts have no gaps of their own and take it all.
     */
    private grow(chart: number | undefined, extra: number): void {
        if (chart === undefined || this.shape() === "charts") {
            this.extra = chart === undefined ? 0 : extra;
            this.gap = 0;
            return;
        }
        const gap = Math.min(CHART_GAP_PX, Math.max(0, Math.floor(extra / 2)));
        this.gap = extra > 0 ? gap : 0;
        this.extra = extra - 2 * this.gap;
    }

    /**
     * The content's height as drawn: from the card's top to the end of its last part, with the card's padding and
     * border under it. A part that scrolls counts at its whole height, so a held card knows what it would need.
     */
    private contentHeight(card: HTMLElement, inner: HTMLElement): number | undefined {
        const parts = [...inner.querySelectorAll<HTMLElement>(":scope > .part")];
        const last = parts.at(-1);
        if (!last) {
            return undefined;
        }
        const scale = drawnScale(card);
        const hidden = parts.reduce(
            (sum, part) => sum + (part.classList.contains("scroller") ? part.scrollHeight - part.clientHeight : 0),
            0,
        );
        const gaps = (parts.length - 1) * px(getComputedStyle(inner).rowGap);
        // A chart's gaps are its margins, which the drawn rectangle leaves out.
        const heights = parts.reduce((sum, part) => {
            const style = getComputedStyle(part);
            return sum + part.getBoundingClientRect().height / scale + px(style.marginTop) + px(style.marginBottom);
        }, 0);
        return (
            heights +
            hidden +
            gaps +
            px(getComputedStyle(inner).paddingTop) +
            px(getComputedStyle(inner).paddingBottom) +
            px(getComputedStyle(card).borderTopWidth) +
            px(getComputedStyle(card).borderBottomWidth)
        );
    }

    /** The height the card is held to, or undefined while it takes its content's. A card growing up to a limit is held once its content passes it. */
    private heldRoom(card: HTMLElement, content: number): number | undefined {
        const config = this.config ?? ({} as SleepCardConfig);
        if (this.growsToLimit()) {
            const limit = Math.max(config.max_height ?? 0, this.minimum());
            const own = content - (this.chartHeight() === undefined ? 0 : this.extra + 2 * this.gap);
            this.held = own > limit ? limit : 0;
            return this.held || undefined;
        }
        this.held = 0;
        return heightStyle(config, this.layout, this.minimum()) ? card.offsetHeight : undefined;
    }

    private isHeld(): boolean {
        return this.held > 0 || (heightStyle(this.config ?? {}, this.layout, this.minimum()) !== "" && !this.growsToLimit());
    }

    private growsToLimit(): boolean {
        const config = this.config ?? {};
        return heightMode(config) === "max" && heightStyle(config, this.layout, this.minimum()).startsWith("max-height");
    }

    private cardStyle(): string {
        const gap = this.gap ? `--sleep-gap: ${this.gap}px` : "";
        const height = this.held ? `height: ${this.held}px` : filledStyle(this.config ?? {}, this.layout, this.minimum(), this.filled);
        return [height, gap].filter(Boolean).join("; ");
    }

    // ---- Formats ----

    private zone(): string | undefined {
        return this.hass?.locale?.time_zone === "server" ? this.hass.config?.time_zone : undefined;
    }

    private today(): string {
        return new Intl.DateTimeFormat("en-CA", { timeZone: this.zone(), year: "numeric", month: "2-digit", day: "2-digit" }).format(
            new Date(),
        );
    }

    /** A time as hours from the night's evening midnight, so the next morning's 07:15 is 31.25. */
    private hourOfNight(iso: string, date: string): number {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: this.zone(),
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date(iso));
        const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "0";
        const day = `${part("year")}-${part("month")}-${part("day")}`;
        const hour = Number(part("hour")) + Number(part("minute")) / 60;
        return day > date ? hour + 24 : hour;
    }

    private time(iso: string): string {
        return new Intl.DateTimeFormat(this.language(), { timeZone: this.zone(), hour: "2-digit", minute: "2-digit" }).format(
            new Date(iso),
        );
    }

    private dayLabel(date: string): string {
        return new Intl.DateTimeFormat(this.language(), { timeZone: "UTC", day: "numeric", month: "numeric" }).format(
            new Date(`${date}T00:00:00Z`),
        );
    }

    private weekdayLabel(date: string): string {
        return new Intl.DateTimeFormat(this.language(), { timeZone: "UTC", weekday: "short" }).format(new Date(`${date}T00:00:00Z`));
    }

    private monthLabel(date: string): string {
        return new Intl.DateTimeFormat(this.language(), { timeZone: "UTC", month: "long", year: "numeric" }).format(
            new Date(`${date}T00:00:00Z`),
        );
    }

    private number(value: number | undefined, decimals: number): string {
        if (value === undefined) {
            return "–";
        }
        return new Intl.NumberFormat(numberLocale(this.hass, this.language()), {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: this.hass?.locale?.number_format !== "none",
        }).format(value);
    }

    private duration(minutes: number): string {
        return this.text("common.duration", { hours: String(Math.floor(minutes / 60)), minutes: String(minutes % 60).padStart(2, "0") });
    }

    private value(metric: Metric, value: number | undefined): string {
        switch (metric) {
            case "usage":
                return value === undefined ? "–" : this.duration(Math.round(value * 60));
            case "leak":
                return `${this.number(value, 1)} L/min`;
            case "score":
                return this.number(value, 0);
            default:
                return this.number(value, 1);
        }
    }

    private roomValue(room: Room, value: number | undefined): string {
        return room === "temperature" ? `${this.number(value, 1)} ${this.temperatureUnit()}` : `${this.number(value, 0)} %`;
    }

    /** The unit of the machine's temperature sensor, which is the room's own sensor's. */
    private temperatureUnit(): string {
        const id = this.deviceEntities().find((entity) => this.hass?.entities?.[entity]?.translation_key === "temperature");
        const unit = id ? this.hass?.states[id]?.attributes.unit_of_measurement : undefined;
        return typeof unit === "string" ? unit : "°C";
    }

    private message(text: string): TemplateResult {
        return html`<ha-card><div class="card message">${text}</div></ha-card>`;
    }

    private text(key: string, replacements: Record<string, string> = {}): string {
        let text = translate(this.language(), key);
        for (const [name, value] of Object.entries(replacements)) {
            text = text.replaceAll(`{${name}}`, value);
        }
        return text;
    }

    private language(): string {
        return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
    }

    static get styles(): CSSResultGroup {
        return [
            fadeStyles,
            css`
                /* As tall as a sections view's grid rows make its cell, which a card held by them fills. */
                :host {
                    display: block;
                    height: 100%;
                    --sleep-good: var(--sleep-good-color, var(--success-color, #4caf50));
                    --sleep-high: var(--sleep-high-color, var(--warning-color, #ff9800));
                    --sleep-bad: var(--sleep-bad-color, var(--error-color, #db4437));
                    --sleep-score: var(--sleep-score-color, var(--primary-color, #03a9f4));
                    --sleep-temperature: var(--sleep-temperature-color, #9c6ade);
                    --sleep-humidity: var(--sleep-humidity-color, var(--info-color, #039be5));
                }
                ha-card {
                    height: 100%;
                    overflow: hidden;
                    transition: none;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    container-type: inline-size;
                    position: relative;
                }
                .card {
                    display: flex;
                    flex-direction: column;
                    flex: 1 0 auto;
                    gap: 12px;
                    box-sizing: border-box;
                    padding: 16px;
                    min-height: 0;
                }
                ha-card.spread:not(.held) .card {
                    justify-content: space-between;
                }
                ha-card.held .card {
                    flex: 1 1 0;
                }
                ha-card.held .scroller {
                    flex: 1 1 0;
                    min-height: 0;
                    overflow-y: auto;
                }
                .chart {
                    margin: var(--sleep-gap, 0px) 0;
                }
                .message,
                .muted {
                    color: var(--secondary-text-color);
                }
                .message {
                    padding: 16px;
                }
                .head {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .title {
                    font-size: 16px;
                    font-weight: 500;
                    flex: 1 1 auto;
                }
                .aside {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    color: var(--secondary-text-color);
                    font-size: 12px;
                }
                .score {
                    font-weight: 600;
                    font-size: 12px;
                }
                .chips {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .chip {
                    font: inherit;
                    font-size: 12px;
                    border: 1px solid var(--divider-color);
                    background: none;
                    color: var(--secondary-text-color);
                    border-radius: 999px;
                    padding: 3px 10px;
                    cursor: pointer;
                }
                .chip.on {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                svg {
                    display: block;
                    overflow: visible;
                    font-family: inherit;
                }
                svg text {
                    font-size: 10px;
                    fill: var(--secondary-text-color);
                }
                svg .grid {
                    stroke: var(--divider-color);
                }
                svg .dashed {
                    stroke-dasharray: 3 3;
                }
                svg .goal {
                    stroke: var(--sleep-high);
                    stroke-width: 1.2;
                }
                svg .goal-label {
                    fill: var(--sleep-high);
                    font-weight: 500;
                    paint-order: stroke;
                    stroke: var(--ha-card-background, var(--card-background-color));
                    stroke-width: 3px;
                    stroke-linejoin: round;
                }
                svg .hit {
                    fill: transparent;
                }
                svg .hover {
                    fill: var(--primary-text-color);
                    fill-opacity: 0.1;
                }
                svg .halo {
                    fill: none;
                    stroke: var(--ha-card-background, var(--card-background-color));
                    stroke-width: 6px;
                    stroke-linejoin: round;
                    stroke-opacity: 0.85;
                }
                svg .dot {
                    stroke: var(--ha-card-background, var(--card-background-color));
                    stroke-width: 1.2px;
                }
                .tip {
                    position: absolute;
                    z-index: 1;
                    pointer-events: none;
                    padding: 6px 10px;
                    border: 1px solid var(--divider-color);
                    border-radius: 8px;
                    background: var(--ha-card-background, var(--card-background-color));
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    font-size: 12px;
                    line-height: 1.5;
                    white-space: nowrap;
                    color: var(--primary-text-color);
                }
                .tip-date {
                    font-weight: 500;
                }
                .tip-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .tip-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .tip-value {
                    margin-left: auto;
                    padding-left: 12px;
                    font-variant-numeric: tabular-nums;
                }
                svg .session {
                    fill: color-mix(in srgb, var(--sleep-score) 35%, transparent);
                    stroke: var(--sleep-score);
                }
                svg .session-label {
                    font-size: 11px;
                    fill: var(--primary-text-color);
                }
                .parts {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 14px;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }
                .parts b {
                    color: var(--primary-text-color);
                    font-weight: 600;
                }
                .figures {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    column-gap: 18px;
                }
                /* One column on a card narrower than 380 px. */
                @container (max-width: 346px) {
                    .figures {
                        grid-template-columns: 1fr;
                    }
                }
                .figure {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 7px 0;
                    border-bottom: 1px solid var(--divider-color);
                    font-size: 14px;
                }
                .figure ha-icon {
                    color: var(--state-icon-color);
                    --mdc-icon-size: 18px;
                }
                .figure .label {
                    flex: 1 1 auto;
                }
                .figure .value {
                    font-weight: 600;
                    white-space: nowrap;
                }
                .dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-left: 6px;
                }
                .small-label {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    margin-bottom: 2px;
                }
                .months {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
                    gap: 14px;
                }
                .month {
                    max-width: 210px;
                }
                .month-name {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    margin-bottom: 6px;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 3px;
                }
                .weekday {
                    font-size: 10px;
                    color: var(--secondary-text-color);
                    text-align: center;
                }
                .day {
                    aspect-ratio: 1;
                    border-radius: 4px;
                    font-size: 9px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 2px 3px;
                    box-sizing: border-box;
                    background: color-mix(in srgb, var(--divider-color) 60%, transparent);
                    color: var(--primary-text-color);
                }
                .day.good {
                    background: color-mix(in srgb, var(--sleep-good) 55%, transparent);
                }
                .day.high {
                    background: color-mix(in srgb, var(--sleep-high) 60%, transparent);
                }
                .day.bad {
                    background: color-mix(in srgb, var(--sleep-bad) 65%, transparent);
                }
                .day.unused {
                    background: color-mix(in srgb, var(--sleep-bad) 12%, transparent);
                }
                .day.outside {
                    background: none;
                }
                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 12px;
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }
                .legend span::before {
                    content: "";
                    display: inline-block;
                    width: 9px;
                    height: 9px;
                    border-radius: 3px;
                    margin-right: 5px;
                    vertical-align: -1px;
                }
                .legend .good::before {
                    background: var(--sleep-good);
                }
                .legend .high::before {
                    background: var(--sleep-high);
                }
                .legend .bad::before {
                    background: var(--sleep-bad);
                }
                .legend .unused::before {
                    background: color-mix(in srgb, var(--sleep-bad) 25%, transparent);
                }
                .bins-head,
                .bin {
                    display: grid;
                    grid-template-columns: 78px 1fr auto;
                    gap: 8px;
                    align-items: center;
                }
                .bins-head {
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }
                .bin {
                    font-size: 13px;
                    padding: 4px 0;
                }
                .track {
                    height: 14px;
                    background: var(--divider-color);
                    border-radius: 5px;
                    overflow: hidden;
                }
                .fill {
                    display: block;
                    height: 100%;
                    border-radius: 5px;
                    opacity: 0.85;
                }
                .figure-value {
                    font-weight: 600;
                    white-space: nowrap;
                }
                .empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `,
        ];
    }
}

function px(value: string): number {
    return Number.parseFloat(value) || 0;
}

if (!customElements.get("resmed-myair-sleep-card")) {
    console.info(
        `%c  RESMED-MYAIR-SLEEP-CARD \n%c  ${CARD_VERSION}    `,
        "color: orange; font-weight: bold; background: black",
        "color: white; font-weight: bold; background: dimgray",
    );

    const registry = window as unknown as { customCards?: CardRegistration[] };
    registry.customCards = registry.customCards ?? [];
    registry.customCards.push({
        type: "resmed-myair-sleep-card",
        name: translate(browserLanguage(), "common.name"),
        description: translate(browserLanguage(), "common.description"),
        documentationURL: "https://github.com/jesmak/resmed_myair_sleep#sleep-card",
        preview: true,
    });
    customElements.define("resmed-myair-sleep-card", ResmedMyairSleepCard);
}

declare global {
    interface HTMLElementTagNameMap {
        "resmed-myair-sleep-card": ResmedMyairSleepCard;
    }
}
