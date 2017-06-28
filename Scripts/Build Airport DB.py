import sqlite3, io

conn = sqlite3.connect('database.db')
c = conn.cursor()

c.execute('''CREATE TABLE airports
             (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name TEXT, city TEXT, country TEXT, iata TEXT, icao TEXT, latitude NUMERIC, longitude NUMERIC, altitude INTEGER)''')

with io.open('airports.txt', 'r', encoding='utf-8') as f:
    while True:
        try:
            x = f.readline().encode('utf-8').replace('"', '').strip().split(",")
            s = "INSERT INTO airports (name, city, country, iata, icao, latitude, longitude, altitude) VALUES (\"%s\", \"%s\", \"%s\", \"%s\", \"%s\", %s, %s, %s)" % (x[1], x[2], x[3], x[4], x[5], float(x[6]), float(x[7]), int(x[8]))
            print s
            c.execute(s)
        #except ValueError:
        #    raw_input()
        #    c += 1
        except IndexError:
            break
        
conn.commit()
