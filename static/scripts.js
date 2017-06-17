// Holds Google Map
var map;
//Stores all the airports and planes on map currently, as GoogleMap marker objects
var airports = [];
var planes = [];
//Copy of the data fetched from server   //time of last update (stored in latest json)
var latest_json = [];
var update_time = 0;
//Currently clicked on airport's index
var selected_airport = -1;
var selected_plane = -1;
//Global variable for current mouse position; Google map listeners supposedly don't supply event.pageX values?
var mouseX;
var mouseY;
//Array
var airportLines = [];
var flightPath;

// execute when the DOM is fully loaded
$(document).ready(function() {
    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [{visibility: "off"}]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{visibility: "off"}]
        },
        
        {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{color: '#17263c'}]
        },
        {
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [{color: '#fff'}]
        }
    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 0, lng: 0}, // Stanford, California
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 3,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

    //info window close button
    $("#infoclose").on("click", function() {
        hideHoverWindow();
    });
    
    
    //Try hide show
    $(".content-div#home").show();
    $(".content-buttons#home").addClass("active");

    $(".content-buttons").on("click", function() {
       $(".content-buttons").removeClass("active");
       $(this).addClass("active");
       
       $(".content-div").hide();
       $(".content-div#" + this.id).show();
        
    });
});



//Add listener for global mouse position; used to display hover window next to mouse
$(document).on('mousemove', function(event){
    mouseX = event.pageX;
    mouseY = event.pageY;
});

//Called for each airplane. Throws up airplanes on the map
function addPlane(data) {
    //create latitude and longitude
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));

    //var image = "http://wz5.resources.weatherzone.com.au/images/widgets/nav_trend_steady.gif";
    
    var image = "http://abid.a2hosted.com/plane" + Math.round(data["heading"]/10) % 36 + ".gif";
    
    //create the marker, attach to map
    var m = new google.maps.Marker({
        position: lls,
        map: map,
        icon: image
    });
    
    m.addListener('click', function(){
        //if clicked then show info
        hideHoverWindow();
        $("#hoverwindow").css("display", "inline")
        selected_plane = data["id"]
        showSelectedInfo();
    });


    m.addListener('mouseover', function() {
        //only if no airport is clicked upon, then show the hover for this
        if (selected_plane === -1 && selected_airport === -1) {
            $("#hoverinfo").html(prettifyPlaneData(data));
            $("#hoverwindow").css({"display":"inline", "top":0, "left": 0});//mouseY + 5, "left": mouseX + 10})
        }

        //To do get AJAX to get full history
         for (var j = 0; j < latest_json[0].length; j++) {
             if (latest_json[0][j]["id"] === data["depairport_id"]) {
                d_coord = {lat: latest_json[0][j]["latitude"], lng: latest_json[0][j]["longitude"]};
                //alert("Departing "  + latest_json[0][j]["name"] + " icao " +  latest_json[0][j]["icao"])                 
             }
             if (latest_json[0][j]["id"] === data["arrairport_id"]) {
                a_coord = {lat: latest_json[0][j]["latitude"], lng: latest_json[0][j]["longitude"]};
                //alert("arriving "  + latest_json[0][j]["name"] + " icao "  + latest_json[0][j]["icao"])                 
             }
         };
         
         
        var flightPlanCoordinates = [
        // //Find departing latitude!
         d_coord,
         {lat: data["latitude"], lng: data["longitude"]},
         a_coord
        ];
        
        flightPath = new google.maps.Polyline({
          path: flightPlanCoordinates,
          geodesic: true,
          strokeColor: '#FF000',
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: map
        });
        
    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
       // hideHoverWindow();
        flightPath.setMap(null);
        
        if (selected_plane === -1 && selected_airport === -1) {
            hideHoverWindow();
        }


    });
    //add current marker to airports array
    planes.push(m);

}





