const users = [];

const addUser = ({ id, username, room }) => {
    // clean the data
    if (username) {
        username = username.trim().toLowerCase();
    }
    if (room) {
        room = room.trim().toLowerCase();
    }

    // validate the data
    if (!username || !room) {
        return {
            error: "Username and room are required.",
        };
    }

    // Check for existing (conflicting) user
    const existingUser = users.find((u) => {
        return u.username === username && u.room === room;
    });

    if (existingUser) {
        return { error: "That username is already in use in this room." };
    }

    // Store user
    const user = { id, username, room };
    users.push(user);
    return { user };
};

const removeUser = (id) => {
    const index = users.findIndex((u) => u.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }

    return { error: "No user found with that id." };
};

const getUser = (id) => {
    return users.find((u) => u.id === id);
};

const getUsersInRoom = (room) => {
    if (room) {
        room = room.trim().toLowerCase();
        return users.filter((u) => u.room === room);
    }
};

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
};
