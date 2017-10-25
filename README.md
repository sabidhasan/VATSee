# VATSee
## Introduction
Allows spying into the world of Vatsim (Made as the final project for Harvard CS50 on eDX)

VATSIM is a non-profit organization that runs a worldwide, Internet-based flight-simulation network. Users connect to the network to either fly as a pilot, or to direct traffic as an air traffic controller. The network is known for its realism and has been even covered by  media publications like the front page of the Wall Street Journal.

VATSee is intended as a website that can display a live, pilot-friendly view into the world of VatSim, and is meant to help pilots who are flying on the network.


## Getting Started/Prerequisites
The backend server requires the following dependencies in addition to the Python standard library:
1. **Flask** microframework

2. **[Metar](https://github.com/tomp/python-metar)** (install using `pip`)

3. **[JSGlue](https://github.com/stewartpark/Flask-JSGlue)** (installing using `pip`)


## Deployment
The way the code is written is for testing purposes only - deployment is not intended using this version.

Please look into lines such as `app.config["DEBUG"]` and remove appropriately if deploying non-locally.
**Debug mode should never be used in a production environment!**


## To Do
1) Logs - there are missing airports, centers, etc. as logged in the log, which need to be dealt with (basically injected into the database)

2) The **backend** should be made into a Python class rather than the numerous functions, or at least imported in

3) The **front end** should be made into objects (latest_json), which would greatly clean up the code, and speed it up

4) **Hovered airplanes** should show what countries they are flying over - this was attempted at one point, but failed

5) More **stats** - Longest flight, VFR/IFR breakdown, longest logged on pilot

6) **Enroute** feature                 if LOGGED IN, show current plane, location, speed, direction, etc.
                LINKS to current airport's METAR, airport diagram, ILS freq, runway heading, charts, etc.

7) **Events** - pull upcoming events and display on the map

8) **RESTful** - the /Update method in the python backend can be made into a RESTful API for accessing VATSim data
                eg. http://this-web-site/airports/untowered/arrivalsanddepartures?activity&gt1
                    should find all untowered airports and return arrival and departure activity for those with greater than 1 (arrival+departure)


## Author
Abid Hasan
