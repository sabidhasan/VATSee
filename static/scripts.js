// Holds Google Map
var map;
//Stores all the airports on map currently, as GoogleMap marker objects
var airports = [];
//Copy of the data fetched from server   //time of last update (stored in latest json)
var latest_json = [];
var update_time = 0;
//Currently clicked on airport's index
var selected_airport = -1;
//Global variable for current mouse position; Google map listeners supposedly don't supply event.pageX values?
var mouseX;
var mouseY;

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
//    


});

//Add listener for global mouse position; used to display hover window next to mouse
$(document).on('mousemove', function(event){
    mouseX = event.pageX;
    mouseY = event.pageY;
});

//Called for each airplane. Throws up airplanes on the map
function addPlane(data) {
    return
    
}




//called as JSON data is being parsed, to add marker to map
function addAirport(data) {
    //create latitude and longitude
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));
    
    //TO--DO: image size should scale based on zoom level; this should go in map event listener also
    if (data["atc"].length === 0) {// && map.getZoom() > 5) {
        //Just draw a dot
        var image = "http://conferences.shrm.org/sites/all/themes/sessions/images/dot76923C.png";
        //"https://www.dining-out.co.za/ftp/themes/desk/images/reddot.png";
    } else {//if (map.getZoom() > 5) {
        //There is ATC avialabe, so show the proper icon for it
        
        var image = "http://zaritsky.ca/wp-content/uploads/2014/05/dot2-2.png";
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
        $("#hoverwindow").css("display", "inline")
        selected_airport = data["id"]
    });
    
    m.addListener('mouseover', function() {
        //only if no airport is clicked upon, then show the hover for this
        if (selected_airport === -1) {
            $("#hoverinfo").html(prettifyData(data));
            $("#hoverwindow").css({"display":"inline", "top":mouseY + 5, "left": mouseX + 10})
        }
    });

    m.addListener('mouseout', function() {
        //if nothing has been clicked on, then hide the info window (ALSO SEE CONFIGURE FUNCTION FOR CLICK EVENT LISTERNERS!)
        if (selected_airport === -1) {
            hideHoverWindow();
        }
    });
    //add current marker to airports array
    airports.push(m);
}

//Function for formatting data
function prettifyData(data) {
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
}





function hideHoverWindow(){
    $("#hoverwindow").css("display", "none");
    selected_airport = -1;

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
       for (var i = 0, mlen = data[0].length; i < mlen; i++)
       {
           addAirport(data[0][i]);
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