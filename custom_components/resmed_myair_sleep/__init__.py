"""ResMed myAir Sleep: a CPAP's nights from myAir, kept with the bedroom's conditions."""

from datetime import datetime
from typing import Any

import voluptuous as vol
from aiohttp import DummyCookieJar
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME, Platform
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .card import async_add_card_resource, async_remove_card_resource, async_serve_card
from .client.myair_client import MyAirConfig
from .client.rest_client import RESTClient
from .const import CONF_DEVICE_TOKEN, CONF_REGION, DOMAIN, STORAGE_VERSION
from .coordinator import SleepConfigEntry, SleepCoordinator
from .nights import NIGHT_FIELDS

PLATFORMS = [Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

SERVICE_IMPORT_NIGHTS = "import_nights"
ATTR_CONFIG_ENTRY_ID = "config_entry_id"
ATTR_NIGHTS = "nights"


def _aware_time(value: Any) -> str:
    parsed = cv.datetime(value)
    if parsed.tzinfo is None:
        raise vol.Invalid("a time needs its UTC offset")
    return parsed.isoformat()


def _whole(value: Any) -> int:
    if isinstance(value, bool) or not float(value).is_integer():
        raise vol.Invalid("expected a whole number")
    return int(float(value))


_VALIDATORS = {datetime: _aware_time, int: _whole, float: vol.Coerce(float)}
_NIGHT_SCHEMA = vol.Schema(
    {
        vol.Required("date"): cv.date,
        **{vol.Optional(field): _VALIDATORS[kind] for field, kind in NIGHT_FIELDS.items() if field != "date"},
    }
)
IMPORT_SCHEMA = vol.Schema({vol.Required(ATTR_CONFIG_ENTRY_ID): cv.string, vol.Required(ATTR_NIGHTS): [_NIGHT_SCHEMA]})


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    hass.services.async_register(
        DOMAIN, SERVICE_IMPORT_NIGHTS, _async_import_nights, schema=IMPORT_SCHEMA, supports_response=SupportsResponse.OPTIONAL
    )
    websocket_api.async_register_command(hass, _ws_nights)
    await async_serve_card(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: SleepConfigEntry) -> bool:
    client = RESTClient(
        MyAirConfig(
            username=entry.data[CONF_USERNAME],
            password=entry.data[CONF_PASSWORD],
            region=entry.data[CONF_REGION],
            device_token=entry.data.get(CONF_DEVICE_TOKEN),
        ),
        # The client handles Okta's cookies itself.
        async_create_clientsession(hass, cookie_jar=DummyCookieJar(), raise_for_status=True),
    )
    await async_add_card_resource(hass)
    coordinator = SleepCoordinator(hass, entry, client)
    await coordinator.async_load()
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: SleepConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: SleepConfigEntry) -> None:
    await Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry.entry_id}").async_remove()
    if not hass.config_entries.async_entries(DOMAIN):
        await async_remove_card_resource(hass)


def _coordinator(hass: HomeAssistant, entry_id: str) -> SleepCoordinator:
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN or not hasattr(entry, "runtime_data"):
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="entry_not_loaded")
    return entry.runtime_data


async def _async_import_nights(call: ServiceCall) -> dict[str, Any]:
    coordinator = _coordinator(call.hass, call.data[ATTR_CONFIG_ENTRY_ID])
    nights = [{**night, "date": night["date"].isoformat()} for night in call.data[ATTR_NIGHTS]]
    changed = await coordinator.import_nights(nights)
    await coordinator.async_save()
    coordinator.async_set_updated_data(coordinator.build_data())
    return {"nights_changed": changed}


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/nights", vol.Required("entity_id"): cv.entity_id})
@callback
def _ws_nights(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """The stored nights of the device a sensor of the integration belongs to, oldest first."""
    entity = er.async_get(hass).async_get(msg["entity_id"])
    if entity is None or entity.platform != DOMAIN or entity.config_entry_id is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, f"{msg['entity_id']} is not a sensor of {DOMAIN}")
        return
    entry = hass.config_entries.async_get_entry(entity.config_entry_id)
    if entry is None or entry.state is not ConfigEntryState.LOADED:
        connection.send_error(msg["id"], "not_loaded", f"The device of {msg['entity_id']} is not loaded")
        return
    connection.send_result(msg["id"], {"nights": entry.runtime_data.nights_list()})
