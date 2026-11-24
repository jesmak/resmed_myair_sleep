"""Polls myAir, keeps the nights in storage and adds the room's conditions to them."""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from aiohttp.http_exceptions import HttpProcessingError
from homeassistant.components.recorder import get_instance, history
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .client.myair_client import AuthenticationError, ParsingError, ServiceUnavailableError, StaleSessionError
from .client.rest_client import RESTClient
from .const import CONF_HUMIDITY_ENTITY, CONF_TEMPERATURE_ENTITY, DOMAIN, OUTAGE_RETRY_MARGIN_S, STORAGE_VERSION, UPDATE_INTERVAL
from .models import MyAirDevice
from .nights import compliance, merge_records, set_end, summarize

_LOGGER = logging.getLogger(__name__)

type SleepConfigEntry = ConfigEntry[SleepCoordinator]


@dataclass(frozen=True, slots=True)
class SleepData:
    device: MyAirDevice
    latest: dict[str, Any] | None
    compliance: int | None
    report_time: datetime | None


class SleepCoordinator(DataUpdateCoordinator[SleepData]):
    config_entry: SleepConfigEntry

    def __init__(self, hass: HomeAssistant, entry: SleepConfigEntry, client: RESTClient) -> None:
        super().__init__(hass, _LOGGER, config_entry=entry, name=DOMAIN, update_interval=UPDATE_INTERVAL)
        self.client = client
        self.nights: dict[str, dict[str, Any]] = {}
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}")
        self._device: MyAirDevice | None = None
        self._report_time: datetime | None = None

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        self.nights = stored["nights"] if stored else {}

    async def _async_update_data(self) -> SleepData:
        try:
            device, records = await self._fetch()
        except ServiceUnavailableError as err:
            retry_after = None
            if err.outage_end is not None:
                remaining = (err.outage_end - dt_util.utcnow()).total_seconds()
                if remaining > 0:
                    retry_after = remaining + OUTAGE_RETRY_MARGIN_S
            raise UpdateFailed(str(err), retry_after=retry_after) from err
        except (ParsingError, HttpProcessingError) as err:
            raise UpdateFailed(f"myAir returned an unexpected response: {err}") from err

        self._device = device
        report = device.raw.get("lastSleepDataReportTime")
        self._report_time = dt_util.as_local(parsed) if isinstance(report, str) and (parsed := dt_util.parse_datetime(report)) else None

        changed = merge_records(self.nights, records, self._report_time)
        for key in changed:
            await self._add_conditions(self.nights[key])
        if changed:
            await self.async_save()
        return self.build_data()

    def build_data(self) -> SleepData:
        assert self._device is not None
        latest = self.nights[max(self.nights)] if self.nights else None
        return SleepData(
            device=self._device,
            latest=latest,
            compliance=compliance(self.nights, dt_util.now().date()),
            report_time=self._report_time,
        )

    async def async_save(self) -> None:
        await self._store.async_save({"nights": self.nights})

    async def _fetch(self) -> tuple[MyAirDevice, list]:
        """Fetch the device and the records, logging in again once if myAir has dropped the session."""
        await self._connect()
        try:
            return await self.client.get_user_device_data(), await self.client.get_sleep_records()
        except StaleSessionError:
            _LOGGER.debug("myAir dropped the session, logging in again")
            await self._connect(force=True)
            return await self.client.get_user_device_data(), await self.client.get_sleep_records()

    async def _connect(self, force: bool = False) -> None:
        try:
            await self.client.connect(force=force)
        except AuthenticationError as err:
            raise ConfigEntryAuthFailed(f"myAir refused the login: {err}") from err

    async def _add_conditions(self, night: dict[str, Any], keep: bool = False) -> None:
        """Add the room's conditions over the night's session, from the recorder's history of the chosen sensors.

        With keep, a condition the night already has is left as it is.
        """
        if not night.get("start") or not night.get("end"):
            return
        start = datetime.fromisoformat(night["start"])
        end = datetime.fromisoformat(night["end"])
        for kind, option in (("temperature", CONF_TEMPERATURE_ENTITY), ("humidity", CONF_HUMIDITY_ENTITY)):
            entity_id = self.config_entry.options.get(option)
            if not entity_id or (keep and night.get(kind) is not None):
                continue
            states = await get_instance(self.hass).async_add_executor_job(
                history.state_changes_during_period, self.hass, start, end, entity_id, True
            )
            readings = [(state.last_changed, _number(state.state)) for state in states.get(entity_id, [])]
            summary = summarize(readings, start, end)
            if summary is None:
                continue
            night[kind] = summary["mean"]
            night[f"{kind}_min"] = summary["min"]
            night[f"{kind}_max"] = summary["max"]
            night[f"{kind}_readings"] = summary["readings"]

    def nights_list(self) -> list[dict[str, Any]]:
        return [self.nights[key] for key in sorted(self.nights)]

    async def import_nights(self, nights: list[dict[str, Any]]) -> int:
        """Fill in nights from an import, keeping every value already stored. Returns the number of nights changed."""
        changed = 0
        for imported in nights:
            night = self.nights.setdefault(imported["date"], {"date": imported["date"]})
            missing = {field: value for field, value in imported.items() if night.get(field) is None}
            if missing:
                night.update(missing)
                if "end" not in imported:
                    set_end(night)
                await self._add_conditions(night, keep=True)
                changed += 1
        return changed


def _number(state: str) -> float | None:
    try:
        return float(state)
    except ValueError:
        return None
