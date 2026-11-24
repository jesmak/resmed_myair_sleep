import type { ScrollIndicator } from "./fade";

/** Replaced at build time with the integration's version from manifest.json. */
declare const __CARD_VERSION__: string;

export const CARD_VERSION = __CARD_VERSION__;

/** A held card's scrolling parts show both their fading edges and a thin scrollbar. */
export const DEFAULT_SCROLL_INDICATOR: ScrollIndicator = "both";