//called as JSON data is being parsed, to add marker to map
function addAirport(data) {
    //create latitude and longitude
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));
    var image;
    
    //TO--DO: image size should scale based on zoom level; this should go in map event listener also
    if (data["atc"].length === 0) {// && map.getZoom() > 5) {
        //Just draw a dot
        image = "http://conferences.shrm.org/sites/all/themes/sessions/images/dot76923C.png";
        //"https://www.dining-out.co.za/ftp/themes/desk/images/reddot.png";
    } else {//if (map.getZoom() > 5) {
        //There is ATC avialabe, so show the proper icon for it
        
        image = "http://zaritsky.ca/wp-content/uploads/2014/05/dot2-2.png";
        //"https://www.dining-out.co.za/ftp/themes/desk/images/reddot.png";
        //var image = "http://abid.a2hosted.com/" + data["atc_pic"] + ".png";
    }

    //create the marker, attach to map
    var m = new google.maps.Marker({
        position: lls,
        map: map,
        icon: image
    });
    
    //Expected behavior: hover over marker ==> show window. Hover out ==> hide info window. Click on marker ==> show window until clicked elsewhere
    m.addListener('click', function(){
        //if clicked then show info
        hideHoverWindow();
        $("#hoverwindow").css("display", "inline")
        selected_airport = data["id"];
        showSelectedInfo();
    });
    
    m.addListener('mouseover', function() {
        //only if no airport is clicked upon, then show the hover for this
        if (selected_plane === -1 && selected_airport === -1) {
            $("#hoverinfo").html(prettifyAirportData(data));
            $("#hoverwindow").css({"display":"inline", "top":0, "left": 0});//mouseY + 5, "left": mouseX + 10})
        }
        
        //Draw lines
        for (var i = 0, deplen = data["depplanes"].length; i < deplen; i++) {
            //create marker
            for (var j = 0; j < latest_json[2].length; j++) {
                if (latest_json[2][j]["id"] === data["depplanes"][i]) {
                    var coord = {lat: latest_json[2][j]["latitude"], lng: latest_json[2][j]["longitude"]};
                }
            };
           
            var flightPlanCoordinates = [
                {lat: data["latitude"], lng: data["longitude"]},
                coord
            ];

            var flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: '#FF000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: map});
                
                airportLines.push(flightPath);
        }

        for (var i = 0, arrlen = data["arrplanes"].length; i < arrlen; i++) {
            //create marker
            for (var j = 0; j < latest_json[2].length; j++) {
                if (latest_json[2][j]["id"] === data["arrplanes"][i]) {
                    var coord = {lat: latest_json[2][j]["latitude"], lng: latest_json[2][j]["longitude"]};
                }
            }

            var flightPlanCoordinates = [
            {lat: data["latitude"], lng: data["longitude"]},
            coord
            ];

            var flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: map});
            
            airportLines.push(flightPath);
        }

    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
        if (selected_plane === -1 && selected_airport === -1) {
            hideHoverWindow();
        }
        //Hide all airport lines
        for (var i = 0; i < airportLines.length; i++) {
            airportLines[i].setMap(null);
        }
        airportLines = [];
    });
    
    //add current marker to airports array
    airports.push(m);
}





function prettifyPlaneData(data) {
    //Returns displayable HTML for info window
    var r = "<span id='infoWindowTitle'>" + data["callsign"] +"</span></br>";// + "dep id " + data["depairport_id"] + " from json " + latest_json[0][data["depairport_id"]]["icao"]
    //"dep id " + data["depairport_id"] + ;
    r += "<span>(Airline: " + data["airline_name"] + ")</span></br></br>";
    
    r += "<table><tr><td><span>Departure</span></td>" + "<td>" + data["depairport"] + " ft</td></tr>";
    alt = data["altairport"] ? data["altairport"] : "None"
    r += "<tr><td><span>Arrival (Alternate)</span></td>" + "<td>" + data["arrairport"] + " (" + alt + ")</td></tr>";
    r += "<tr><td><span>Aircraft</span></td>" + "<td>" + data["aircraft"] + "</td></tr>";
    r += "<tr><td><span>Heading</span></td>" + "<td>" + data["heading"] + "</td></tr>";
    r += "<tr><td><span>Speed (Planned)</span></td>" + "<td>" + data["speed"] + " kts)" + data["tascruise"] + " kts</td></tr>";
    
    r += "<tr><td><span>Altitude (Planned)</span></td>" + "<td>" + data["altitude"] + "ft (" + data["plannedaltitude"] + " ft) </td></tr>";
    r += "<tr><td><span>Departure Time</span></td>" + "<td>" + data["deptime"] + "</td></tr>";
    r += "<tr><td><span>Flight Type</span></td>" + "<td>" + data["flighttype"] + "</td></tr>";
    r += "<tr><td><span>Route</span></td>" + "<td>" + data["route"] + "</td></tr>";

    r += "</table>";
    return r;
}




