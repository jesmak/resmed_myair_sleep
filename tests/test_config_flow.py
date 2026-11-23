"""The config flow's path through the emailed code, and a refused login."""

from unittest.mock import AsyncMock, patch

from homeassistant import config_entries
from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.resmed_myair_sleep.client.myair_client import AuthenticationError
from custom_components.resmed_myair_sleep.const import CONF_DEVICE_TOKEN, CONF_REGION, CONF_TEMPERATURE_ENTITY, DOMAIN

from .conftest import make_client

LOGIN = {CONF_USERNAME: "matti.meikalainen@example.com", CONF_PASSWORD: "secret", CONF_REGION: "eu"}


async def test_login_with_a_code_then_sensors(recorder_mock, hass: HomeAssistant):
    client = make_client()
    client.connect = AsyncMock(return_value="MFA_REQUIRED")
    client.verify_mfa_and_get_access_token = AsyncMock(return_value="SUCCESS")
    with (
        patch("custom_components.resmed_myair_sleep.config_flow.RESTClient", return_value=client),
        patch("custom_components.resmed_myair_sleep.async_setup_entry", return_value=True),
    ):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)
        assert result["step_id"] == "verify_mfa"
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"verification_code": " 123456 "})
        assert result["step_id"] == "sensors"
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_TEMPERATURE_ENTITY: "sensor.bedroom_temperature"})
        await hass.async_block_till_done()

    client.verify_mfa_and_get_access_token.assert_awaited_once_with("123456")
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "AirSense 11 AutoSet"
    assert result["result"].unique_id == "SN0001"
    assert result["data"] == {**LOGIN, CONF_REGION: "EU", CONF_DEVICE_TOKEN: "device-token"}
    assert result["options"] == {CONF_TEMPERATURE_ENTITY: "sensor.bedroom_temperature"}


async def test_a_refused_login_shows_the_form_again(recorder_mock, hass: HomeAssistant):
    client = make_client()
    client.connect = AsyncMock(side_effect=AuthenticationError("no"))
    with patch("custom_components.resmed_myair_sleep.config_flow.RESTClient", return_value=client):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], LOGIN)
    assert result["step_id"] == "user"
    assert result["errors"] == {"base": "invalid_auth"}
