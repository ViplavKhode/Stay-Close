const socket = io();
const map = L.map("map").setView([51.505, -0.09], 16);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'stay-close by Viplav Khode'
}).addTo(map);

let myState = null;
let initialViewSet = false;

let myName = "";

// Initialize UI and wait for user to join
ui.init((name) => {
    myName = name;
    startTracking();
});

function startTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                myState = { latitude, longitude };

                if (!initialViewSet) {
                    map.setView([latitude, longitude], 16);
                    initialViewSet = true;
                }

                socket.emit("send-location", { latitude, longitude, name: myName });
                updateAllDistances();
            },
            (error) => {
                console.error(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

const markers = {};
const userPaths = {};

function getMarkerIcon(color) {
    return L.divIcon({
        className: 'custom-pin',
        html: `<div style="
            background-color: ${color};
            width: 15px;
            height: 15px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [15, 15],
        iconAnchor: [7, 7]
    });
}

function updatePath(id, latitude, longitude, color) {
    if (userPaths[id]) {
        userPaths[id].addLatLng([latitude, longitude]);
    } else {
        userPaths[id] = L.polyline([[latitude, longitude]], {
            color: color || '#3388ff', // Use server color or default blue
            weight: 4,
            opacity: 0.7
        }).addTo(map);
    }
}

function updateAllDistances() {
    if (!myState) return;
    Object.keys(markers).forEach(id => {
        updateMarkerDistance(id);
    });
}

function updateMarkerDistance(id) {
    const marker = markers[id];
    if (!marker || !myState) return;

    if (id === socket.id) {
        if (!marker.getPopup()) marker.bindPopup("You are here");
        else marker.setPopupContent("You are here");
        return;
    }

    const markerLatLng = marker.getLatLng();
    const myLatLng = L.latLng(myState.latitude, myState.longitude);
    const distance = myLatLng.distanceTo(markerLatLng);

    const distStr = distance > 1000
        ? `${(distance / 1000).toFixed(2)} km`
        : `${Math.round(distance)} m`;

    const popupContent = `Distance: ${distStr}`;

    if (marker.getPopup()) {
        marker.setPopupContent(popupContent);
    } else {
        marker.bindPopup(popupContent);
    }
}

socket.on("receive-location", (data) => {
    const { id, latitude, longitude, name, color } = data;

    if (id === socket.id) {
        map.setView([latitude, longitude]);
    }

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
        if (name) markers[id].name = name;
        if (color) markers[id].color = color;
    } else {
        markers[id] = L.marker([latitude, longitude], { icon: getMarkerIcon(color) }).addTo(map);
        markers[id].name = name;
        markers[id].color = color;
    }

    updatePath(id, latitude, longitude, color);
    updateMarkerDistance(id);
    ui.updateUserList(markers, markers, socket.id, myState, myName);
});

socket.on("existing-users", (users) => {
    for (const id in users) {
        const { latitude, longitude, name, color } = users[id];
        if (markers[id]) {
            markers[id].setLatLng([latitude, longitude]);
            if (name) markers[id].name = name;
            if (color) markers[id].color = color;
        } else {
            markers[id] = L.marker([latitude, longitude], { icon: getMarkerIcon(color) }).addTo(map);
            markers[id].name = name;
            markers[id].color = color;
        }
        updatePath(id, latitude, longitude, color);
        updateMarkerDistance(id);
    }
    ui.updateUserList(markers, markers, socket.id, myState, myName);
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    if (userPaths[id]) {
        map.removeLayer(userPaths[id]);
        delete userPaths[id];
    }
    ui.updateUserList(markers, markers, socket.id, myState, myName);
});

