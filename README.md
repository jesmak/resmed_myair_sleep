# ResMed myAir Sleep

Home Assistant integration that reads a ResMed CPAP's nights from myAir and keeps every night, with the bedroom's
temperature and humidity over the night's session.

[![GitHub Release][releases-shield]][releases] [![GitHub Release Date][release-date-shield]][releases] [![Downloads][downloads-shield]][releases] [![Marketplace][marketplace-shield]][marketplace] [![License][license-shield]](LICENSE)

## What is it?

A ResMed CPAP, such as an AirSense 10 or 11, uploads each night to ResMed's myAir service, and the myAir app shows the
night's usage, AHI, mask leak and sleep score. This integration logs in to the same account and brings those nights
into Home Assistant.

A night in myAir has no start or end time. The integration keeps every night it has seen in its own storage, without
a limit, and works out when the night's session was from the machine's uploads.
With a temperature and a humidity sensor chosen for the bedroom, it also keeps their average, lowest and highest
values over each night's session, read from Home Assistant's recorder, so the room's conditions can be compared with
how the nights went.

The sensors show the latest night. The stored nights are available to cards through a websocket command.

## Installation

### With the Marketplace

1. Open Settings › Marketplace, choose Add from link and paste `https://github.com/jesmak/resmed_myair_sleep`
2. Open ResMed myAir Sleep in the Marketplace and choose Install
3. Restart Home Assistant
4. In Settings, open Devices & services, add an integration and choose ResMed myAir Sleep

### Manual

1. Copy `custom_components/resmed_myair_sleep` from the source code of the [latest release][releases] to the
   `config/custom_components` folder of your Home Assistant installation
2. Restart Home Assistant
3. In Settings, open Devices & services, add an integration and choose ResMed myAir Sleep

## Settings

Setup asks for the account, then for the code ResMed emails to it, then for the bedroom's sensors.

| Name        | Type   | Description                                                                                         | Default  |
| ----------- | ------ | --------------------------------------------------------------------------------------------------- | -------- |
| Email       | text   | The account you sign in to the myAir app with                                                       | required |
| Password    | text   | The account's password                                                                              | required |
| Region      | select | Europe for an account made at myair.resmed.eu, North America for one made at myair.resmed.com       | Europe   |
| Code        | text   | The verification code ResMed sends to the account's email during setup                              | required |
| Temperature | entity | A temperature sensor in the bedroom. Its average, lowest and highest value are kept with each night | none     |
| Humidity    | entity | A humidity sensor in the bedroom. Its average is kept with each night                               | none     |

The sensors can be changed later from the integration's options. A change applies to the nights to come. If myAir
stops accepting the login, Home Assistant asks for the password again.

The integration polls myAir every 30 minutes. Its first poll brings every night myAir gives for the current and the
previous month.

## Sensors

The sensors are on a device named after the machine, such as AirSense 11 AutoSet, and show its latest night.

| Sensor              | Unit  | Description                                                                                        |
| ------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| Night               | date  | The night's date. A night that starts after midnight still has the previous day's date             |
| Sleep start         | time  | When the session started                                                                           |
| Sleep end           | time  | When the session ended                                                                             |
| Usage               | h     | How long the machine was used                                                                      |
| AHI                 |       | Apnea–hypopnea index, events per hour                                                              |
| Mask leak           | L/min | The mask's leak as myAir reports it, its leak percentile                                           |
| Mask on/off         |       | How many times the mask was put on and taken off                                                   |
| Sleep score         |       | myAir's score for the night, out of 100                                                            |
| Usage score         |       | The part of the score from usage, out of 70                                                        |
| AHI score           |       | The part from AHI, out of 5                                                                        |
| Mask score          |       | The part from putting the mask on and off, out of 5                                                |
| Leak score          |       | The part from the mask's leak, out of 20                                                           |
| Temperature         | °C    | The bedroom's time-weighted average temperature over the session, when a temperature sensor is set |
| Lowest temperature  | °C    | The lowest temperature over the session                                                            |
| Highest temperature | °C    | The highest temperature over the session                                                           |
| Humidity            | %     | The bedroom's time-weighted average humidity over the session, when a humidity sensor is set       |
| Compliance, 30 days | %     | The share of the last 30 nights with at least 4 hours of use                                       |
| Last upload         | time  | When the machine last uploaded to myAir                                                            |

The temperatures are in the unit of the chosen sensor.

### The session and the room's conditions

A myAir night has no start or end time. The machine uploads to myAir when the mask comes off, so the integration sets
the newest night's start as the machine's last upload minus the night's usage, and its end as the start plus the
usage. Time with the mask off in the middle of the night isn't counted, so after a break the start comes out later than
it really was. A start is set only from an upload on the night's date or the next day, so the nights from before the
integration was set up have no session.

