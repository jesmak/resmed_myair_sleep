"""Shared helpers: a mocked myAir client for the integration, and mocked aiohttp responses for the client's own tests."""

from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from aiohttp import ClientResponse, ClientSession
from multidict import CIMultiDict

from custom_components.resmed_myair_sleep.client.myair_client import MyAirConfig
from custom_components.resmed_myair_sleep.const import REGION_EU, REGION_NA
from custom_components.resmed_myair_sleep.models import MyAirDevice, MyAirSleepRecord

type JSONValue = str | int | float | bool | dict[str, JSONValue] | list[JSONValue] | None
type HeadersValue = Mapping[str, str] | CIMultiDict[str] | None


def make_mock_aiohttp_response(json_value: JSONValue = None, headers: HeadersValue = None, status: int = 200) -> MagicMock:
    """Create a `ClientResponse`-shaped mock whose `json()` returns `json_value`."""
    mock_res = MagicMock(spec=ClientResponse)
    mock_res.json = AsyncMock(return_value=json_value)
    # The client calls headers.getall(), which a plain dict lacks.
    hdrs: Any
    if headers is None:
        hdrs = CIMultiDict()
    elif isinstance(headers, dict):
        hdrs = CIMultiDict(headers)
    else:
        hdrs = headers
    mock_res.headers = hdrs
    mock_res.status = status
    return mock_res


def make_mock_aiohttp_context_manager(
    json_value: JSONValue | MagicMock = None, headers: HeadersValue = None, status: int = 200
) -> AsyncMock:
    """Return an async context manager yielding a mock response, or the prebuilt `MagicMock` response given."""
    if isinstance(json_value, MagicMock):
        mock_res = json_value
    else:
        mock_res = make_mock_aiohttp_response(json_value=json_value, headers=headers, status=status)
    cm = AsyncMock()
    cm.__aenter__ = AsyncMock(return_value=mock_res)
    cm.__aexit__ = AsyncMock(return_value=None)
    return cm


@pytest.fixture
def session() -> MagicMock:
    return MagicMock(spec=ClientSession)


@pytest.fixture
def config_na() -> MyAirConfig:
    return MyAirConfig(username="user", password="pass", region=REGION_NA, device_token="token")


@pytest.fixture
def config_eu() -> MyAirConfig:
    return MyAirConfig(username="user", password="pass", region=REGION_EU, device_token="token")


UPLOAD = datetime(2026, 3, 11, 6, 0, tzinfo=UTC)
START = UPLOAD - timedelta(minutes=480)


def make_client() -> MagicMock:
    client = MagicMock()
    client.connect = AsyncMock(return_value="SUCCESS")
    client.device_token = "device-token"
    client.get_user_device_data = AsyncMock(
        return_value=MyAirDevice.from_api(
            {
                "serialNumber": "SN0001",
                "localizedName": "AirSense 11 AutoSet",
                "deviceSeries": "AirSense 11",
                "fgDeviceManufacturerName": "ResMed",
                "lastSleepDataReportTime": UPLOAD.isoformat(),
            }
        )
    )
    client.get_sleep_records = AsyncMock(
        return_value=[
            MyAirSleepRecord.from_api(
                {
                    "startDate": "2026-03-10",
                    "totalUsage": 480,
                    "ahi": 1.4,
                    "leakPercentile": 6.0,
                    "sleepScore": 90,
                    "sleepRecordPatientId": "p1",
                }
            ),
            MyAirSleepRecord.from_api({"startDate": "2026-03-09", "totalUsage": 200, "ahi": 3.0, "sleepRecordPatientId": "p1"}),
        ]
    )
    return client
