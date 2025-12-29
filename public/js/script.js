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

function getMarkerIcon(id) {
    // Generate a consistent color based on the user ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const color = `hsl(${hue}, 70%, 50%)`;

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
        iconAnchor: [7, 7] // Center the dot
    });
}

function updatePath(id, latitude, longitude) {
    if (userPaths[id]) {
        userPaths[id].addLatLng([latitude, longitude]);
    } else {
        // Generate a color matching the marker
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);

        userPaths[id] = L.polyline([[latitude, longitude]], {
            color: `hsl(${hue}, 70%, 50%)`,
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
    const { id, latitude, longitude, name } = data;

    if (id === socket.id) {
        map.setView([latitude, longitude]);
    }

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
        // Update name if it came in and wasn't there before
        if (name) markers[id].name = name;
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
        markers[id].name = name; // Store name on the marker object itself for easy access
    }

    updatePath(id, latitude, longitude);
    updateMarkerDistance(id);
    ui.updateUserList(markers, markers, socket.id, myState);
});

socket.on("existing-users", (users) => {
    for (const id in users) {
        const { latitude, longitude, name } = users[id];
        if (markers[id]) {
            markers[id].setLatLng([latitude, longitude]);
            if (name) markers[id].name = name;
        } else {
            markers[id] = L.marker([latitude, longitude]).addTo(map);
            markers[id].name = name;
        }
        updatePath(id, latitude, longitude);
        updateMarkerDistance(id);
    }
    ui.updateUserList(markers, markers, socket.id, myState);
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
    ui.updateUserList(markers, markers, socket.id, myState);
});

