"""The night logic: merging records, the session's start and end, the conditions and compliance."""

from datetime import UTC, date, datetime, timedelta

from custom_components.resmed_myair_sleep.models import MyAirSleepRecord
from custom_components.resmed_myair_sleep.nights import compliance, merge_records, summarize


def record(day: str, usage: int, ahi: float = 2.0, patient: str | None = "p1", **extra: object) -> MyAirSleepRecord:
    return MyAirSleepRecord.from_api(
        {
            "startDate": day,
            "totalUsage": usage,
            "ahi": ahi,
            "leakPercentile": 12.5,
            "maskPairCount": 1,
            "sleepScore": 80,
            "usageScore": 60,
            "ahiScore": 5,
            "maskScore": 5,
            "leakScore": 10,
            "sleepRecordPatientId": patient,
            **extra,
        }
    )


REPORT = datetime(2026, 3, 11, 7, 0, tzinfo=UTC)


def test_merge_stores_every_field_and_reports_the_changed_nights():
    nights: dict = {}
    changed = merge_records(nights, [record("2026-03-09", 400), record("2026-03-10", 420)], REPORT)
    assert changed == {"2026-03-09", "2026-03-10"}
    assert nights["2026-03-09"] == {
        "date": "2026-03-09",
        "usage_minutes": 400,
        "ahi": 2.0,
        "leak": 12.5,
        "mask_pairs": 1,
        "score": 80,
        "usage_score": 60,
        "ahi_score": 5,
        "mask_score": 5,
        "leak_score": 10,
    }


def test_a_day_without_a_record_is_skipped():
    nights: dict = {}
    merge_records(nights, [record("2026-03-10", 0, patient=None)], REPORT)
    assert nights == {}


def test_a_night_without_use_is_kept():
    nights: dict = {}
    merge_records(nights, [record("2026-03-10", 0)], REPORT)
    assert nights["2026-03-10"]["usage_minutes"] == 0
    assert "start" not in nights["2026-03-10"]


def test_only_the_newest_night_gets_a_start_from_the_upload():
    nights: dict = {}
    merge_records(nights, [record("2026-03-09", 400), record("2026-03-10", 420)], REPORT)
    assert "start" not in nights["2026-03-09"]
    assert nights["2026-03-10"]["start"] == (REPORT - timedelta(minutes=420)).isoformat()
    assert nights["2026-03-10"]["end"] == REPORT.isoformat()


def test_the_start_is_set_once_and_the_end_follows_the_usage():
    nights: dict = {}
    early = datetime(2026, 3, 11, 0, 30, tzinfo=UTC)
    merge_records(nights, [record("2026-03-10", 30)], early)
    start = nights["2026-03-10"]["start"]
    assert start == (early - timedelta(minutes=30)).isoformat()

    changed = merge_records(nights, [record("2026-03-10", 410)], REPORT)
    assert changed == {"2026-03-10"}
    assert nights["2026-03-10"]["start"] == start
    assert nights["2026-03-10"]["end"] == (early - timedelta(minutes=30) + timedelta(minutes=410)).isoformat()


def test_an_unchanged_poll_changes_nothing():
    nights: dict = {}
    merge_records(nights, [record("2026-03-10", 420)], REPORT)
    assert merge_records(nights, [record("2026-03-10", 420)], REPORT) == set()


def test_no_start_from_an_upload_older_than_the_night():
    nights: dict = {}
    merge_records(nights, [record("2026-03-10", 420)], datetime(2026, 3, 9, 7, 0, tzinfo=UTC))
    assert "start" not in nights["2026-03-10"]


def test_no_start_from_an_upload_newer_than_the_next_day():
    nights: dict = {}
    merge_records(nights, [record("2026-03-10", 420)], datetime(2026, 3, 12, 7, 0, tzinfo=UTC))
    assert "start" not in nights["2026-03-10"]


def test_an_imported_value_survives_a_record_without_it():
    nights = {"2026-03-10": {"date": "2026-03-10", "temperature": 19.5}}
    merge_records(nights, [record("2026-03-10", 420)], REPORT)
    assert nights["2026-03-10"]["temperature"] == 19.5


START = datetime(2026, 3, 10, 22, 0, tzinfo=UTC)
END = START + timedelta(hours=8)


def test_summarize_weights_by_time_and_counts_the_state_at_the_start():
    readings = [(START - timedelta(hours=2), 20.0), (START + timedelta(hours=6), 18.0)]
    assert summarize(readings, START, END) == {"mean": 19.5, "min": 18.0, "max": 20.0, "readings": 2}


def test_summarize_leaves_out_unknown_time_and_readings_after_the_end():
    readings = [(START, 20.0), (START + timedelta(hours=4), None), (START + timedelta(hours=6), 18.0), (END + timedelta(hours=1), 30.0)]
    assert summarize(readings, START, END) == {"mean": 19.33, "min": 18.0, "max": 20.0, "readings": 2}


def test_summarize_without_numbers_is_none():
    assert summarize([(START, None)], START, END) is None
    assert summarize([], START, END) is None


def nights_used(days: list[date], minutes: int = 300) -> dict:
    return {day.isoformat(): {"date": day.isoformat(), "usage_minutes": minutes} for day in days}


def test_compliance_counts_nights_of_four_hours_over_30_days():
    today = date(2026, 4, 1)
    days = [today - timedelta(days=n) for n in range(1, 31)]
    nights = nights_used(days[:14]) | nights_used(days[14:15], minutes=240) | nights_used(days[15:], minutes=239)
    assert compliance(nights, today) == 50


def test_compliance_waits_for_last_nights_upload():
    today = date(2026, 4, 1)
    # Last night isn't in myAir yet. Its absence doesn't count, as the 30 nights end the night before.
    nights = nights_used([today - timedelta(days=n) for n in range(2, 32)])
    assert compliance(nights, today) == 100


def test_compliance_counts_missing_nights_as_unused():
    today = date(2026, 4, 1)
    nights = nights_used([today - timedelta(days=10)])
    assert compliance(nights, today) == 3


def test_compliance_without_nights_is_none():
    assert compliance({}, date(2026, 4, 1)) is None
