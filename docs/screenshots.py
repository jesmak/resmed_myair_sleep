"""Writes docs/screenshots.json, the plan for the README's screenshots (see hass-screenshots).

A mid-October morning after about two hundred made-up nights, shaped like a real CPAP's: mostly good nights, a few
short or leaky ones, some nights without the machine, and a bedroom cooling from summer into autumn, its warmer nights
a little worse for AHI. Run it after changing the data, then shoot the images:
python3 docs/screenshots.py && npm run shoot -- <this repo> in hass-screenshots.
"""

import json
import math
import random
from datetime import UTC, date, datetime, timedelta, timezone
from pathlib import Path

random.seed(20261014)
LOCAL = timezone(timedelta(hours=3))
CLOCK = datetime(2026, 10, 14, 9, 30, tzinfo=LOCAL)
NIGHTS = 200
DOMAIN = "resmed_myair_sleep"
DEVICE = "airsense"
PREFIX = "sensor.airsense_11_autoset"


def iso(t: datetime) -> str:
    return t.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S+00:00")


def leak_value() -> float:
    """Leak in myAir's steps of 1.2 L/min: mostly low, now and then a leaky night."""
    if random.random() < 0.12:
        return round(1.2 * random.randint(25, 55), 1)
    return round(1.2 * max(3, round(random.gauss(14, 5))), 1)


def night(day: date, temperature: float, humidity: float, used: bool = False) -> dict:
    if not used and random.random() < 0.12:
        return {
            "date": day.isoformat(),
            "usage_minutes": 0,
            "ahi": 0.0,
            "leak": 0.0,
            "mask_pairs": 0,
            "score": 0,
            "usage_score": 0,
            "ahi_score": 0,
            "mask_score": 0,
            "leak_score": 0,
        }
    usage = random.randint(70, 200) if not used and random.random() < 0.1 else max(240, min(560, round(random.gauss(400, 55))))
    # Warmer nights are a little worse, as on the card's room views.
    ahi = round(max(0.3, random.gauss(2.4 + 0.45 * (temperature - 20), 1.1)), 1)
    if random.random() < 0.06:
        ahi = round(ahi + random.uniform(4, 8), 1)
    leak = leak_value()
    pairs = 1 if random.random() < 0.7 else random.randint(2, 4)
    usage_score = min(70, round(usage / 6))
    ahi_score = 5 if ahi < 5 else 3 if ahi < 10 else 1
    mask_score = 5 if pairs <= 2 else 3
    leak_score = 20 if leak < 24 else 15 if leak < 40 else 5
    bed = datetime(day.year, day.month, day.day, 22, 50, tzinfo=LOCAL) + timedelta(minutes=random.randint(0, 110))
    end = bed + timedelta(minutes=usage)
    readings = max(1, usage // 15)
    return {
        "date": day.isoformat(),
        "start": iso(bed),
        "end": iso(end),
        "usage_minutes": usage,
        "ahi": ahi,
        "leak": leak,
        "mask_pairs": pairs,
        "score": usage_score + ahi_score + mask_score + leak_score,
        "usage_score": usage_score,
        "ahi_score": ahi_score,
        "mask_score": mask_score,
        "leak_score": leak_score,
        "temperature": round(temperature, 2),
        "temperature_min": round(temperature - random.uniform(0.3, 0.9), 2),
        "temperature_max": round(temperature + random.uniform(0.2, 0.6), 2),
        "temperature_readings": readings,
        "humidity": round(humidity, 2),
        "humidity_min": round(humidity - random.uniform(0.5, 2.0), 2),
        "humidity_max": round(humidity + random.uniform(0.5, 2.0), 2),
        "humidity_readings": readings,
    }


def nights() -> list[dict]:
    last = CLOCK.date() - timedelta(days=1)
    out = []
    for back in range(NIGHTS - 1, -1, -1):
        day = last - timedelta(days=back)
        # The bedroom follows the season, warmest in late July, with a few days' weather on top.
        season = math.cos((day.timetuple().tm_yday - 205) / 365 * 2 * math.pi)
        temperature = 20.3 + 2.4 * season + random.gauss(0, 0.5)
        humidity = 43 + 9 * season + random.gauss(0, 3)
        # The last night is a real one, as the card's first view shows it.
        out.append(night(day, temperature, humidity, used=back == 0))
    return out


SENSORS = {
    "ahi": ("ahi", None),
    "usage": ("usage", "min"),
    "leak": ("leak", "L/min"),
    "score": ("score", None),
    "temperature": ("temperature", "°C"),
    "humidity": ("humidity", "%"),
    "compliance_30_days": ("compliance", "%"),
}


def plan() -> dict:
    data = nights()
    latest = data[-1]
    values = {
        "ahi": latest["ahi"],
        "usage": latest["usage_minutes"],
        "leak": latest["leak"],
        "score": latest["score"],
        "temperature": latest.get("temperature"),
        "humidity": latest.get("humidity"),
        "compliance_30_days": round(100 * sum(n["usage_minutes"] >= 240 for n in data[-30:]) / 30),
    }
    states = {}
    entities = {}
    for slug, (key, unit) in SENSORS.items():
        entity = f"{PREFIX}_{slug}"
        attributes = {"friendly_name": f"AirSense 11 AutoSet {key.replace('_', ' ')}", "state_class": "measurement"}
        if unit:
            attributes["unit_of_measurement"] = unit
        states[entity] = {"state": str(values[slug]), "attributes": attributes}
        entities[entity] = {"platform": DOMAIN, "device_id": DEVICE, "translation_key": key}
    card = {"type": "custom:resmed-myair-sleep-card", "entity": f"{PREFIX}_ahi"}
    return {
        "resources": [f"custom_components/{DOMAIN}/www/resmed-myair-sleep-card.js"],
        "clock": CLOCK.isoformat(),
        "devices": {DEVICE: {"name": "AirSense 11 AutoSet"}},
        "entities": entities,
        "states": states,
        "commands": {f"{DOMAIN}/nights": [{"result": {"nights": data}}]},
        "shots": [
            {
                "name": "dashboard",
                "width": 1280,
                "view": {
                    "type": "sections",
                    "max_columns": 3,
                    "sections": [
                        {"type": "grid", "cards": [card, {**card, "view": "nights", "room_line": "temperature"}]},
                        {
                            "type": "grid",
                            "cards": [{**card, "view": "nights", "nights_chart": "charts", "days": 180}, {**card, "view": "room"}],
                        },
                        {"type": "grid", "cards": [{**card, "view": "nights", "nights_chart": "calendar"}]},
                    ],
                },
            },
            {"name": "sleep-last-night", "width": 500, "card": card},
            {"name": "sleep-nights", "width": 500, "card": {**card, "view": "nights", "room_line": "temperature"}},
        ],
    }


Path(__file__).with_name("screenshots.json").write_text(json.dumps(plan(), ensure_ascii=False, indent=4) + "\n", encoding="utf-8")
