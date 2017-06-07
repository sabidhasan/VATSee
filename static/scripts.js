// Google Map
var map;
var markers = [];

// info window
//var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(document).ready(function() {

    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
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

});


function addMarker(data) {
    var lls = new google.maps.LatLng(parseFloat(data["latitude"]), parseFloat(data["longitude"]));
    
    if (data["atc"].length === 0) {
        //Just draw a dot
        var image = "https://www.dining-out.co.za/ftp/themes/desk/images/reddot.png";
    } else {
        //There is ATC
        
        /*TO--DO: make transparent pngs for each possinbiltiy (0  1  2  3  4  01  02  03  04  12  13  14  23  24  34  012   013   014   023   024   034   123   124   134   234   0123    0124
        0234   1234   01234 */
        var image = "https://www.dining-out.co.za/ftp/themes/desk/images/reddot.png";
    }

    var m = new google.maps.Marker({
        position: lls,
        map: map,
        title: data["name"], //+ " " + data["atc"]["callsign"],
        label: data["name"], //+ " " + data["atc"]["callsign"],
        icon: image
    });

    markers.push(m);

}


function removeMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}











/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {

        // if info window isn't open
        // http://stackoverflow.com/a/12410385
        if (!info.getMap || !info.getMap())
        {
            update();
        }
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });



    google.maps.event.addListener(map, "zoom_changed", function() {
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

       // remove old markers from map
       removeMarkers();

       // add new markers to map
       for (var i = 0; i < data.length; i++)
       {
           addMarker(data[i]);
       }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        // log error to browser's console
        console.log(errorThrown.toString());
    });
};
