"""Config flow: the myAir login with its emailed code, the bedroom's sensors, and reauth."""

import logging
from collections.abc import Mapping
from typing import Any

import voluptuous as vol
from aiohttp import ClientError, DummyCookieJar
from aiohttp.http_exceptions import HttpProcessingError
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlowWithReload
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import callback
from homeassistant.helpers import selector
from homeassistant.helpers.aiohttp_client import async_create_clientsession

from .client.myair_client import AuthenticationError, IncompleteAccountError, MyAirConfig, ParsingError, ServiceUnavailableError
from .client.rest_client import RESTClient
from .const import (
    AUTH_NEEDS_MFA,
    CONF_DEVICE_TOKEN,
    CONF_HUMIDITY_ENTITY,
    CONF_REGION,
    CONF_TEMPERATURE_ENTITY,
    CONF_VERIFICATION_CODE,
    DOMAIN,
    REGION_EU,
    REGION_NA,
)
from .coordinator import SleepConfigEntry
from .models import MyAirDevice

_LOGGER = logging.getLogger(__name__)

_CODE_SCHEMA = vol.Schema({vol.Required(CONF_VERIFICATION_CODE): selector.TextSelector()})


def _sensors_schema(defaults: Mapping[str, Any]) -> vol.Schema:
    def picker(device_class: SensorDeviceClass) -> selector.EntitySelector:
        return selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class=device_class))

    return vol.Schema(
        {
            vol.Optional(CONF_TEMPERATURE_ENTITY, description={"suggested_value": defaults.get(CONF_TEMPERATURE_ENTITY)}): picker(
                SensorDeviceClass.TEMPERATURE
            ),
            vol.Optional(CONF_HUMIDITY_ENTITY, description={"suggested_value": defaults.get(CONF_HUMIDITY_ENTITY)}): picker(
                SensorDeviceClass.HUMIDITY
            ),
        }
    )


class SleepConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self._client: RESTClient | None = None
        self._device: MyAirDevice | None = None

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: SleepConfigEntry) -> "SleepOptionsFlow":
        return SleepOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            # The form's options are lowercase, as translation keys must be.
            self._data = {**user_input, CONF_REGION: user_input[CONF_REGION].upper()}
            result = await self._async_login(errors)
            if result is not None:
                return result
        schema = vol.Schema(
            {
                vol.Required(CONF_USERNAME, default=self._data.get(CONF_USERNAME, "")): selector.TextSelector(
                    selector.TextSelectorConfig(type=selector.TextSelectorType.EMAIL, autocomplete="username")
                ),
                vol.Required(CONF_PASSWORD): selector.TextSelector(
                    selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD, autocomplete="current-password")
                ),
                vol.Required(CONF_REGION, default=self._data.get(CONF_REGION, REGION_EU).lower()): selector.SelectSelector(
                    selector.SelectSelectorConfig(options=[REGION_EU.lower(), REGION_NA.lower()], translation_key=CONF_REGION)
                ),
            }
        )
        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
            description_placeholders={"eu_site": "myair.resmed.eu", "na_site": "myair.resmed.com"},
        )

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        self._data = dict(entry_data)
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            self._data[CONF_PASSWORD] = user_input[CONF_PASSWORD]
            result = await self._async_login(errors)
            if result is not None:
                return result
        schema = vol.Schema(
            {
                vol.Required(CONF_PASSWORD): selector.TextSelector(
                    selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD, autocomplete="current-password")
                )
            }
        )
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=schema,
            errors=errors,
            description_placeholders={"username": self._data[CONF_USERNAME]},
        )

    async def async_step_verify_mfa(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            assert self._client is not None
            try:
                await self._client.verify_mfa_and_get_access_token(user_input[CONF_VERIFICATION_CODE].strip())
                return await self._async_logged_in()
            except AuthenticationError:
                errors["base"] = "invalid_code"
            except _CONNECTION_ERRORS as err:
                errors["base"] = _connection_error(err)
        return self.async_show_form(step_id="verify_mfa", data_schema=_CODE_SCHEMA, errors=errors)

    async def async_step_sensors(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            assert self._device is not None
            return self.async_create_entry(title=self._device.name or "myAir", data=self._data, options=user_input)
        return self.async_show_form(step_id="sensors", data_schema=_sensors_schema({}))

    async def _async_login(self, errors: dict[str, str]) -> ConfigFlowResult | None:
        """Log in. Returns the next step, or None with `errors` filled in for the same form again."""
        self._client = RESTClient(
            MyAirConfig(
                username=self._data[CONF_USERNAME],
                password=self._data[CONF_PASSWORD],
                region=self._data[CONF_REGION],
                device_token=self._data.get(CONF_DEVICE_TOKEN),
            ),
            async_create_clientsession(self.hass, cookie_jar=DummyCookieJar(), raise_for_status=True),
        )
        try:
            if await self._client.connect(initial=True) == AUTH_NEEDS_MFA:
                return await self.async_step_verify_mfa()
            return await self._async_logged_in()
        except AuthenticationError:
            errors["base"] = "invalid_auth"
        except _CONNECTION_ERRORS as err:
            errors["base"] = _connection_error(err)
        return None

    async def _async_logged_in(self) -> ConfigFlowResult:
        assert self._client is not None
        self._data.pop(CONF_VERIFICATION_CODE, None)
        self._data[CONF_DEVICE_TOKEN] = self._client.device_token
        self._device = await self._client.get_user_device_data(initial=True)
        await self.async_set_unique_id(self._device.serial_number)
        if self.source == "reauth":
            self._abort_if_unique_id_mismatch(reason="wrong_account")
            return self.async_update_reload_and_abort(self._get_reauth_entry(), data=self._data)
        self._abort_if_unique_id_configured()
        return await self.async_step_sensors()


class SleepOptionsFlow(OptionsFlowWithReload):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        return self.async_show_form(step_id="init", data_schema=_sensors_schema(self.config_entry.options))


_CONNECTION_ERRORS = (IncompleteAccountError, ServiceUnavailableError, ParsingError, HttpProcessingError, ClientError)


def _connection_error(err: Exception) -> str:
    if isinstance(err, IncompleteAccountError):
        return "incomplete_account"
    _LOGGER.warning("myAir login failed: %s", err)
    return "cannot_connect"
