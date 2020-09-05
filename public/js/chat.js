const socket = io();

// elements
const $sidebar = document.getElementById("sidebar");
const $messageForm = document.getElementById("chat-message-form");
const $messageInput = $messageForm.querySelector("input");
const $messageSubmitButton = $messageForm.querySelector("button");
const $messageDisplay = document.getElementById("messages");
const $shareLocationButton = document.getElementById("share-location");

// templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    // new message element
    const $newMessage = $messageDisplay.lastElementChild;

    // get Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // get visible height of chat area:
    const visibleHeight = $messageDisplay.offsetHeight;

    // get height of messages container
    const containerHeight = $messageDisplay.scrollHeight;

    // how far have I scrolled:
    const scrollOffset = $messageDisplay.scrollTop + visibleHeight;

    console.log(visibleHeight);
    console.log(containerHeight);
    console.log(scrollOffset);
    console.log("---");

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messageDisplay.scrollTop = $messageDisplay.scrollHeight;
    }
};

socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mma"),
    });
    $messageDisplay.insertAdjacentHTML("afterbegin", html);
    autoscroll();
});

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        locationUrl: message.url,
        createdAt: moment(message.createdAt).format("h:mma"),
    });
    $messageDisplay.insertAdjacentHTML("afterbegin", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener("submit", emitMessageToServer);

function emitMessageToServer(event) {
    event.preventDefault();
    $messageSubmitButton.setAttribute("disabled", "disabled");

    var newMessage = event.target.elements.message.value;
    socket.emit("message", newMessage, (error) => {
        $messageSubmitButton.removeAttribute("disabled");
        $messageInput.value = "";
        $messageInput.focus();
        if (error) {
            alert(error);
        }
    });
}

$shareLocationButton.addEventListener("click", () => {
    event.preventDefault();

    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser :(");
    }

    $shareLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("sendLocation", { latitude, longitude }, () => {
            $shareLocationButton.removeAttribute("disabled");
            const html = Mustache.render(messageTemplate, {
                message: "You shared your location with the group",
                createdAt: moment(new Date().getTime()).format("h:mma"),
            });
            $messageDisplay.insertAdjacentHTML("afterbegin", html);
            autoscroll();
        });
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
