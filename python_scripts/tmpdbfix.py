import sqlite3, io

conn = sqlite3.connect('db.db')
c = conn.cursor()

counter = 0
with io.open('tmpdbfix.txt', 'r', encoding='utf-8') as f:
    while True:
        counter += 1
        x = f.readline().strip()
        #input()
        #s = "INSERT INTO airports (name, city, country, iata, icao, latitude, longitude, altitude) VALUES (\"%s\", \"%s\", \"%s\", \"%s\", \"%s\", %s, %s, %s)" % (x[1], x[2], x[3], x[4], x[5], float(x[6]), float(x[7]), int(x[8]))
        #print s
        print(counter)
        c.execute(x)
conn.commit()