//Function for formatting data for hover window for airports
function prettifyAirportData(data) {
    //Returns displayable HTML for info window
    var r = "<span id='infoWindowTitle'>" + data["name"] +"</span></br>";
    r += "<span>(" + data["icao"] + ")</span></br></br>";
    
    r += "<table><tr><td><span>Altitude</span></td>" + "<td>" + data["altitude"] + " ft</td></tr>";
    r += "<tr><td><span>Arrivals</span></td>" + "<td>" + data["arrplanes"].length + "</td></tr>";
    r += "<tr><td><span>Departures</span></td>" + "<td>" + data["depplanes"].length + "</td></tr>";
    
    //r += "<span>Arrivals</span> " + data["arrplanes"].length + "</br>";
    //r += "<span>Departures</span> " + data["depplanes"].length + "</br>";
    
    r += "<tr><td><span id='infowindowatc'>ATC</span></td></tr>";
    if (data["atc"].length === 0) {
        r += "<tr><td>No ATC currently online</td></tr>";
    } else {
        for (var i = 0, atclen = data["atc"].length; i < atclen; i++) {
            r += "<tr><td><span>" + data["atc"][i]["callsign"] + "</span></td>" + "<td>" + data["atc"][i]["freq"] + "</td></tr>";
        //    r += "<span> " + data["atc"][i]["callsign"] + "</span> " + data["atc"][i]["freq"]  + "</br>";
        }
    }
    r += "</table>";
    return r;
}

function showSelectedInfo() {
    ///This function writes the currently selected airplane or airport's iforation to the main tab!
    //if an airport is selected, then ship its data out
    if (selected_airport !== -1) {
        //show the div containing data
        $("#selectedairport").css("display", "block");
        //Make loiading gif visible
        $("#loadinggif").show();
        
        //Loop through local JSON cache
        for (var j = 0, l = latest_json[0].length; j < l; j++) {
            if (latest_json[0][j]["id"] === selected_airport) {
                //Ping server for more details
                $.getJSON(Flask.url_for("history"), {data: latest_json[0][j], type: 'ATC'})
                .done(function(data, textStatus, jqXHR) {
            
                    //if no arrivals
                    if (data[0].length === 0) {
                        $('#selectedarrivals tbody').html("<tr><td colspan = '8'>No scheduled arrivals</td></tr>");
                    } else {
                        $('#selectedarrivals tbody').html("");
                    }

                    //Parse through arrivals
                    for (var k = 0; k < data[0].length; k++) {

                        //This is the HTML that will be injected
                        var tmp = "";
                        //Set callsign (VFR flights have same name and fluightnum, so correctr for that)
                        var callsign = "";
                        if (data[0][k]['airline_name'] === data[0][k]['airline_flightnum']) {
                            callsign = data[0][k]['airline_flightnum'];
                        } else {
                            callsign = data[0][k]['airline_name'] + " " + data[0][k]['airline_flightnum'];
                        }
                        
                        //Correct for distance = 0
                        var distance = 0;
                        if (data[0][k]['distance_from_airport'] === 0) {
                            distance = "-";
                        } else {
                            distance = data[0][k]['distance_from_airport'];
                        }
                        tmp += "<td>" + callsign + " </td>";
                        tmp += "<td>" + data[0][k]['planned_depairport'] + "</td>";
                        tmp += "<td>" + distance + "</td>";
                        tmp += "<td>" + data[0][k]['altitude'] + " </td>";
                        tmp += "<td>" + data[0][k]['groundspeed'] + " </td>";
                        tmp += "<td>" + data[0][k]['heading'] + " </td>";
                        tmp += "<td>" + data[0][k]['planned_aircraft'] + " </td>";
                        tmp += "<td>" + data[0][k]['status'] + " </td>";
                        
                        $('#selectedarrivals tbody').append("<tr>" + tmp + "</tr>");
                    }

                    //if no arrivals
                    if (data[1].length === 0) {
                        $('#selecteddepartures tbody').html("<tr><td colspan = '9'>No scheduled departures</td></tr>");
                    } else {
                        $('#selecteddepartures tbody').html("");
                    }

                    //Parse through departures
                    for (var k = 0; k < data[1].length; k++) {
                        //This is the HTML that will be injected
                        tmp = "";
                        //Set callsign (VFR flights have same name and fluightnum, so correctr for that)
                        callsign = "";
                        if (data[1][k]['airline_name'] === data[1][k]['airline_flightnum']) {
                            callsign = data[1][k]['airline_flightnum'];
                        } else {
                            callsign = data[1][k]['airline_name'] + " " + data[1][k]['airline_flightnum'];
                        }
                        
                        //Correct for distance = 0 (show '-' instead of 0)
                        distance = 0;
                        if (data[1][k]['distance_from_airport'] === 0) {
                            distance = "-";
                        } else {
                            distance = data[1][k]['distance_from_airport'];
                        }
                        
                        
                        tmp += "<td>" + callsign + " </td>";
                        tmp += "<td>" + data[1][k]['planned_deptime'] + " </td>";
                        tmp += "<td>" + data[1][k]['planned_destairport'] + " </td>";
                        tmp += "<td>" + distance + "</td>";
                        tmp += "<td>" + data[1][k]['altitude'] + "</td>";
                        tmp += "<td>" + data[1][k]['groundspeed'] + " </td>";
                        tmp += "<td>" + data[1][k]['heading'] + " </td>";
                        tmp += "<td>" + data[1][k]['planned_aircraft'] + " </td>";
                        tmp += "<td>" + data[1][k]['status'] + " </td>";
                        
                        $('#selecteddepartures tbody').append("<tr>" + tmp + "</tr>");
                    }

                    //hide the loading gif!
                    $("#loadinggif").hide();
                    
                })
            }
        }
    } else if (selected_plane !== -1){
        for (var j = 0, l = latest_json[0].length; j < l; j++) {
            if (latest_json[0][j]["id"] === selected_airport) {
                
            }
        }        
        
    }
    
    
    



                
       /*           "aircraft": "C310", 
      "airline_callsign": "ZPELK", 
      "airline_country": "ZPELK", 
      "airline_flightnum": "ZPELK", 
      "airline_name": "ZPELK", 
      "airline_short": "ZPELK", 
      "altairport": "SGME", 
      "altitude": 6023, 
      "arrairport": "SGAS", 
      "arrairport_id": 198, 
      "callsign": "ZPELK", 
      "cid": "1379430", 
      "depairport": "SGES", 
      "depairport_id": 197, 
      "deptime": "300", 
      "flighttype": "I", 
      "heading": 278, 
      "id": 223, 
      "latitude": -25.32299, 
      "longitude": -56.88972, 
      "plannedaltitude": 6000, 
      "real_name": "Diego Schlenker SGAS", 
      "remarks": "OPR/AEROCENTRO S.A /v/ SEL/SGES", 
      "route": "COSTA  A311 EKILO", 
      "speed": 204, 
      "tascruise": "180", 
      "timelogon": "20170614025100"*/
    //}
    
    
    
    
               // data = (latest_json[0][j]["icao"]) + (latest_json[0][j]["name"]);
            //}
        //};
   // } else {
        //plane json is 1
        //t = selected_plane;
    //    0;
//    }
  //  $("#selectedpointinfodata").html(data);
    
}

