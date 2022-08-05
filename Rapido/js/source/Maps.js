// Multiple Markers
var markersArray = new Array();

var Maps = function () { }

Maps.prototype.Init = function (options) {
    if (typeof options === 'undefined') {
        console.log('Maps init have no data');
        return;
    }

    if (document.getElementById(options.containerId) && !document.getElementById(options.containerId).hasAttribute('data-initialized')) {
        if (options.locationsList) {
            if (options.locationsList.length > 0) {
                var map;
                var bounds = new google.maps.LatLngBounds();
                var mapOptions = {
                    mapTypeId: 'roadmap'
                };

                // Display a map on the page
                map = new google.maps.Map(document.getElementById(options.containerId), mapOptions);
                map.setTilt(45);

                var markers = new Array();
                var infoWindowContent = [];

                for (var i = 0; i < options.locationsList.length; i++) {
                    var location = options.locationsList[i];
                    var latitude = location.latitude && location.latitude != "0" ? location.latitude.replace(",", ".") : "";
                    var longitude = location.longitude && location.longitude != "0" ? location.longitude.replace(",", ".") : "";
                    var locationArray = [location.company, latitude, longitude];
                    var locationInfo = document.createElement("div");

                    locationInfo.className = "map-container__canvas__location-info";
                    
                    if (location.company) {
                        var h5 = document.createElement("h5");
                        h5.className = "u-no-margin";
                        h5.innerText = location.company;
                        locationInfo.appendChild(h5);
                    }

                    if (location.address) {
                        var address = document.createElement("div");
                        address.innerText = location.address;
                        locationInfo.appendChild(address);

                        if (location.zip || location.city) {
                            var zipCity = document.createElement("div");
                            if (location.zip) {
                                zipCity.innerText = location.zip
                            }
                            if (location.zip && location.city) {
                                zipCity.innerText += " ";
                            }
                            if (location.city) {
                                zipCity.innerText += location.city
                            }
                            locationInfo.appendChild(zipCity);
                        }

                        if (location.country) {
                            var country = document.createElement("div");
                            country.innerText = location.country;
                            locationInfo.appendChild(country);
                        }
                    } 
                    
                    if (location.description) {
                        var description = document.createElement("div");
                        description.innerText = location.description;
                        locationInfo.appendChild(description);
                    }

                    if (options.selectionCallback) {
                        var selectButton = document.createElement("button");
                        selectButton.setAttribute("type", "button");
                        selectButton.className = "btn btn--primary dw-mod u-full-width u-no-margin u-margin-top";
                        selectButton.setAttribute("onclick", options.selectionCallback + "('" + location.number + "'," + JSON.stringify({
                            Name: location.company ? location.company : "",
                            Company: location.company ? location.company : "",
                            Address: location.address ? location.address : "",
                            Zip: location.zip ? location.zip : "",
                            City: location.city ? location.city : "",
                            Country: location.countryCode ? location.countryCode : ""
                        }) + ")");
                        selectButton.innerText = options.buttonText;
                        locationInfo.appendChild(selectButton);
                    }

                    markers.push(locationArray);
                    infoWindowContent.push([locationInfo.innerHTML]);
                }

                // Display multiple markers on a map
                var infoWindow = new google.maps.InfoWindow(), marker, i;

                //Make it possible to use the geocoder to look up addresses
                var geocoder = new google.maps.Geocoder();

                // Loop through our array of markers & place each one on the map
                for (var i = 0; i < markers.length; i++) {
                    var rawMarkerInfo = markers[i];
                    var latitude = rawMarkerInfo[1];
                    var longitude = rawMarkerInfo[2];
                    var currentIndex = i;
                    var position;

                    if (latitude == "") {
                        var address = options.locationsList[currentIndex].address + ", " + options.locationsList[currentIndex].city + ", " + options.locationsList[currentIndex].country;
                        var title = rawMarkerInfo[0];

                        geocoder.geocode({ 'address': address }, function (results, status) {
                            if (status == 'OK') {
                                position = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());

                                marker = new google.maps.Marker({
                                    position: position,
                                    map: map,
                                    title: title
                                });

                                // Allow each marker to have an info window
                                google.maps.event.addListener(marker, 'click', (function (marker, idx) {
                                    var j = idx;
                                    return function () {
                                        infoWindow.setContent(infoWindowContent[j][0]);
                                        infoWindow.open(map, marker);

                                        if (options.markerCallback) {
                                            options.markerCallback(options.locationsList[j]);
                                        }

                                        var event = new CustomEvent('mapMarkerOnClick', { 'detail': { 'data': options.locationsList[j] } });
                                        document.dispatchEvent(event);
                                    }
                                })(marker, currentIndex));

                                markersArray.push(marker);
                                bounds.extend(position);

                                setTimeout(function(){
                                    map.fitBounds(bounds);
                                }, 50);
                                
                            } else {
                                console.log('Geocode was not successful for the following reason: ' + status);
                            }
                        });
                    } else {
                        position = new google.maps.LatLng(latitude, longitude);

                        marker = new google.maps.Marker({
                            position: position,
                            map: map,
                            title: title
                        });

                        // Allow each marker to have an info window
                        google.maps.event.addListener(marker, 'click', (function (marker, idx) {
                            var j = idx;
                            return function () {
                                infoWindow.setContent(infoWindowContent[j][0]);
                                infoWindow.open(map, marker);

                                if (options.markerCallback) {
                                    options.markerCallback(options.locationsList[j]);
                                }

                                var event = new CustomEvent('mapMarkerOnClick', { 'detail': { 'data': options.locationsList[j] } });
                                document.dispatchEvent(event);
                            }
                        })(marker, currentIndex));

                        markersArray.push(marker);
                        bounds.extend(position);

                        setTimeout(function(){
                            map.fitBounds(bounds);
                        }, 50);
                    }
                }

                // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
                var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function (event) {
                    if (markers.length == 1) {
                        map.setZoom(10);
                    }

                    google.maps.event.removeListener(boundsListener);
                });

                document.getElementById(options.containerId).setAttribute("data-initialized", "True");
            }
        }
    }
}


Maps.prototype.OpenInfo = function (markerId) {
    google.maps.event.trigger(markersArray[markerId], 'click');

    var event = new CustomEvent('mapOpenInfo', { 'detail': { 'markerId': markerId } });
    document.dispatchEvent(event);
}

var Maps = new Maps();
