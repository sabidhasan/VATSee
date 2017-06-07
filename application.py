#API KEY
#AIzaSyBTK9GUrd7sMxjt6EUlHyN9TXPkqb6R0VA

from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue
import time, requests, os, sqlite3

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
    
    flightlevel = str(flightlevel).lower()
    if "fl" in flightlevel:
        return int(flightlevel.replace("fl", "")) * 100
    else:
        try:
            return int(flightlevel)
        except ValueError:
            return flightlevel
            

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
                    print("Error", vals)
                    continue
                
            elif vals[3] == "PILOT":
            #try:
                inj = '''INSERT INTO "onlines" ("callsign", "time_updated", "cid", "real_name", "VATSIMlatitude", "VATSIMlongitude", "time_logon", "type", "altitude", "groundspeed"''' + \
                    ''', "planned_aircraft", "planned_tascruise", "planned_depairport", "planned_altitude", "planned_destairport", "planned_flighttype", "planned_deptime", "planned_altairport"''' + \
                    ''', "planned_remarks", "planned_route", "heading") VALUES ("%s", "%s", "%s", "%s", %s, %s, "%s", "%s", %s, %s, "%s", "%s", "%s", %s, "%s", "%s", "%s", "%s", "%s", "%s", %s)''' % \
                    (vals[0], str(int(time.time())), vals[1], vals[2], float(vals[5]), float(vals[6]), str(vals[37]), vals[3], int(vals[7]), int(vals[8]), vals[9], vals[10], vals[11], 
                    flightlevel_to_feet(vals[12]), vals[13], vals[21], vals[22], vals[28], vals[29].replace("\"", "").replace("'", ""), vals[30].replace("\"", "").replace("'", ""), int(vals[38]))
                
                c.execute(inj)
            #    except:
            #        print("Error", vals)
            #        continue
            else:
                #TO--DO: log this because its not ATC or pilot!
                pass
            
                
            #except (ValueError, IndexError):
            #    #probably a comment line, or otherwise non-data line
            #    print(inj)
            #    continue
           # except:# sqlite3.OperationalError:
                #weird error, let's log it
        #        print("Error", inj) 
         #       continue
        conn.commit()
    #else:
        #No update needed so just return memo, if it exists
    #    if memo: return jsonify(memo)

    #Jsonify the ATC data - id, name, location, ATC {callsign, cid, name, freq, latitude, longitude, visrange, atismsg, timelogon}, planes {id, dep/arr}
    airports = []
    tmp_airport_ids = {}            #This keeps id mapping for airports as they are parsed
    
    #Get results from DB; returned as tuples
    result = c.execute("SELECT * FROM 'onlines' WHERE ABS(time_updated - %s) < 60 AND type='ATC'" % time.time()).fetchall()

    #Index map for results from database
    atc_indices = {"callsign":2, "cid":3, "name":4, "freq":5, "latitude":6, "longitude":7, "visrange":8, "atismsg":9, "timelogon":10}
    
    for line in result:
        curr_callsign = line[atc_indices["callsign"]]
    #TO--DO: auto delet old entries when greater than one day
        #Check for ATC by Callsign having underscore. There are some logins that say ATC when when piloting...
        if "_" in curr_callsign and not("CTR" in curr_callsign or "OBS" in curr_callsign or "SUP" in curr_callsign):
            #Get icao callsign (SEA --> KSEA)
            icao = callsign_to_icao(curr_callsign)
            #TO--DO : ppotentially make curr callsign anm object
            

            if not(icao in tmp_airport_ids):
                #New airport! Make a new ID first
                new_id = len(airports)
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
                new_data = {"id" : new_id, "name": new_name, "longitude": new_long, "latitude": new_lat, "altitude": new_alt, "atc": [], "atc_pic" : "-1", "planes": []}
                airports.append(new_data)

                #Add to tmp airport directory
                tmp_airport_ids[icao] = new_id
            else:
                #Airport already exists
                new_id = tmp_airport_ids[icao]
            
            #Now, lets update the ATC dictionary of airports with current row's data    
            tmp_atc = {item: line[value] for item, value in atc_indices.items()}
            tmp_atc["atctype"] = callsign_to_ATC(curr_callsign)

            airports[new_id]["atc"].append(tmp_atc)
            #5 is center which is plotted spearately
            airports[new_id]["atc_pic"] = (''.join(sorted([str(item["atctype"]) for item in airports[new_id]["atc"]]))).replace('5', '')
            
            
            #TO--DO: ALSO RETURN A HISTORY OF THIS CALLSIGN+CID (javascript will use this to plot a path!)!!!
    
    #CTR needs:     ATC_online      marker_latitude marker_longitude    atc_pic     id      polygon
    #"atc": [
    #  {
    #    "atctype": 2, 
    #    "atismsg": "$ rw.liveatc.net/AUS_GND", 
    #    "callsign": "AUS_GND", 
    #    "cid": "1331826", 
    #    "freq": "121.900", 
    #    "name": "Thomas Sotherland", 
    #    "timelogon": "20170607031632", 
    #    "visrange": 20
    #  }
    

  
  #  pilots = []

        #TO--DO: only return releavnt part of map;
        #TO--DO: only return updated data rather than everytthing

#TO--DO: ADD {PILOT DATA HERE!!!}

#    try:
#        if curr_line[3] == "PILOT":
#            pilots.append(curr_line)
    memo = airports
    return jsonify(airports)