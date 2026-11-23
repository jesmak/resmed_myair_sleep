"""Typed domain models for ResMed myAir API payloads."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any, Self

_LOGGER: logging.Logger = logging.getLogger(__name__)


def _to_usage_minutes(raw_usage: Any) -> int | None:
    """Normalize myAir ``totalUsage`` values into whole minutes.

    Args:
        raw_usage (Any): API value that may arrive as an int, decimal-like string, float,
            or malformed scalar.

    Returns:
        int | None: Whole usage minutes, or ``None`` when the payload cannot
            represent usage.
    """
    if isinstance(raw_usage, bool):
        return None
    if isinstance(raw_usage, int):
        return raw_usage
    if isinstance(raw_usage, float | Decimal | str):
        try:
            usage_decimal = Decimal(str(raw_usage))
            usage_minutes = int(usage_decimal)
        except (
            InvalidOperation,
            ValueError,
        ):
            return None
        if usage_decimal != Decimal(usage_minutes):
            _LOGGER.info("Truncated fractional totalUsage value to minutes: %r", raw_usage)
        return usage_minutes
    return None


def _to_optional_str(raw: Any) -> str | None:
    """Keep string API fields while discarding unexpected payload types.

    Args:
        raw (Any): Raw field value from a myAir payload.

    Returns:
        str | None: The string value, or ``None`` for missing and non-string
            values.
    """
    if not isinstance(raw, str):
        return None
    return raw


def _to_optional_date(raw: Any) -> date | None:
    """Parse ISO date fields while tolerating malformed myAir payloads.

    Args:
        raw (Any): Raw date field from a myAir payload.

    Returns:
        date | None: Parsed date, or ``None`` when the field is missing or invalid.
    """
    if not isinstance(raw, str):
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return None


@dataclass(frozen=True, slots=True)
class MyAirDevice:
    """Typed view of the assigned flow-generator payload and its raw source."""

    raw: dict[str, Any]
    serial_number: str
    manufacturer: str | None
    name: str | None

    @classmethod
    def from_api(cls, data: Mapping[str, Any] | None) -> Self:
        """Build device metadata from a raw GraphQL device mapping.

        Args:
            data (Mapping[str, Any] | None): Raw myAir device payload, or
                ``None`` when the API omitted it.

        Returns:
            Self: Typed device with normalized serial, manufacturer and name fields.
        """
        raw = dict(data or {})
        serial_number = raw.get("serialNumber", "")
        if not isinstance(serial_number, str):
            serial_number = ""
        return cls(
            raw=raw,
            serial_number=serial_number,
            manufacturer=_to_optional_str(raw.get("fgDeviceManufacturerName")),
            name=_to_optional_str(raw.get("localizedName")),
        )


@dataclass(frozen=True, slots=True)
class MyAirSleepRecord:
    """Typed view of a nightly sleep record and its normalized usage."""

    raw: dict[str, Any]
    start_date: date | None
    total_usage_minutes: int | None

    @classmethod
    def from_api(cls, data: Mapping[str, Any] | None) -> Self:
        """Build a sleep record from a raw GraphQL record mapping.

        Args:
            data (Mapping[str, Any] | None): Raw myAir sleep-record payload, or
                ``None`` when unavailable.

        Returns:
            Self: Typed record with parsed date and normalized minutes.
        """
        raw = dict(data or {})
        total_usage_minutes = _to_usage_minutes(raw.get("totalUsage"))
        return cls(
            raw=raw,
            start_date=_to_optional_date(raw.get("startDate")),
            total_usage_minutes=total_usage_minutes,
        )
