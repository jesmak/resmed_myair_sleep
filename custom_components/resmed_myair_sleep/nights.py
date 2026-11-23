"""The nights kept in storage: merging myAir's records, the session's start and end, the room's conditions and compliance.

A night is a dict keyed by its date, myAir's `startDate`. A night that starts after midnight still carries the
previous day's date.
"""

from collections.abc import Iterable
from datetime import date, datetime, timedelta
from typing import Any

from .models import MyAirSleepRecord

# myAir's field → the night's field.
RECORD_FIELDS = {
    "ahi": "ahi",
    "leakPercentile": "leak",
    "maskPairCount": "mask_pairs",
    "sleepScore": "score",
    "usageScore": "usage_score",
    "ahiScore": "ahi_score",
    "maskScore": "mask_score",
    "leakScore": "leak_score",
}

# The fields a night can have, for validating imported nights.
NIGHT_FIELDS = {
    "date": str,
    "start": datetime,
    "end": datetime,
    "usage_minutes": int,
    "ahi": float,
    "leak": float,
    "mask_pairs": int,
    "score": int,
    "usage_score": int,
    "ahi_score": int,
    "mask_score": int,
    "leak_score": int,
    "temperature": float,
    "temperature_min": float,
    "temperature_max": float,
    "temperature_readings": int,
    "humidity": float,
    "humidity_min": float,
    "humidity_max": float,
    "humidity_readings": int,
}

# The usual definition of CPAP compliance: at least 4 hours on a night, counted over 30 days.
COMPLIANT_MINUTES = 240
COMPLIANCE_DAYS = 30


def merge_records(nights: dict[str, dict[str, Any]], records: Iterable[MyAirSleepRecord], report_time: datetime | None) -> set[str]:
    """Update `nights` in place from myAir's records and return the dates whose night changed.

    The newest night with usage gets its start once, as the machine's last upload minus the usage: the machine
    uploads when the mask comes off. Every night with a start gets its end as the start plus the usage, which
    leaves out any time the mask was off in between.
    """
    changed: set[str] = set()
    for record in records:
        # myAir lists a day without a record as an item without a patient ID.
        if record.start_date is None or record.raw.get("sleepRecordPatientId") is None:
            continue
        key = record.start_date.isoformat()
        night = nights.setdefault(key, {"date": key})
        values = {stored: record.raw.get(raw) for raw, stored in RECORD_FIELDS.items()}
        values["usage_minutes"] = record.total_usage_minutes
        for field, value in values.items():
            if value is not None and night.get(field) != value:
                night[field] = value
                changed.add(key)

    used = [key for key, night in nights.items() if night.get("usage_minutes")]
    if used and report_time is not None:
        newest = nights[max(used)]
        # The upload is the newest night's own only from the night's date to the next day. A later one belongs to a
        # night whose record myAir hasn't made yet.
        night_date = date.fromisoformat(newest["date"])
        if newest.get("start") is None and night_date <= report_time.date() <= night_date + timedelta(days=1):
            newest["start"] = (report_time - timedelta(minutes=newest["usage_minutes"])).isoformat()
            changed.add(newest["date"])

    for key in changed:
        set_end(nights[key])
    return changed


def set_end(night: dict[str, Any]) -> None:
    """Set the night's end as its start plus the usage, when it has both."""
    if night.get("start") and night.get("usage_minutes") is not None:
        night["end"] = (datetime.fromisoformat(night["start"]) + timedelta(minutes=night["usage_minutes"])).isoformat()


def summarize(readings: list[tuple[datetime, float | None]], start: datetime, end: datetime) -> dict[str, float | int] | None:
    """Return the time-weighted mean, the minimum, the maximum and the count of the readings over [start, end].

    `readings` are a sensor's states in time order, the first one possibly from before `start` (the state the
    sensor was in when the window opened). A `None` is a state that isn't a number, and its time is left out.
    """
    weighted = 0.0
    covered = 0.0
    values: list[float] = []
    for index, (changed_at, value) in enumerate(readings):
        until = readings[index + 1][0] if index + 1 < len(readings) else end
        span_start = max(changed_at, start)
        span_end = min(until, end)
        if value is None or span_end <= span_start:
            continue
        seconds = (span_end - span_start).total_seconds()
        weighted += value * seconds
        covered += seconds
        values.append(value)
    if not values:
        return None
    return {"mean": round(weighted / covered, 2), "min": min(values), "max": max(values), "readings": len(values)}


def compliance(nights: dict[str, dict[str, Any]], today: date) -> int | None:
    """Return the share of the last 30 nights with at least 4 hours of use, as a whole percentage.

    The 30 nights end at the newest night, or the night before last when the newest is older, so a night that
    myAir hasn't received yet doesn't count against it before the morning's upload. A night with no record
    counts as a night without use.
    """
    if not nights:
        return None
    newest = date.fromisoformat(max(nights))
    last = min(max(newest, today - timedelta(days=2)), today - timedelta(days=1))
    first = last - timedelta(days=COMPLIANCE_DAYS - 1)
    compliant = sum(
        1
        for key, night in nights.items()
        if first <= date.fromisoformat(key) <= last and (night.get("usage_minutes") or 0) >= COMPLIANT_MINUTES
    )
    return round(100 * compliant / COMPLIANCE_DAYS)
