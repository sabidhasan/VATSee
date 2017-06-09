#API KEY
#AIzaSyBTK9GUrd7sMxjt6EUlHyN9TXPkqb6R0VA

from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue
import time, requests, os, sqlite3, sys

# configure application
app = Flask(__name__)
JSGlue(app)

#Memoization
memo = []

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
    
    codes = {"ATIS": 0,
        "CLNC" : 1,
        #TO--DO: make sure clearance code is correct
        "GND" : 2,        "TWR" : 3,        "APP" : 4,        "DEP" : 4,        "CTR" : 5,        "OBS" : 6    }
    if callsign.split("_")[-1] in codes:
        #Foudn the type, return the proper code (This is used by front end to display )
        return codes[callsign.split("_")[-1]]
    else:
        #Unknown type, so it will be passed an unknown code!
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
    #jsondata holds ATC, Planes, Centres
    jsondata = [[], [], [], []]
    tmp_airport_ids = {}            #This keeps id mapping for airports as they are parsed
    tmp_centres_ids = {}
    pilot_counter = 0               #Keeps track of Pilot IDs
    
    #Get results from DB; returned as tuples
    result = c.execute("SELECT * FROM 'onlines' WHERE ABS(time_updated - %s) < 60 ORDER BY 'type'" % time.time()).fetchall()
    
    for line in result:
        #Index map for results from database
        atc_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "latitude":6, "longitude":7, "visrange":8, "atismsg":9, "timelogon":10}
        ctr_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "visrange":8, "atismsg":9, "timelogon":10}
        plane_indices = {"callsign": 2, "cid": 3, "real_name": 4, "latitude": 6, "longitude": 7, "timelogon": 10, "altitude": 12, "speed": 13, "heading": 24, "deptime": 20, "altairport" : 21, \
            "aircraft": 14, "tascruise": 15, "depairport" :16, "arrairport": 18, "plannedaltitude": 17, "flighttype": 19, "remarks": 22, "route": 23}

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
                jsondata[0][new_id]["atc_pic"] = (''.join(sorted([str(item["atctype"]) for item in jsondata[0][new_id]["atc"]]))).replace('5', '')
                
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
        
            #add plane to plane list
            tmp_pilot = {item: line[value] for item, value in plane_indices.items()}
            tmp_pilot["id"] = pilot_counter     #JSON id, tjat is reffrerd to by airports!
            tmp_pilot["depairport_id"] = dep_new_id
            tmp_pilot["arrairport_id"] = arr_new_id
            jsondata[2].append(tmp_pilot)
            
    #Add admin stuff to final json column
    jsondata[3].append({"time_updated": result[0][1], "number_of_records": len(result), "size_bytes": sys.getsizeof(jsondata)})


        #TO--DO: ALSO RETURN A HISTORY OF THIS CALLSIGN+CID (javascript will use this to plot a path!)!!!
        #TO--DO: only return releavnt part of map;
        #TO--DO: only return updated data rather than everytthing

#TO--DO: ADD {PILOT DATA HERE!!!}

  #  memo = airports
    return jsonify(jsondata)