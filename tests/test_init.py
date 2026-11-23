"""Setup end to end with a mocked myAir (the nights, the room's conditions, sensors, import and websocket), and the coordinator's errors."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
import voluptuous as vol
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed
from pytest_homeassistant.common import MockConfigEntry
from pytest_homeassistant.components.recorder.common import async_wait_recording_done

from custom_components.resmed_myair_sleep.client.myair_client import AuthenticationError, ServiceUnavailableError, StaleSessionError
from custom_components.resmed_myair_sleep.const import (
    CONF_DEVICE_TOKEN,
    CONF_HUMIDITY_ENTITY,
    CONF_REGION,
    CONF_TEMPERATURE_ENTITY,
    DOMAIN,
    OUTAGE_RETRY_MARGIN_S,
)
from custom_components.resmed_myair_sleep.coordinator import SleepCoordinator

from .conftest import START, UPLOAD, make_client


@pytest.fixture
def entry() -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        unique_id="SN0001",
        data={CONF_USERNAME: "matti.meikalainen@example.com", CONF_PASSWORD: "secret", CONF_REGION: "EU", CONF_DEVICE_TOKEN: "t"},
        options={CONF_TEMPERATURE_ENTITY: "sensor.bedroom_temperature", CONF_HUMIDITY_ENTITY: "sensor.bedroom_humidity"},
    )


async def test_setup_keeps_the_nights_with_the_rooms_conditions(recorder_mock, hass: HomeAssistant, freezer, entry):
    temperature = {"unit_of_measurement": "°C", "device_class": "temperature"}
    freezer.move_to(START - timedelta(hours=1))
    hass.states.async_set("sensor.bedroom_temperature", "20.0", temperature)
    hass.states.async_set("sensor.bedroom_humidity", "40", {"unit_of_measurement": "%"})
    await async_wait_recording_done(hass)
    freezer.move_to(START + timedelta(hours=4))
    hass.states.async_set("sensor.bedroom_temperature", "18.0", temperature)
    await async_wait_recording_done(hass)
    freezer.move_to(UPLOAD + timedelta(minutes=10))

    entry.add_to_hass(hass)
    with patch("custom_components.resmed_myair_sleep.RESTClient", return_value=make_client()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    night = entry.runtime_data.nights["2026-03-10"]
    assert datetime.fromisoformat(night["start"]) == START
    assert datetime.fromisoformat(night["end"]) == UPLOAD
    assert night["temperature"] == 19.0
    assert night["temperature_min"] == 18.0
    assert night["humidity"] == 40.0
    assert "start" not in entry.runtime_data.nights["2026-03-09"]

    assert hass.states.get("sensor.airsense_11_autoset_ahi").state == "1.4"
    assert hass.states.get("sensor.airsense_11_autoset_temperature").state == "19.0"
    assert hass.states.get("sensor.airsense_11_autoset_temperature").attributes["unit_of_measurement"] == "°C"
    assert hass.states.get("sensor.airsense_11_autoset_sleep_start").state == START.isoformat()

    response = await hass.services.async_call(
        DOMAIN,
        "import_nights",
        {
            "config_entry_id": entry.entry_id,
            "nights": [{"date": "2026-01-05", "ahi": 2.2, "usage_minutes": 390}, {"date": "2026-03-10", "ahi": 9.9, "humidity": 55}],
        },
        blocking=True,
        return_response=True,
    )
    assert response == {"nights_changed": 1}
    assert entry.runtime_data.nights["2026-03-10"]["ahi"] == 1.4
    assert entry.runtime_data.nights["2026-01-05"]["usage_minutes"] == 390


async def test_without_room_sensors_and_the_nights_over_the_websocket(recorder_mock, hass: HomeAssistant, entry, hass_ws_client):
    entry = MockConfigEntry(domain=DOMAIN, unique_id="SN0001", data=entry.data, options={})
    entry.add_to_hass(hass)
    with patch("custom_components.resmed_myair_sleep.RESTClient", return_value=make_client()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    assert hass.states.get("sensor.airsense_11_autoset_ahi") is not None
    assert hass.states.get("sensor.airsense_11_autoset_temperature") is None
    assert "temperature" not in entry.runtime_data.nights["2026-03-10"]

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/nights", "entry_id": entry.entry_id})
    result = await client.receive_json()
    assert [night["date"] for night in result["result"]["nights"]] == ["2026-03-09", "2026-03-10"]


async def test_an_import_checks_its_values_and_fills_in_the_end(recorder_mock, hass: HomeAssistant, entry):
    entry = MockConfigEntry(domain=DOMAIN, unique_id="SN0001", data=entry.data, options={})
    entry.add_to_hass(hass)
    with patch("custom_components.resmed_myair_sleep.RESTClient", return_value=make_client()):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    for night in (
        {"date": "2026-01-05", "start": "not a time"},
        {"date": "2026-01-05", "start": "2026-01-05T23:10:00"},
        {"date": "2026-01-05", "usage_minutes": 2.7},
    ):
        with pytest.raises(vol.Invalid):
            await hass.services.async_call(DOMAIN, "import_nights", {"config_entry_id": entry.entry_id, "nights": [night]}, blocking=True)
    assert "2026-01-05" not in entry.runtime_data.nights

    await hass.services.async_call(
        DOMAIN,
        "import_nights",
        {"config_entry_id": entry.entry_id, "nights": [{"date": "2026-01-05", "start": "2026-01-05T23:10:00+02:00", "usage_minutes": 390}]},
        blocking=True,
    )
    assert datetime.fromisoformat(entry.runtime_data.nights["2026-01-05"]["end"]) == datetime(2026, 1, 6, 3, 40, tzinfo=UTC)


def _coordinator(hass: HomeAssistant, entry: MockConfigEntry, client) -> SleepCoordinator:
    # Without the room's sensors, so the coordinator runs without the recorder.
    entry = MockConfigEntry(domain=DOMAIN, unique_id="SN0001", data=entry.data, options={})
    entry.add_to_hass(hass)
    return SleepCoordinator(hass, entry, client)


async def test_a_refused_login_asks_for_reauth(hass: HomeAssistant, entry):
    client = make_client()
    client.connect = AsyncMock(side_effect=AuthenticationError("no"))
    with pytest.raises(ConfigEntryAuthFailed):
        await _coordinator(hass, entry, client)._async_update_data()


async def test_an_outage_retries_after_its_end(hass: HomeAssistant, freezer, entry):
    freezer.move_to(UPLOAD)
    client = make_client()
    client.get_user_device_data = AsyncMock(side_effect=ServiceUnavailableError("down", outage_end=UPLOAD + timedelta(minutes=10)))
    coordinator = _coordinator(hass, entry, client)
    with pytest.raises(UpdateFailed) as raised:
        await coordinator._async_update_data()
    assert raised.value.retry_after == 600 + OUTAGE_RETRY_MARGIN_S

    client.get_user_device_data = AsyncMock(side_effect=ServiceUnavailableError("down", outage_end=UPLOAD - timedelta(minutes=10)))
    with pytest.raises(UpdateFailed) as raised:
        await coordinator._async_update_data()
    assert raised.value.retry_after is None


async def test_a_dropped_session_logs_in_again_once(hass: HomeAssistant, entry):
    client = make_client()
    records = client.get_sleep_records.return_value
    client.get_sleep_records = AsyncMock(side_effect=[StaleSessionError("gone"), records])
    data = await _coordinator(hass, entry, client)._async_update_data()
    assert data.latest["date"] == "2026-03-10"
    client.connect.assert_awaited_with(force=True)

    client.get_sleep_records = AsyncMock(side_effect=StaleSessionError("gone"))
    with pytest.raises(UpdateFailed):
        await _coordinator(hass, entry, client)._async_update_data()
