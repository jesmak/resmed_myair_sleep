"""Parsing myAir's device and sleep record payloads."""

import logging
from datetime import date
from decimal import Decimal

import pytest

from custom_components.resmed_myair_sleep.models import MyAirDevice, MyAirSleepRecord


def test_device_keeps_the_raw_payload_and_its_fields() -> None:
    raw = {
        "serialNumber": "SN0001",
        "fgDeviceManufacturerName": "ResMed",
        "localizedName": "AirSense 11 AutoSet",
        "deviceSeries": "AirSense 11",
    }
    device = MyAirDevice.from_api(raw)
    assert device.raw == raw
    assert device.serial_number == "SN0001"
    assert device.manufacturer == "ResMed"
    assert device.name == "AirSense 11 AutoSet"


@pytest.mark.parametrize("payload", [None, {}])
def test_missing_payloads_give_empty_models(payload: dict | None) -> None:
    device = MyAirDevice.from_api(payload)
    assert (device.raw, device.serial_number, device.manufacturer, device.name) == ({}, "", None, None)
    record = MyAirSleepRecord.from_api(payload)
    assert (record.raw, record.start_date, record.total_usage_minutes) == ({}, None, None)


def test_device_fields_of_the_wrong_type_are_dropped() -> None:
    device = MyAirDevice.from_api({"serialNumber": 123, "fgDeviceManufacturerName": 1, "localizedName": ["x"]})
    assert (device.serial_number, device.manufacturer, device.name) == ("", None, None)


def test_sleep_record_parses_the_date_and_usage() -> None:
    record = MyAirSleepRecord.from_api({"startDate": "2024-07-18", "totalUsage": 125, "ahi": 1.2})
    assert record.start_date == date(2024, 7, 18)
    assert record.total_usage_minutes == 125
    assert record.raw["ahi"] == 1.2


@pytest.mark.parametrize("raw_start_date", [123, "not-a-date"])
def test_an_unparsable_date_is_none(raw_start_date: object) -> None:
    assert MyAirSleepRecord.from_api({"startDate": raw_start_date}).start_date is None


@pytest.mark.parametrize("raw_usage", ["not-a-number", "NaN", True, [1]])
def test_invalid_usage_is_none(raw_usage: object) -> None:
    assert MyAirSleepRecord.from_api({"totalUsage": raw_usage}).total_usage_minutes is None


@pytest.mark.parametrize(
    ("raw_usage", "logs_truncation"),
    [(125.9, True), (Decimal("125.9"), True), ("125.9", True), (125.0, False), (Decimal("125.0"), False), ("125.0", False)],
)
def test_numeric_usage_is_whole_minutes(raw_usage: object, logs_truncation: bool, caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.INFO):
        record = MyAirSleepRecord.from_api({"totalUsage": raw_usage})
    assert record.total_usage_minutes == 125
    assert ("Truncated fractional totalUsage value to minutes" in caplog.text) is logs_truncation
