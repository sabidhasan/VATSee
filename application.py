#API KEY
#AIzaSyBTK9GUrd7sMxjt6EUlHyN9TXPkqb6R0VA

########################
##       IMPORT       ##
########################

from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue
import time, os, requests, sqlite3, sys, re
from math import radians, cos, sin, asin, sqrt
from metar import Metar



########################
##       CONFIG       ##
########################

app = Flask(__name__)
JSGlue(app)

# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response



########################
##       GLOBALS      ##
########################

#Memoization for METAR and airline data
metars = {}
airlines = {}
#Waypoint Data will be stored in memory which significantly speeds up access
waypoints = {}
#List of countries (as Country objects) for purposes of testing whether a certian geographical point (that plane is at)
#is within that country
nations = []        


#TO--DO LOGGING: log application has started
#Populate Waypoints into memory database
conn = sqlite3.connect('static_data.db')
c = conn.cursor()
result = c.execute("""SELECT * FROM "waypoints";""").fetchall()
#Store waypoints, for repeated waypoints :::: {'LINNG' : [ (-23, 43), (123, 56), (-43, 56)] etc.
for line in result:
    #Create list if not present in dictionary already
    if not(line[1] in waypoints):
        waypoints[line[1]] = []
    #Append to dictionary
    waypoints[line[1]].append((float(line[2])/1000000.0, float(line[3])/1000000.0))
    
    
##############################################
###Standard function definitions start here###
##############################################

def callsign_to_icao(callsign):
    ''' Gets a IATA callsign like SEA and return ICAO callsign like KSEA'''
    #Something like "ASIA"
    #TO--DO LOGGING: Log an unnatural callsign (4 letter callsigns are not normal)
    if len(callsign.split("_")[0]) == 4:
        return callsign.split("_")[0]
    else:
        conn = sqlite3.connect('static_data.db')
        c = conn.cursor()
        apt_code = tuple([callsign.split("_")[0]])
        result = c.execute("SELECT * FROM 'airports' WHERE iata=? LIMIT 1", apt_code).fetchone()
        try:
            return result[5]
        except TypeError:
            #No results were found
            return callsign.split("_")[0]
            #TO--DO LOGGING: An IATA code not present in the database, might be interesting to log
    
    
def callsign_to_ATC(callsign):
    '''Gets callsign like 'ATL_GND' and returns a type code:
    0   ATIS    1   CLNC    2   GND    3   TWR    4   APP/DEP    5   CTR    6   UNKNOWN    '''
    
    codes = {"ATIS": 0, "DEL" : 1, "GND" : 2, "TWR" : 3, "APP" : 4, "DEP" : 4, "CTR" : 5, "OBS" : 6}
    if callsign.split("_")[-1] in codes:
        #Foudn the type, return the proper code (This is used by front end to display )
        return codes[callsign.split("_")[-1]]
    else:
        #Unknown type, so it will be passed an unknown code!
        #TO--DO LOGGING: LOG THIS HERE, what ATC is this!!?
        return 6


def callsign_to_loc(callsign):
    '''Function receives a callsign like "ATL_W_GND" or "KATL_CTR" and returns a geographical location for airport'''
    #Database connection
    conn = sqlite3.connect('static_data.db')
    c = conn.cursor()

    #Determine the code friom the string
    apt_code = tuple([callsign.split("_")[0]])

    if len(apt_code[0]) == 3:
        #IATA code provided
        c.execute("SELECT * FROM 'airports' WHERE iata=?", apt_code)
    elif len(apt_code[0])  == 4:
        #ICAO code provided
        c.execute("SELECT * FROM 'airports' WHERE icao=?", apt_code)
    else:
        #TO--DO LOGGING: log this unknown airport, this also messes with the map, so its important to add these airports later!
        return None
    result = c.fetchone()
    try:
        #attempt to return data
        return tuple(list(result[6:9]) + [result[1]])
    except:
        #Likely result was none (aka nothing found in DB)
        #TO--DO LOGGING: log this potential error
        return None


