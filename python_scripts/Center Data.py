testcsv = open('test.csv', 'w')

import xml.etree.ElementTree as ET
tree = ET.parse('VATSeesimp.kml')
root = tree.getroot()

for count, child in enumerate(root):
    latest_name = ""
    
    for subchild in child:
        #print subchild.tag
        if subchild.tag == "name":
            latest_name = subchild.text
            testcsv.write('"' + str(count) + '",' + '"' + subchild.text + '","')
            #print subchild.text
        elif len(subchild) != 0:
            #Found the Polygon
            for line in subchild[0][0].find('coordinates').text.split('\n'):
                line = line[:-2].lstrip().rstrip()
                if not(line): continue  
                testcsv.write(line + "\n")
            testcsv.write('"' + ";\n")
                # 
testcsv.close()