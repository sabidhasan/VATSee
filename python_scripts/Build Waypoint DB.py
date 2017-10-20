import sqlite3

conn = sqlite3.connect('database.db')
c = conn.cursor()

#INSERT INTO "Waypoints" ("Index","Name","Latitude","Longitude") VALUES (NULL,'0003S','0','3000000');
c.execute("""CREATE TABLE 'waypoints' ('Index' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 'Name' TEXT, 'Latitude' TEXT, 'Longitude' TEXT)""")

with open('sql.sql') as f:
    for line in f.readlines():
        print line
        tmp = line.replace('"', '').split(";")
        c.execute("""INSERT INTO "waypoints" ("Index","Name","Latitude","Longitude") VALUES (NULL,'%s','%s','%s')""" % (tmp[1], tmp[2], tmp[3]))
conn.commit()