def flightlevel_to_feet(flightlevel):
    '''Function recieves something like 'FL360' and returns 36000'''
    if not(flightlevel):
        return 0
        
    flightlevel = str(flightlevel).lower()
    if "fl" in flightlevel or "f" in flightlevel:
        return int(flightlevel.replace("fl", "").replace("f", "")) * 100
    else:
        #Some pilots file in feet rather than Flight Level, so just attempt to return the integer (eg. 33000)
        try:
            return int(flightlevel.replace("ft", ""))
        except ValueError:
            #TO--DO LOGGING: unknown altitude filed
            return 0
         
            
def decode_airline(callsign):
    '''Gets a name like 'BAW156' or 'BA156' and returns a tuple such as ('British Airways', 'UK', 'Speedbird', 'BAW', '156')'''
    airline_letter = ''
    airline_num = ''
    for c, letter in enumerate(callsign):
        try:
            #See if we are at the airline number part yet
            int(letter)
            if len(airline_letter) == 1:
                #TO--DO LOGGING: airline callsign is weird; potentially log to improve handling of these in the future
                return (callsign, callsign, callsign, callsign, callsign)
            else:
                #Found the airline number at a non-0 place
                airline_num = str(callsign[c:])
                break
        except ValueError:
            #Encountered letter; could improve by keeping index rather than regenerating a string each time TO--DO
            airline_letter += letter
            #TO--DO: add better support for VFR
    #if no airline letter?
    if not(airline_letter):
        return (callsign, callsign, callsign, callsign, callsign)
        #TO--DO LOGGING: callsign is weird

    #Now look in memoized data, and if not found then the DB
    if airline_letter in airlines:
        row = airlines[airline_letter]
    else:
        #Search the database
        conn = sqlite3.connect('static_data.db')
        c = conn.cursor()
        result = c.execute("SELECT * FROM 'airlinecodes' WHERE iata=? OR icao=?", (airline_letter, airline_letter)).fetchone()
        if result:
            #Add to cached data
            airlines[airline_letter] = (result[3], result[5], result[4])
            row = airlines[airline_letter]
        else:
            return (callsign, callsign, callsign, callsign, callsign)
            #TO--DO LOGGING: airline is new, so add it to database in future
    return (row[0], row[1], row[2], airline_letter, airline_num)


