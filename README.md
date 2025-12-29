# Stay Close

A real-time location tracking application built with Node.js, Express, Socket.io, and Leaflet. Stay Close allows users to share their geolocation in real-time on an interactive map.

## Features

- **Real-Time Location Sharing**: Automatically shares your live location (latitude and longitude) with the server using web sockets.
- **Interactive Map**: visualizes connected users on an OpenStreetMap interface via Leaflet.js.
- **Dynamic Updates**: Markers update instantly as users move.
- **Auto-Cleanup**: Removes markers when a user disconnects.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Real-Time Communication**: Socket.io
- **Frontend**: EJS (Templating), CSS, Vanilla JavaScript
- **Maps API**: Leaflet.js, OpenStreetMap

## Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js**: Installed on your local machine.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ViplavKhode/stay-close.git
    cd stay-close
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Usage

1.  **Start the server:**
    ```bash
    npx nodemon app.js
    ```
    *Or if you don't have nodemon installed globally:*
    ```bash
    node app.js
    ```

2.  **Open the application:**
    Visit `http://localhost:3000` in your web browser.

3.  **Grant Permisssions:**
    Allow the browser to access your location when prompted.

## Project Structure

```
stay-close/
├── public/
│   ├── css/
│   │   └── style.css      # Application styles
│   └── js/
│       └── script.js      # Client-side Socket.io & Leaflet logic
├── views/
│   └── index.ejs          # Main frontend template
├── app.js                 # Server entry point
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation
```

## Author

Viplav Khode
