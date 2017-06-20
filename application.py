#API KEY
#AIzaSyBTK9GUrd7sMxjt6EUlHyN9TXPkqb6R0VA

from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue
import time, requests, os, sqlite3, sys
from math import radians, cos, sin, asin, sqrt

# configure application
app = Flask(__name__)
JSGlue(app)

#Memoization
memo = []
airlines = {}

# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response

# configure CS50 Library to use SQLite database
#db = SQL("sqlite:///mashup.db")
def callsign_to_icao(callsign):
    ''' Gets a IATA callsign like SEA and return ICAO callsign like KSEA'''
    if len(callsign.split("_")[0]) == 4:
        return callsign.split("_")[0]
    else:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        apt_code = tuple([callsign.split("_")[0]])
        result = c.execute("SELECT * FROM 'airports' WHERE iata=?", apt_code).fetchone()
        try:
            return result[5]
        except TypeError:
            #No results were found
            return callsign.split("_")[0]
    
def callsign_to_ATC(callsign):
    '''Gets callsign like 'ATL_GND' and returns a type code:
    0   ATIS    1   CLNC    2   GND    3   TWR    4   APP/DEP    5   CTR    6   UNKNOWN    '''
    
    codes = {"ATIS": 0, "DEL" : 1, "GND" : 2, "TWR" : 3, "APP" : 4, "DEP" : 4, "CTR" : 5, "OBS" : 6}
    if callsign.split("_")[-1] in codes:
        #Foudn the type, return the proper code (This is used by front end to display )
        return codes[callsign.split("_")[-1]]
    else:
        #Unknown type, so it will be passed an unknown code!
        #TO--DO: LOG THIS HERE
        return 6


def callsign_to_loc(callsign):
    '''Function receives a callsign like "ATL_W_GND" or "KATL_CTR" and returns a geographical location for airport'''
    #Database connection
    conn = sqlite3.connect('database.db')
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
        return None
    result = c.fetchone()
    try:
        return tuple(list(result[6:9]) + [result[1]])
    except:
        #Likely result was none (aka nothing found in DB)
        return None

def flightlevel_to_feet(flightlevel):
    '''Function recieves something like 'FL360' and returns 36000'''
    
    if not(flightlevel):
        return 0
        
    flightlevel = str(flightlevel).lower()
    if "fl" in flightlevel or "f" in flightlevel:
        return int(flightlevel.replace("fl", "").replace("f", "")) * 100
    else:
        try:
            return int(flightlevel)
        except ValueError:
            return 0
            
def decode_airline(callsign):
    '''Gets a name like 'BAW156' or 'BA156' and returns a tuple such as ('British Airways', 'UK', 'Speedbird', 'BAW', '156')'''
    airline_letter = ''
    airline_num = ''
    for c, letter in enumerate(callsign):
        try:
            int(letter)
            if len(airline_letter) == 1:
                return (callsign, callsign, callsign, callsign, callsign)
            else:
                airline_num = str(callsign[c:])
                break
        except ValueError:
            airline_letter += letter
            #TO--DO: add better support for VFR
    #if no airline letter?
    if not(airline_letter):
        return (callsign, callsign, callsign, callsign, callsign)

    #Now look in saved data, and if not found then the DB
    if airline_letter in airlines:
        row = airlines[airline_letter]
    else:
        #Search the database
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        result = c.execute("SELECT * FROM 'airlinecodes' WHERE iata=? OR icao=?", (airline_letter, airline_letter)).fetchone()
        if result:
            airlines[airline_letter] = (result[3], result[5], result[4])
            row = airlines[airline_letter]
        else:
            return (callsign, callsign, callsign, callsign, callsign)
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



@app.route("/")
def index():
   # if not os.environ.get("API_KEY"):
    #    raise RuntimeError("API_KEY not set")
    return render_template("index.html", key="AIzaSyBTK9GUrd7sMxjt6EUlHyN9TXPkqb6R0VA")     #os.environ.get("API_KEY"))
    