def haversine(lon1, lat1, lon2, lat2):
    """
    Haversine formula for calculating the great circle distance between two points 
    on earth. From https://stackoverflow.com/questions/15736995/how-can-i-quickly-estimate-the-distance-between-two-latitude-longitude-points
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    km = 6367 * c
    return km
    

def get_METAR(given_code):
    '''Returns METAR data from aviation weather website from US Government; code is a METAR weather station code.
    Uses 30 minute caching to prevent overaccessing of the Aviation Weather database'''
    #Convert to upper case
    given_code = given_code.upper()
    
    if not(given_code) or len(given_code) != 4:
        return None

    #Check the cache
    if metars.get(given_code):
        #if younger than 1800 seconds, return from cache
        if abs(metars[given_code][0] - time.time()) < 1800:
            #Return the saved information, indicating that it is indeed from the cache (more for debugging purposes)
            metars[given_code][1]["cached"] = "True"
            return metars[given_code][1]
        
    url = 'https://aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&hoursBeforeNow=5&mostRecent=true&stationString=%s' % given_code
    raw_metar_data = requests.get(url).text
    
    #Try to get code and flight conditions
    #TO--DO: potentially use an XML parser here, rather than regex to improve speed of parsing
    code_data = re.findall(r"<raw_text>(.*)<\/raw_text>", raw_metar_data)
    #Get Flight Condition
    flight_category_data = re.findall(r"<flight_category>(.*)<\/flight_category>", raw_metar_data)
    try:
        code = code_data[0]
    except IndexError:
        #There was nothing found!
        #TO--DO LOGGING: either website is down (perhaps include size of raw_metar_data to see if we even got anything!), or something is wrong
        return None
        
    try:
        flight_cat = flight_category_data[0]
    except IndexError:
        flight_cat = "UNKNOWN"

    #Do the work!
    obs = Metar.Metar(code)
    
    #Return dictionary, with some default values filled in
    ret = {"category": flight_cat, "raw_text": code, "clouds": obs.sky_conditions(), "time": None, "wind": None, "wind_value": None, "wind_gust_value": None, \
        "wind_dir": None, "visibility": None, "visibility_value": None, "temp": None, "temp_value": None, "altimeter": None, "sealevelpressure": None}
        
    #Build return dictionary
    if obs.station_id:
        ret["stationID"] = obs.station_id
    
    if obs.time:
        ret["time"] = obs.time.ctime()
    if obs.wind_speed:
        ret["wind"] = obs.wind()
        ret['wind_value'] = obs.wind_speed.value()
    if obs.wind_gust:
        ret['wind_gust_value'] = obs.wind_gust.value()
    if obs.wind_dir:
        ret["wind_dir"] = obs.wind_dir.value()
    if obs.vis:
        ret["visibility"] = obs.visibility()
        ret["visibility_value"] = obs.vis.value()
    if obs.temp:
        ret["temp"] = obs.temp.string("C")
        ret["temp_value"] = obs.temp.value()
    if obs.dewpt:
        ret["temp"] += " / " + obs.dewpt.string("C")
    if obs.press:
        ret["altimeter"] = obs.press.string("in")
    if obs.press_sea_level:
        ret["sealevelpressure"] = obs.press_sea_level.string("mb")
    
    #Cache it
    ret["cached"] = "False"
    metars[given_code] = (time.time(), ret)
    
    return ret


def decode_route(route, departure_airport):
    ''' This recieves a text route (KSFO WAYNE5 DCT BLAHH J20 BABAB STARR4 KLAX, (-123.22, 37.534)),
    and decodes it into tuples of geographical locations'''
    #To be returned
    ret = []

    if not(route):
        return ret

    #set previous waypoint to the departure
    previous_waypoint = departure_airport
    
    #Some pilots file their routes with periods!
    route = route.replace(".", " ").upper()
    
    #Loop through the waypoints as they are now all space-separated
    for count, waypoint in enumerate(route.split(' ')):
        #In case it's not upper case, and get rid of extraneous information
        waypoint = waypoint.split("/")[0]
        
        #If the waypoint is not 3 or 5, then we should move on.
        if not(len(waypoint) in [3,5]):
            continue
        
        #Look for airways (e.g. A56, B38, etc) and ignore them
        if len(waypoint) == 3:
            if (waypoint[0].isalpha() == True and waypoint[1:].isalpha() == False) or waypoint == "DCT":
                continue

        #Look for waypoint in memory-stored dictionary of waypoints
        #Data structure is ===>>    {'Waypoint': [(x, y), (x, y), (x, y)]} #May be one or more location tuples
        if waypoint in waypoints:
            #Initially, closest distance is first point in the dictionary, whose index is 0
            closest_dist = haversine(waypoints[waypoint][0][1], waypoints[waypoint][0][0], previous_waypoint[1], previous_waypoint[0])
            closest_index = 0
            
            #Loop through rest of list of same-named waypoints
            for count, candidates in enumerate(waypoints[waypoint]):
                #Compare the distance for current
                candidate_dist = haversine(previous_waypoint[1], previous_waypoint[0], candidates[1], candidates[0])
                #We found a candiudate that is even closer!
                if candidate_dist < closest_dist:
                    #update the closest dist, and index to current candidate waypoint
                    closest_dist = candidate_dist
                    closest_index = count
                
            #TO--DO: what is the best candidate waypoint??
            if closest_dist < 1000000:
                ret.append((waypoint, waypoints[waypoint][closest_index][0], waypoints[waypoint][closest_index][1]))
                previous_waypoint = waypoints[waypoint][count]
                #TO--DO LOGGING: log what the closest one was (compare to below in ELSE to see what the points being missed are too)
            else:
                #TO--DO LOGGING: we sholuld log the closest candidates - like if there are a bunch/even one ~5000 km away, then we should include them!
                pass
        else:
            #This is a waypoint that wasnt found (probably log it)
            #TO-DO LOGGING: log an unknown waypoint?, unless it has "/" in it
            continue
        
    return ret

#Country memebership (for detemining whether plane is in certain country)
#class countries():
#    ''' This class represents a country, containing its name, polygonal coordinates, and an 'outer box' containing the
#        country in its entirety. The purpose of it is to allow testing of membership of a point within a certain nation '''
#        
#    def __init__(self, name, data):
#        #Name is country name, data is specialized data obtained from Longitude Latitude Dataset for Countries
#        #https://fusiontables.google.com/DataSource?docid=1uL8KJV0bMb7A8-SkrIe0ko2DMtSypHX52DatEE4#rows:id=1
#        self.name = name
#        self.coords = [(float(item.split(',')[0]), float(item.split(',')[1])) for item in data if item]
#        self.xmin = min(self.coords, key=lambda x: x[0])[0]
#        self.xmax = max(self.coords, key=lambda x: x[0])[0]
#        self.ymin = min(self.coords, key=lambda x: x[1])[1]
#        self.ymax = max(self.coords, key=lambda x: x[1])[1]
#
#    def test_membership(self, x, y):
#        #Determines whether given geographical point x, y is in this country
#
#        #First we do a rough test to see whether this point is within the outer box (this is a fast calculation)
#        if (float(x) >= self.xmin and float(x) <= self.xmax and float(y) >= self.ymin and float(y) <= self.ymax) == False:
#            return False
#        
#        #This is the RAY CASTING method, adapted from :
#        #https://stackoverflow.com/questions/36399381/whats-the-fastest-way-of-checking-if-a-point-is-inside-a-polygon-in-python
#        
#        n = len(self.coords)
#        inside = False
#        
#        x = float(x)
#        y = float(y)
#        
#        p1x, p1y = self.coords[0]
#        for i in range(n + 1):
#            p2x, p2y = self.coords[i % n]
#            if y > min(p1y, p2y):
#                if y <= max(p1y, p2y):
#                    if x <= max(p1x, p2x):
#                        if p1y != p2y:
#                            xints = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
#                        if p1x == p2x or x <= xints:
#                            inside = not inside
#            p1x, p1y = p2x, p2y
#        return inside        
#
#with open('countries.txt') as f:
#    for line in f.readlines():
#        try:
#            tmp = line.strip().split('"')
#            country = tmp[2].split(",")[-3]
#            data = re.sub('<[/]?[A-Za-z]*>', '', tmp[1]).split(',0')
#            nations.append(countries(country, data))
#        except IndexError:
#            continue
#
#def country_by_location(lat, lon):
#    ''' This function loops through countries generated above to determine which country contains the given geographical point '''
#    lat = float(lat)
#    lon = float(lon)
#    
#    for nation in nations:
##        return lat
#        #return nation.test_membership()
#        if nation.test_membership(lon, lat) == True:
#            return nation.name
#    return "International territory"
    
    
##############################################
###       Flask route definitions          ###
##############################################
    
@app.route("/")
def index():
   # if not os.environ.get("API_KEY"):
    #    raise RuntimeError("API_KEY not set")
    return render_template("index.html", key="AIzaSyBTK9GUrd7sMxjt6EUlHyN9TXPkqb6R0VA")     #os.environ.get("API_KEY"))
    
    
@app.route("/update")    
def update():    
    ''' This is called by AJAX to return a full update of the plane data '''

    #Open file that is continuously updated by cronupdater.py
    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    #Data structure that will be returned;
    #   holds [ATC, Planes, Centres, administrative data]
    jsondata = [[], [], [], []]
    
    #This keeps id mapping for airports and centres as they are parsed
    tmp_airport_ids = {}
    tmp_centres_ids = {}
    #new pilots get assigned this ID
    pilot_counter = 0
    
    #Get results from DB; returned as tuples; orderby TYPE (type is ATC or PILOT)
    result = c.execute("""SELECT * FROM "onlines" WHERE "latest"=1 ORDER BY 'type'""").fetchall()
    
    #TO--DO LOGGING: if result set length is 0
    if len(result) == 0:
        pass
    
    #Index map for results from database
    atc_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "latitude":6, "longitude":7, "visrange":8, "atismsg":9, "timelogon":10}
    ctr_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "visrange":8, "atismsg":9, "timelogon":10}
    plane_indices = {"callsign": 2, "cid": 3, "real_name": 4, "latitude": 6, "longitude": 7, "timelogon": 10, "altitude": 12, "speed": 13, "heading": 24, "deptime": 20, "altairport" : 21, \
            "aircraft": 14, "tascruise": 15, "depairport" :16, "arrairport": 18, "plannedaltitude": 17, "flighttype": 19, "remarks": 22, "route": 23}

    #Loop through the result set
    for line in result:
        curr_callsign = line[atc_indices["callsign"]].upper()
        row_type = line[11]         #"pilot" or "atc"
        #Check for ATC by Callsign having underscore. There are some logins that say ATC when when piloting...
        if row_type == "ATC":
            #If normal ATC (ASIA is a known ATC that does not have 'ctr' in name but is really a centre)
            if "_" in curr_callsign and not("CTR" in curr_callsign or "OBS" in curr_callsign or "SUP" in curr_callsign) and not(curr_callsign in ["ASIA"]):
                #Get icao callsign (SEA --> KSEA)
                icao = callsign_to_icao(curr_callsign)
                #TO--DO : ppotentially make curr callsign an object
                
                #See if we have run into the ICAO before
                if not(icao in tmp_airport_ids):
                    #New airport! Make a new ID first
                    new_id = len(jsondata[0])
                    #Returns some data about airport from database, like latitude, long, altitude, full name
                    tmp = callsign_to_loc(curr_callsign)
                    
                    if not(tmp is None):
                        new_lat, new_long, new_alt, new_name = tmp
                    else:
                        #TO--DO LOGGING: We should log the Callsign, becuase these airports are very problematic!!!
                        new_lat = line[atc_indices["latitude"]]
                        new_long = line[atc_indices["longitude"]]
                        new_alt = 0
                        new_name = line[atc_indices["cid"]]
                    
                    #ATC_pic is which picture to use for the marker on the front end (it's a sorted concatenation of all available ATC). -1 is simple dot no atc
                    new_data = {"id" : new_id, "icao": icao, "name": new_name, "longitude": new_long, "latitude": new_lat, "altitude": new_alt, "atc": [], "atc_pic" : "-1", "depplanes": [], "arrplanes": []}
                    jsondata[0].append(new_data)
    
                    #Add to tmp airport directory
                    tmp_airport_ids[icao] = new_id
                else:
                    #Airport already exists
                    new_id = tmp_airport_ids[icao]

                #Now, lets update the ATC dictionary of airports with current row's data    
                tmp_atc = {item: line[value] for item, value in atc_indices.items()}
                tmp_atc["atctype"] = callsign_to_ATC(curr_callsign)
    
                jsondata[0][new_id]["atc"].append(tmp_atc)
                
                #5 is center which is plotted spearately
                jsondata[0][new_id]["atc_pic"] = ''.join(sorted(list({str(item["atctype"]) for item in jsondata[0][new_id]["atc"] if item["atctype"] != 5})))
            
            #ASIA is a known non underscore/'CTR' based centre callsign
            elif ("_" in curr_callsign and "CTR" in curr_callsign) or (curr_callsign in ["ASIA"]):
                callsign_initials = curr_callsign.split("_")[0]

                tmp_ctr_atc = {item: line[value] for item, value in ctr_indices.items()}
                tmp_ctr_atc["atctype"] = 5

                #See if centre present or not
                if not(callsign_initials in tmp_centres_ids):
                    #New airport! Make a new ID first
                    new_id = len(jsondata[1])
                    #Use ATC-idices because we dont want lat/long in ctr_indices (becuase they are kept at a differnet level that dictionarhy comprehension line)
                    new_lat = line[atc_indices["latitude"]]
                    new_lon = line[atc_indices["longitude"]]
                    
                    #ATC_pic is which picture to use for the marker on the front end (it's a sorted concatenation of all available ATC). -1 is simple dot no atc
                    ctr_data = {"id": new_id, "icao": callsign_initials, "marker_lat": new_lat, "marker_lon": new_lon, "atc_pic": "0", "atc": [], "polygon": []}
                    jsondata[1].append(ctr_data)
    
                    #Add to tmp airport directory
                    tmp_centres_ids[callsign_initials] = new_id
                else:
                    #Airport already exists
                    new_id = tmp_centres_ids[callsign_initials]

            
                jsondata[1][new_id]["atc"].append(tmp_ctr_atc)
                
        elif row_type == "PILOT":
            
            #Check for airport, create dummy if needed
            #{ callsign      cid    real_name   VATSIMlatitude  	VATSIMlongitude     time_logon      altitude    groundspeed     heading     planned_deptime 	planned_altairport
            #planned_aircraft   planned_tascruise	planned_depairport	planned_altitude	planned_destairport	planned_flighttype  planned_remarks 	planned_route
            #Arrivial_apt_id        dep_apt_id
            #}
            
            #plane_indices = {"callsign": 2, "cid": 3, "real_name": 4, "latitude": 6, "longitude": 7, "timelogon": 10, "altitude": 12, "speed": 13, "heading": 24, "deptime": 20, "altairport" : 21, \
            #"aircraft": 14, "tascruise": 15, "depairport" :16, "arrairport": 18, "plannedaltitude": 17, "flighttype": 19, "remarks": 22, "route": 23}
            
            pilot_counter += 1
            departure_icao = callsign_to_icao(line[plane_indices["depairport"]])
            arrival_icao = callsign_to_icao(line[plane_indices["arrairport"]])
            
            
            
            if not(departure_icao in tmp_airport_ids):
                #Create dummy airport
                dep_new_id = len(jsondata[0])
                #Returns some data about airport from database, like latitude, long, altitude, full name
                tmp = callsign_to_loc(departure_icao)
                if not(tmp is None):
                    new_lat, new_long, new_alt, new_name = tmp
                else:
                    new_lat = 0
                    new_long = 0
                    new_alt = 0
                    new_name = departure_icao
                    #TO--DO: log here because airport was not found
                    
                #ATC_pic is which picture to use for the marker on the front end (it's a sorted concatenation of all available ATC). -1 is simple dot no atc
                new_data = {"id" : dep_new_id, "icao": departure_icao, "name": new_name, "longitude": new_long, "latitude": new_lat, "altitude": new_alt, "atc": [], "atc_pic" : "-1", "depplanes": [], "arrplanes": []}
                jsondata[0].append(new_data)
    
                #Add to tmp airport directory
                tmp_airport_ids[departure_icao] = dep_new_id
            else:
                #Airport already exists
                dep_new_id = tmp_airport_ids[departure_icao]
          
            #Add this plane to the airport, whether newly created or not
            jsondata[0][dep_new_id]["depplanes"].append(pilot_counter)
            
            if not(arrival_icao in tmp_airport_ids):
                #Create dummy airport
                arr_new_id = len(jsondata[0])
                #Returns some data about airport from database, like latitude, long, altitude, full name
                tmp = callsign_to_loc(arrival_icao)
                if not(tmp is None):
                    new_lat, new_long, new_alt, new_name = tmp
                else:
                    new_lat = 0
                    new_long = 0
                    new_alt = 0
                    new_name = arrival_icao
                    
                #ATC_pic is which picture to use for the marker on the front end (it's a sorted concatenation of all available ATC). -1 is simple dot no atc
                new_data = {"id" : arr_new_id, "icao": arrival_icao, "name": new_name, "longitude": new_long, "latitude": new_lat, "altitude": new_alt, "atc": [], "atc_pic" : "-1", "depplanes": [], "arrplanes": []}
                jsondata[0].append(new_data)
    
                #Add to tmp airport directory
                tmp_airport_ids[arrival_icao] = arr_new_id
            else:
                #airport already exists
                arr_new_id = tmp_airport_ids[arrival_icao]

            #Add this plane to the airport, whether newly created or not
            jsondata[0][arr_new_id]["arrplanes"].append(pilot_counter)
        
            #Get airline name (eg. BAW ==> British Airways)
            airline_name, airline_country, airline_callsign, airline_short, flight_num = decode_airline(curr_callsign)
            
            #add plane to plane list
            tmp_pilot = {item: line[value] for item, value in plane_indices.items()}
            tmp_pilot["id"] = pilot_counter     #JSON id, tjat is reffrerd to by airports!
            tmp_pilot["depairport_id"] = dep_new_id
            tmp_pilot["arrairport_id"] = arr_new_id
            
            tmp_pilot["airline_name"] = airline_name
            tmp_pilot["airline_country"] = airline_country
            tmp_pilot["airline_callsign"] = airline_callsign
            tmp_pilot["airline_short"] = airline_short
            tmp_pilot["airline_flightnum"] = flight_num
#            tmp_pilot["current_country"] = country_by_location(tmp_pilot["latitude"], tmp_pilot["longitude"])
            #Route is 23
            #TO--DO: WORKING!!!
            tmp_pilot["detailedroute"] = decode_route(line[23], (jsondata[0][dep_new_id]["latitude"], jsondata[0][dep_new_id]["longitude"]))
            jsondata[2].append(tmp_pilot)
            
    #Add admin stuff to final json column
    jsondata[3].append({"time_updated": result[0][1], "number_of_records": len(result), "size_bytes": sys.getsizeof(jsondata)})

    #sort the ATCs
    #TO--DO: this needs to be done in the front end
    #jsondata[0] = sorted(jsondata[0], key=lambda x: len(x["atc"]), reverse=True)

        #TO--DO: ALSO RETURN A HISTORY OF THIS CALLSIGN+CID (javascript will use this to plot a path!)!!!
        #TO--DO: only return releavnt part of map;
        #TO--DO: only return updated data rather than everytthing

#TO--DO: ADD {PILOT DATA HERE!!!}

  #  memo = airports
    return jsonify(jsondata)
    
@app.route("/history")    
def history():    
    ''' This recieves a parameter (basically a JSON of either a plane or ATC), and returns an JSON to put with airport data '''
    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    arguments = dict(request.args)
    jsondata = []
        
    #DO SQL search - TO--DO: limit this to one day hisotry only or something like that TO--DO: prevetnt database injections!
    x = "SELECT * FROM 'onlines' WHERE cid = '%s' AND type = 'PILOT' AND ABS(time_updated - %s) < 50000 ORDER BY time_updated" % (arguments['cid'][0], time.time())
    result = c.execute(x).fetchall()
        
    #Do time delta for plotting
    orig_time = 0
    for row in result:
        if orig_time == 0:
            orig_time = row[1]
        time_delta = abs(orig_time - row[1])
        #sending back time_delta        altitude        speed
        jsondata.append([float(time_delta), row[12], row[13]])

    return jsonify(jsondata)
        
@app.route("/metar")    
def metar():    
    ''' This route returns JSON of requested METAR '''
    #Get the METAR ID'
    try:
        metarID = dict(request.args)['station'][0]
        ret = get_METAR(metarID)
    except KeyError:
        return jsonify(None)
    return jsonify(ret)


@app.route("/worstweather")    
def worstweather():
    '''Looks through currently online airports, and returns the worst weather '''
    #Parse raw airports
    try:
        worst_weather_airports = dict(request.args)['airports'][0].split(" ")
    except KeyError:
        #log this; no METAR shouldnt be requested
        return jsonify(None)
    
    ret = {}
    
    #Loop through airports and get METARs on them, calculate wind, visibility, precipitation, temperature SCORES
    for airport in worst_weather_airports:
        #No airport given!
        if not(airport): continue
    
        #get METAR 
        curr_metar = get_METAR(airport)
        
        if curr_metar is None:
            #SHould log this here, aiport ICAO code was invalid!
            continue

        #Calculate wind score
        cur_wind = ((curr_metar['wind_value'] / 10) % 10)
        try:
            cur_wind += ((abs(curr_metar['wind_gust_value'] - curr_metar['wind_value']) / 10) % 10)
        except TypeError:
            #No gust data must exist
            pass
        
        #Calculate visibility score\
        #TO--DO: proper visiubilty score: pronblem is some stations report in metric units
        cur_vis = 1#(curr_metar['visibility_value'] / 10) % 10

        #Calculate precipitation score
        #TO--DO
        cur_precip = 1
        #DZ Drizzle
        #RA Rain
        #SN Snow
        #SG Snow Grains
        #IC Ice Crystals
        #PL Ice Pellets
        #GR Hail
        #GS Small Hail
        #   and/or Snow
        #   Pellets

        #Calculate temperature score
        if 10 < curr_metar['temp_value'] < 25:
            cur_temp = 0
        elif curr_metar['temp_value'] > 25:
            #its too high or low
            cur_temp = ((curr_metar['temp_value'] - 25) / 5) % 5
        else:
            #< 25
            cur_temp = abs(curr_metar['temp_value'] - 10) / 5 % 5

        #Build  return
        ret[airport] = {'wind_score': round(cur_wind, 1), 'wind': curr_metar['wind'], 'visibility_score': cur_vis, 'visibility': curr_metar['visibility'], \
        'precipitation_score': cur_precip, 'temperature_score': round(cur_temp, 1), 'temperature': curr_metar['temp'], \
        'cached': curr_metar['cached']}
    return jsonify(ret)
        