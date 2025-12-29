class UI {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.loginInput = document.getElementById('username-input');
        this.loginBtn = document.getElementById('join-btn');
        this.userList = document.getElementById('user-list');
        this.userCount = document.getElementById('user-count');
    }

    init(onJoinCallback) {
        // Handle Join Button Click
        this.loginBtn.addEventListener('click', () => {
            const name = this.loginInput.value.trim();
            if (name) {
                this.overlay.style.display = 'none';
                onJoinCallback(name);
            }
        });

        // Handle Enter Key
        this.loginInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const name = this.loginInput.value.trim();
                if (name) {
                    this.overlay.style.display = 'none';
                    onJoinCallback(name);
                }
            }
        });

        // Focus input on load
        this.loginInput.focus();

        // Initialize Dragging
        this.setupDrag();
    }

    setupDrag() {
        const panel = document.getElementById('user-panel');
        const header = panel.querySelector('.panel-header');

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);

        // Touch support
        header.addEventListener("touchstart", dragStart, { passive: false });
        document.addEventListener("touchend", dragEnd);
        document.addEventListener("touchmove", drag, { passive: false });

        function dragStart(e) {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            // Only allow dragging if clicking the header specifically
            if (e.target.closest('.panel-header')) {
                isDragging = true;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, panel);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }

    updateUserList(users, markers, currentId, myState, myName) {
        this.userList.innerHTML = '';
        const userIds = Object.keys(users);
        this.userCount.textContent = userIds.length;

        userIds.forEach(id => {
            const user = users[id];
            const isMe = id === currentId;

            // Calculate distance for display in panel
            let distanceStr = '';
            if (!isMe && myState) {
                const myLatLng = L.latLng(myState.latitude, myState.longitude);
                const userLatLng = L.latLng(user.latitude, user.longitude);
                const dist = myLatLng.distanceTo(userLatLng);
                distanceStr = dist > 1000
                    ? `${(dist / 1000).toFixed(2)} km`
                    : `${Math.round(dist)} m`;
            } else if (isMe) {
                distanceStr = '(You)';
            }

            // Create List Item
            const li = document.createElement('li');
            li.className = 'user-item';

            // User Dot Color (match the polyline logic if we still had it, currently Blue default)
            // If we re-enable colors later, we'd calculate hue here
            const dotColor = isMe ? '#2196F3' : '#3388ff';

            li.innerHTML = `
                <div class="user-dot" style="background-color: ${dotColor}"></div>
                <div class="user-info">
                    <span class="user-name">${isMe ? (myName || 'You') : (user.name || 'Unknown User')}</span>
                    <span class="user-distance">${distanceStr}</span>
                </div>
            `;

            // Click to fly to user
            li.addEventListener('click', () => {
                const marker = markers[id];
                if (marker) {
                    map.flyTo(marker.getLatLng(), 16, {
                        animate: true,
                        duration: 1.5
                    });
                    marker.openPopup();
                }
            });

            this.userList.appendChild(li);
        });
    }
}

const ui = new UI();
