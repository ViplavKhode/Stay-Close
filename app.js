const express = require("express");
const app = express();


const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const users = {};

function getRandomColor() {
    // Generate a random bright color (HSL)
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
}

io.on("connection", (socket) => {
    // Send all current users to the new client
    socket.emit("existing-users", users);
    console.log("User connected:", socket.id);

    socket.on("send-location", (data) => {
        const { latitude, longitude, name } = data;

        // Check if user exists in our "database"
        if (users[socket.id]) {
            // Update location
            users[socket.id].latitude = latitude;
            users[socket.id].longitude = longitude;
            // Update name only if a new non-empty name is provided, otherwise keep existing
            if (name) users[socket.id].name = name;
        } else {
            // Create new user entry
            users[socket.id] = {
                id: socket.id,
                latitude,
                longitude,
                name: name || "Unknown User",
                color: getRandomColor() // Assign a permanent color
            };
        }

        // Broadcast the full user object (with color/name) to everyone
        io.emit("receive-location", users[socket.id]);
    });

    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log("User disconnected:", users[socket.id].name);
            delete users[socket.id];
            io.emit("user-disconnected", socket.id);
        }
    });
});

app.get("/", (req, res) => {
    res.render("index");
})

server.listen(3000)