function getCountry(lat, lng) {
    var latlng;
    latlng = new google.maps.LatLng(lat, lng);

    new google.maps.Geocoder().geocode({'latLng' : latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                var add = results[0].formatted_address;
                var value = add.split(",");
                var count = value.length; 
                country = value[count-1]; 
                return country;
            } else { 
                return "International"; 
            } 
        } else {
            return "Unknown" ;
        }      
    });
};




function removeMarkers() {
    for (var i = 0, aplen = airports.length; i < aplen; i++) {
        airports[i].setMap(null);
    }
    airports = [];
    
    for (var i = 0, plen = planes.length; i < plen; i++) {
        planes[i].setMap(null);
    }
    planes = [];

    //Hide all airport lines
    for (var i = 0; i < airportLines.length; i++) {
        airportLines[i].setMap(null);
    }
    airportLines = [];
    
}





function hideHoverWindow(){
    $("#hoverwindow").css("display", "none");
    if (selected_airport !== -1 || selected_plane !== -1) {
        //something is selected already, so let's reset the information pane
        $("#selectedairport").css("display", "none");
    }
    selected_airport = -1;
    selected_plane = -1;
}



/*
 * Configures application.
 */
function configure()
{
    //Hide hover window if we click on the map (not a marker)
    google.maps.event.addListener(map, "click", function() {
        hideHoverWindow();
    });
    
    //Hide hvoer window if starting drag
    google.maps.event.addListener(map, "dragstart", function() {
        hideHoverWindow();
    });
    
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        hideHoverWindow();
        update();
    });

    // update UI
    update();
}


/**
 * Updates UI's markers.
 */
function update() 
{
    // get places (asynchronously)
    $.getJSON(Flask.url_for("update"))//, parameters)
    .done(function(data, textStatus, jqXHR) {
       //check to see if update needed
       if (data[3][0]["time_updated"] - update_time === 0) {
            //No change
            console.log("No change detected!")
            return null;
       }

       // remove old markers from map
       removeMarkers();

       // update the airports
       for (var i = 0, mlen = data[0].length; i < mlen; i++)
       {
           addAirport(data[0][i]);
       }
       
       //Update the planes!
       for (var i = 0, plen = data[2].length; i < plen; i++)
       {
           console.log(plen)
           addPlane(data[2][i]);
       }

       latest_json = data;
       console.log("Redrew map at " + data[3][0]["time_updated"])
       update_time = data[3][0]["time_updated"]
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        // log error to browser's console
        console.log(errorThrown.toString());
    })

};