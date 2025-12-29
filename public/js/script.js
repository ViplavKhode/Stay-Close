const socket = io();

//from documentation
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.log(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 200000,
            maximumAge: 0
        });
} else {
    console.log("Geolocation is not supported by this browser");
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'stay-close by Viplav Khode'
}).addTo(map);

const markers = {};

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    if (id === socket.id) {
        map.setView([latitude, longitude]);
    }
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

socket.on("existing-users", (users) => {
    for (const id in users) {
        const { latitude, longitude } = users[id];
        if (markers[id]) {
            markers[id].setLatLng([latitude, longitude]);
        } else {
            markers[id] = L.marker([latitude, longitude]).addTo(map);
        }
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