When a night's session is set or its usage grows, the integration reads the recorder's history of the bedroom's
sensors over the session and keeps the result with the night. The recorder keeps 10 days by default, so a night
imported later than that gets no conditions.

## Actions

| Action                             | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `resmed_myair_sleep.import_nights` | Adds nights kept elsewhere to the stored nights |

It takes `config_entry_id`, the integration's entry, and `nights`, a list of nights, each with its `date` and any of
the fields a stored night has (below). A value already stored is never replaced. When a night gets a start and usage
but no end, its end is set as the start plus the usage. When it gets a session but no room's conditions, they are read
from the recorder, as for the nights myAir gives. Times need their UTC offset. The action returns
`nights_changed`, the number of nights it added to or changed.

```yaml
action: resmed_myair_sleep.import_nights
data:
    config_entry_id: 01JEXAMPLE0000000000000000
    nights:
        - date: "2026-02-03"
          start: "2026-02-03T23:12:00+02:00"
          usage_minutes: 412
          ahi: 2.1
```

## The stored nights

Each stored night has its `date` and the fields it has data for:

| Field                                                           | Description                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `start`, `end`                                                  | The session's start and end, as ISO times                                |
| `usage_minutes`                                                 | Usage in minutes                                                         |
| `ahi`, `leak`, `mask_pairs`                                     | AHI, mask leak in L/min, and the times the mask was put on and taken off |
| `score`, `usage_score`, `ahi_score`, `mask_score`, `leak_score` | The sleep score and its parts                                            |
| `temperature`, `temperature_min`, `temperature_max`             | The bedroom's average, lowest and highest temperature over the session   |
| `humidity`, `humidity_min`, `humidity_max`                      | The bedroom's average, lowest and highest humidity over the session      |
| `temperature_readings`, `humidity_readings`                     | How many readings each was computed from                                 |

A card gets them over the websocket with `{"type": "resmed_myair_sleep/nights", "entry_id": "<entry id>"}`, which
answers `{"nights": [...]}`, oldest first.

## Data

The nights come from ResMed's myAir, from the same service the myAir app uses, and the room's conditions from your own
sensors in Home Assistant's recorder.

This is an unofficial integration. It isn't affiliated with or endorsed by ResMed. Each user logs in with their own
myAir account, and using it may be against ResMed's terms of service, so use it at your own risk. It will be withdrawn
if ResMed objects. The figures are myAir's and are not medical advice.

## Translating

The integration's texts are in `custom_components/resmed_myair_sleep/translations/`, one JSON file per language, named
by its language code, such as `en.json` and `fi.json`. To add a language, copy `en.json` to the new language's code
and translate the values.

## Development

Requires Python 3.14, the version the current Home Assistant needs.

```
python3.14 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
.venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/pytest
```

| Path                                                  | What it contains                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `custom_components/resmed_myair_sleep/client/`        | The myAir client, with the login by the emailed code and the GraphQL queries                |
| `custom_components/resmed_myair_sleep/nights.py`      | The stored nights, with merging myAir's records, the session, the conditions and compliance |
| `custom_components/resmed_myair_sleep/coordinator.py` | Polling myAir, the storage, and reading the room's conditions from the recorder             |
| `custom_components/resmed_myair_sleep/sensor.py`      | The sensors                                                                                 |
| `custom_components/resmed_myair_sleep/__init__.py`    | Setting up, the action and the websocket command                                            |
| `tests/`                                              | Tests, run with pytest and a mocked myAir                                                   |

## Support

Hey dude! Help me out for a couple of :beers: or a :coffee:!

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/black_img.png)](https://www.buymeacoffee.com/jesmak)

## Thanks

The myAir client started from [resmed_myair_sensors](https://github.com/prestomation/resmed_myair_sensors), whose MIT
licence and copyright are kept in [LICENSE](LICENSE).

## License

MIT, see [LICENSE](LICENSE).

[releases-shield]: https://img.shields.io/github/release/jesmak/resmed_myair_sleep.svg?style=for-the-badge
[release-date-shield]: https://img.shields.io/github/release-date/jesmak/resmed_myair_sleep?style=for-the-badge
[releases]: https://github.com/jesmak/resmed_myair_sleep/releases
[downloads-shield]: https://img.shields.io/github/downloads/jesmak/resmed_myair_sleep/total.svg?style=for-the-badge
[marketplace-shield]: https://img.shields.io/badge/Marketplace-Custom-orange.svg?style=for-the-badge
[marketplace]: https://my.home-assistant.io/redirect/marketplace_repository/?owner=jesmak&repository=resmed_myair_sleep&category=integration
[license-shield]: https://img.shields.io/github/license/jesmak/resmed_myair_sleep.svg?style=for-the-badge