@app.route("/update")    
def update():    
    #Check for latest file from database
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    result = len(c.execute("SELECT * FROM 'onlines' WHERE %s - time_updated < 60" % time.time()).fetchall())

    if result == 0:
        #Need to update database!
        #TO--DO randomize server
        #http://status.vatsim.net/status.txt
        r = requests.get('http://data.vattastic.com/vatsim-data.txt').text
        #TO--DO: tupleise this injection ot prevent db attacks
        for line in r.split("\n"):
            vals = line.split(":")

            if len(vals) != 42 or line[0] == ';' or not(vals[5] and vals[6]):
                #No location specified
                #Pilot and ATC lines have 42 entries, so if this line doesn't then continue
                #or if line is a comment line
                continue

            #Check if pilot or ATC
            if vals[3] == "ATC":
                try:
                    inj = '''INSERT INTO 'onlines' ("callsign", "time_updated", "cid", "real_name", "frequency", "VATSIMlatitude", "VATSIMlongitude", "visible_range", "ATIS_msg", "time_logon", "type")''' + \
                    ''' VALUES ("%s", "%s", "%s", "%s", "%s", %s, %s, %s, "%s", "%s", "%s")''' % (vals[0], str(int(time.time())), vals[1], vals[2], vals[4] , float(vals[5]), float(vals[6]), int(vals[19]), \
                    vals[35].replace("\"", "").replace("'", ""), str(vals[37]), vals[3])
                    c.execute(inj)
                except:
                    #TO--DO Log the error here
                    print("Error", vals)
                    continue
                
            elif vals[3] == "PILOT":
                try:
                    inj = '''INSERT INTO "onlines" ("callsign", "time_updated", "cid", "real_name", "VATSIMlatitude", "VATSIMlongitude", "time_logon", "type", "altitude", "groundspeed"''' + \
                    ''', "planned_aircraft", "planned_tascruise", "planned_depairport", "planned_altitude", "planned_destairport", "planned_flighttype", "planned_deptime", "planned_altairport"''' + \
                    ''', "planned_remarks", "planned_route", "heading") VALUES ("%s", "%s", "%s", "%s", %s, %s, "%s", "%s", %s, %s, "%s", "%s", "%s", %s, "%s", "%s", "%s", "%s", "%s", "%s", %s)''' % \
                    (vals[0], str(int(time.time())), vals[1], vals[2], float(vals[5]), float(vals[6]), str(vals[37]), vals[3], int(vals[7]), int(vals[8]), vals[9], vals[10], vals[11], 
                    flightlevel_to_feet(vals[12]), vals[13], vals[21], vals[22], vals[28], vals[29].replace("\"", "").replace("'", ""), vals[30].replace("\"", "").replace("'", ""), int(vals[38]))
                    c.execute(inj)
                except:
                    #TO--DO Log the error here
                    print("Error", vals)
                    continue
            else:
                #TO--DO: log this because its not ATC or pilot!
                pass
        conn.commit()
    #else:
        #No update needed so just return memo, if it exists
    #    if memo: return jsonify(memo)

    ###########################
    #Jsonify the ATC data !!  #
    ###########################
    # - id, name, location, ATC {callsign, cid, name, freq, latitude, longitude, visrange, atismsg, timelogon}, planes {id, dep/arr}
    #jsondata holds ATC, Planes, Centres, administrative data
    jsondata = [[], [], [], []]
    tmp_airport_ids = {}            #This keeps id mapping for airports as they are parsed
    tmp_centres_ids = {}
    pilot_counter = 0               #Keeps track of Pilot IDs
    
    #Get results from DB; returned as tuples
    result = c.execute("SELECT * FROM 'onlines' WHERE ABS(time_updated - %s) < 60 ORDER BY 'type'" % time.time()).fetchall()
    
    #Index map for results from database
    atc_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "latitude":6, "longitude":7, "visrange":8, "atismsg":9, "timelogon":10}
    ctr_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "visrange":8, "atismsg":9, "timelogon":10}
    plane_indices = {"callsign": 2, "cid": 3, "real_name": 4, "latitude": 6, "longitude": 7, "timelogon": 10, "altitude": 12, "speed": 13, "heading": 24, "deptime": 20, "altairport" : 21, \
            "aircraft": 14, "tascruise": 15, "depairport" :16, "arrairport": 18, "plannedaltitude": 17, "flighttype": 19, "remarks": 22, "route": 23}

    for line in result:

        curr_callsign = line[atc_indices["callsign"]]
        row_type = line[11]         #"pilot" or "atc"
        #TO--DO: auto delet old entries when greater than one day
        #Check for ATC by Callsign having underscore. There are some logins that say ATC when when piloting...
        if row_type == "ATC":
            #Either normal ATC, or Centre
            if "_" in curr_callsign and not("CTR" in curr_callsign or "OBS" in curr_callsign or "SUP" in curr_callsign):
                #Get icao callsign (SEA --> KSEA)
                icao = callsign_to_icao(curr_callsign)
                #TO--DO : ppotentially make curr callsign anm object
                
                if not(icao in tmp_airport_ids):
                    #New airport! Make a new ID first
                    new_id = len(jsondata[0])
                    #Returns some data about airport from database, like latitude, long, altitude, full name
                    tmp = callsign_to_loc(curr_callsign)
                    
                    if not( tmp is None):
                        new_lat, new_long, new_alt, new_name = tmp
                    else:
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
                #''.join(sorted(list({str(item["atctype"]) for item in jsondata[0][new_id]["atc"] if item["atctype"] != 5})))
                #(''.join()).replace('5', '')
                #(''.join(sorted([str(item["atctype"]) for item in jsondata[0][new_id]["atc"]]))).replace('5', '')
                
            elif "_" in curr_callsign and "CTR" in curr_callsign:
                callsign_initials = curr_callsign.split("_")[0]
                
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

                tmp_ctr_atc = {item: line[value] for item, value in ctr_indices.items()}
                tmp_ctr_atc["atctype"] = 5
            
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

    j = dict(request.args)
    if j['type'][0] == "ATC":

        #Arriving / departing
        jsondata = [[], []]
        #THis is Airport, so show how many ground, taxxing, within 15 nm 
        x = "SELECT * FROM 'onlines' WHERE ABS(time_updated - %s) < 60 AND type = 'PILOT'" % time.time()
        result = c.execute(x).fetchall()
        
        for row in result:
            #If not arriving or departing from the given airport, then move on
            if not(j['data[icao]'][0] in [callsign_to_icao(row[18]), callsign_to_icao(row[16])] ): continue
            
            #Calculate distance, speed, altitude
            dist = haversine(float(j['data[longitude]'][0]), float(j['data[latitude]'][0]), float(row[7]), float(row[6]))
            speed = row[13]
            airport_altitude = int(j['data[altitude]'][0])
            plane_altitude = row[12]
            
            #create pilot dictionary to be appended
            tmp_pilot = {'callsign': row[2], 'cid': row[3], 'altitude': row[12], 'groundspeed': row[13], 'planned_aircraft': row[14], 'planned_tascruise': row[15], \
            'planned_depairport': row[16], 'planned_altitude': row[17], 'planned_destairport': row[18], 'planned_deptime': row[20], 'heading': row[24], \
            'airline_name': decode_airline(row[2])[0], 'airline_callsign': decode_airline(row[2])[2], 'airline_short': decode_airline(row[2])[3], 'airline_flightnum': decode_airline(row[2])[4]}
            
            #Distance from airport
            tmp_pilot['distance_from_airport'] = int(dist)
            
            #close by (<10), speed 0 (menaing parked), and on the ground (altitude same)
            if dist < 15 and speed == 0 and abs(airport_altitude - plane_altitude) < 50:
                status = "In terminal"
                #jsondata[0].append(tmp_pilot)
            #moving on the ground
            elif dist < 15 and speed > 0 and abs(airport_altitude - plane_altitude) < 50:
                status = "Taxiing"
            #distance is nearby (imminently arriving/departing)
            elif dist < 55 and j['data[icao]'][0] == callsign_to_icao(row[18]):
                status = "Arriving"
            elif dist < 55 and j['data[icao]'][0] == callsign_to_icao(row[16]):
                status = "Departing"
            elif dist > 55 and speed == 0:
                status = "Loading pax"
            elif dist > 55 and speed < 55:
                status = "Taxiing"
            else:
                status = "Enroute"
            tmp_pilot['status'] = status
            
            #If arriving
            if j['data[icao]'][0] == callsign_to_icao(row[18]):
                jsondata[0].append(tmp_pilot)
            elif j['data[icao]'][0] == callsign_to_icao(row[16]):
                #departing aircraft
                jsondata[1].append(tmp_pilot)
        
        return jsonify(jsondata)
    elif j['type'][0] == "PLANE":
        # [distance from origin, distance to destination], [{time: altitude}], [{time: speed}]
        jsondata = []
        
        #DO SQL search - TO--DO: limit this to one day hisotry only or something like that TO--DO: prevetnt database injections!
        x = "SELECT * FROM 'onlines' WHERE cid = '%s' AND type = 'PILOT' AND ABS(time_updated - %s) < 50000 ORDER BY time_updated" % (j['data[cid]'][0], time.time())
        print(x)
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