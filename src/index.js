const app = require("./app");
const Filter = require("bad-words");
const http = require("http");
const socketio = require("socket.io");

const {
    generateMessage,
    generateLocationMessage,
} = require("./utils/messages");
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require("./utils/users");
const port = process.env.PORT;

const server = http.createServer(app);
const io = socketio(server);

app.get("/", (req, res) => {
    res.sendFile("index.html");
});

io.on("connection", (socket) => {
    console.log("new websocket connection");

    // opertions for user joining/creating a chat room:
    socket.on("join", ({ username, room }, cb) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return cb(error);
        }

        socket.join(user.room);

        socket.emit(
            "message",
            generateMessage(
                "chatter",
                `Welcome ${user.username}. You are connected to the ${user.room} room...`
            )
        );

        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage("chatter", `${user.username} has joined...`)
            );

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        cb();
    });

    // general message relay
    socket.on("message", (message, cb) => {
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return cb("Sorry, no profanity allowed on chatter.");
        }

        const user = getUser(socket.id);
        io.to(user.room).emit(
            "message",
            generateMessage(user.username, message)
        );
        cb();
    });

    // shared location message relay
    socket.on("sendLocation", ({ latitude, longitude }, cb) => {
        const user = getUser(socket.id);
        socket.broadcast
            .to(user.room)
            .emit(
                "locationMessage",
                generateLocationMessage(
                    user.username,
                    `https://google.com/maps?q=${latitude},${longitude}`
                )
            );
        cb();
    });

    // disconnect message relay
    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage(
                    "chatter",
                    `${user.username} has left the room...`
                )
            );

            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

server.listen(port, () => {
    console.log("chatter backend is listening on port " + port);
});

// scrap code: simple example to get started with socket.io

// let count = 0;

// io.on("connection", (socket) => {
//     console.log("New websocket connection...");
//     socket.emit("countUpdated", count);
//     socket.on("increment", () => {
//         count++;
//         io.emit("countUpdated", count);
//     });
// });
