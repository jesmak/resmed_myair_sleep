"""Constants for ResMed myAir Sleep."""

from datetime import timedelta

DOMAIN = "resmed_myair_sleep"

REGION_NA = "NA"
REGION_EU = "EU"

CONF_REGION = "region"
CONF_DEVICE_TOKEN = "device_token"  # noqa: S105
CONF_VERIFICATION_CODE = "verification_code"
CONF_TEMPERATURE_ENTITY = "temperature_entity"
CONF_HUMIDITY_ENTITY = "humidity_entity"

UPDATE_INTERVAL = timedelta(minutes=30)
# myAir announces when a maintenance break ends; the next refresh waits until a little after it.
OUTAGE_RETRY_MARGIN_S = 60

STORAGE_VERSION = 1

# Okta's authentication statuses.
AUTHN_SUCCESS = "SUCCESS"
AUTH_NEEDS_MFA = "MFA_REQUIRED"

KEYS_TO_REDACT: list[str] = [
    "access_token",
    "Authorization",
    "email",
    "family_name",
    "firstName",
    "given_name",
    "id_token",
    "lastName",
    "login",
    "name",
    "password",
    "Password",
    "preferred_username",
    "sub",
    "token",
    "username",
    "Username",
]
