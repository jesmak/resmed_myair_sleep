"""Sensors for the latest night and compliance."""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.const import PERCENTAGE, EntityCategory, UnitOfTime, UnitOfVolumeFlowRate
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_HUMIDITY_ENTITY, CONF_TEMPERATURE_ENTITY, DOMAIN
from .coordinator import SleepConfigEntry, SleepCoordinator, SleepData


def _night(field: str) -> Callable[[SleepData], Any]:
    return lambda data: data.latest.get(field) if data.latest else None


def _night_time(field: str) -> Callable[[SleepData], Any]:
    def value(data: SleepData) -> datetime | None:
        raw = data.latest.get(field) if data.latest else None
        return datetime.fromisoformat(raw) if raw else None

    return value


@dataclass(frozen=True, kw_only=True)
class SleepSensorDescription(SensorEntityDescription):
    value_fn: Callable[[SleepData], Any]
    source_option: str | None = None


_MEASUREMENT = SensorStateClass.MEASUREMENT

SENSORS: tuple[SleepSensorDescription, ...] = (
    SleepSensorDescription(
        key="night",
        translation_key="night",
        device_class=SensorDeviceClass.DATE,
        value_fn=lambda data: date.fromisoformat(data.latest["date"]) if data.latest else None,
    ),
    SleepSensorDescription(key="start", translation_key="start", device_class=SensorDeviceClass.TIMESTAMP, value_fn=_night_time("start")),
    SleepSensorDescription(key="end", translation_key="end", device_class=SensorDeviceClass.TIMESTAMP, value_fn=_night_time("end")),
    SleepSensorDescription(
        key="usage",
        translation_key="usage",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        suggested_unit_of_measurement=UnitOfTime.HOURS,
        suggested_display_precision=1,
        state_class=_MEASUREMENT,
        value_fn=_night("usage_minutes"),
    ),
    SleepSensorDescription(
        key="ahi", translation_key="ahi", state_class=_MEASUREMENT, suggested_display_precision=1, value_fn=_night("ahi")
    ),
    SleepSensorDescription(
        key="leak",
        translation_key="leak",
        device_class=SensorDeviceClass.VOLUME_FLOW_RATE,
        native_unit_of_measurement=UnitOfVolumeFlowRate.LITERS_PER_MINUTE,
        suggested_display_precision=1,
        state_class=_MEASUREMENT,
        value_fn=_night("leak"),
    ),
    SleepSensorDescription(key="mask_pairs", translation_key="mask_pairs", state_class=_MEASUREMENT, value_fn=_night("mask_pairs")),
    SleepSensorDescription(key="score", translation_key="score", state_class=_MEASUREMENT, value_fn=_night("score")),
    SleepSensorDescription(key="usage_score", translation_key="usage_score", state_class=_MEASUREMENT, value_fn=_night("usage_score")),
    SleepSensorDescription(key="ahi_score", translation_key="ahi_score", state_class=_MEASUREMENT, value_fn=_night("ahi_score")),
    SleepSensorDescription(key="mask_score", translation_key="mask_score", state_class=_MEASUREMENT, value_fn=_night("mask_score")),
    SleepSensorDescription(key="leak_score", translation_key="leak_score", state_class=_MEASUREMENT, value_fn=_night("leak_score")),
    SleepSensorDescription(
        key="temperature",
        translation_key="temperature",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=_MEASUREMENT,
        suggested_display_precision=1,
        source_option=CONF_TEMPERATURE_ENTITY,
        value_fn=_night("temperature"),
    ),
    SleepSensorDescription(
        key="temperature_min",
        translation_key="temperature_min",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=_MEASUREMENT,
        suggested_display_precision=1,
        source_option=CONF_TEMPERATURE_ENTITY,
        value_fn=_night("temperature_min"),
    ),
    SleepSensorDescription(
        key="temperature_max",
        translation_key="temperature_max",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=_MEASUREMENT,
        suggested_display_precision=1,
        source_option=CONF_TEMPERATURE_ENTITY,
        value_fn=_night("temperature_max"),
    ),
    SleepSensorDescription(
        key="humidity",
        translation_key="humidity",
        device_class=SensorDeviceClass.HUMIDITY,
        native_unit_of_measurement=PERCENTAGE,
        state_class=_MEASUREMENT,
        suggested_display_precision=0,
        source_option=CONF_HUMIDITY_ENTITY,
        value_fn=_night("humidity"),
    ),
    SleepSensorDescription(
        key="compliance",
        translation_key="compliance",
        native_unit_of_measurement=PERCENTAGE,
        state_class=_MEASUREMENT,
        value_fn=lambda data: data.compliance,
    ),
    SleepSensorDescription(
        key="last_upload",
        translation_key="last_upload",
        device_class=SensorDeviceClass.TIMESTAMP,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda data: data.report_time,
    ),
)


async def async_setup_entry(hass: HomeAssistant, entry: SleepConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback) -> None:
    coordinator = entry.runtime_data
    async_add_entities(
        SleepSensor(coordinator, description)
        for description in SENSORS
        if description.source_option is None or entry.options.get(description.source_option)
    )


class SleepSensor(CoordinatorEntity[SleepCoordinator], SensorEntity):
    _attr_has_entity_name = True
    entity_description: SleepSensorDescription

    def __init__(self, coordinator: SleepCoordinator, description: SleepSensorDescription) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        device = coordinator.data.device
        self._attr_unique_id = f"{device.serial_number}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, device.serial_number)},
            name=device.name,
            manufacturer=device.manufacturer or "ResMed",
            model=device.raw.get("deviceSeries"),
            serial_number=device.serial_number,
        )

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def native_unit_of_measurement(self) -> str | None:
        # The room's temperatures are in the unit of the sensor they come from.
        if self.entity_description.source_option == CONF_TEMPERATURE_ENTITY:
            entity_id = self.coordinator.config_entry.options[CONF_TEMPERATURE_ENTITY]
            if (source := self.hass.states.get(entity_id)) and (unit := source.attributes.get("unit_of_measurement")):
                return unit
            entry = er.async_get(self.hass).async_get(entity_id)
            if entry and entry.unit_of_measurement:
                return entry.unit_of_measurement
            return self.hass.config.units.temperature_unit
        return self.entity_description.native_unit_of_measurement
