#The goal of this script is to update local DB periodically (every minute)
#Import scheduler
from apscheduler.schedulers.blocking import BlockingScheduler
import sqlite3, time, requests
from datetime import datetime
from shutil import copyfile

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


def update_db():    
    print("Updating database at ", datetime.now())

    #Check for latest file from database
    conn = sqlite3.connect('database_working.db')
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
    #Copy current DB into working
    copyfile('database_working.db', 'database.db')


if __name__ == '__main__':
    scheduler = BlockingScheduler()
    scheduler.add_executor('processpool')
    scheduler.add_job(update_db, 'interval', seconds=45)

    update_db()

    try:
        scheduler.start()
        print('hi')
    except (KeyboardInterrupt, SystemExit):
        pass
