import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';

import formatMessage from './utils/messages.js';
import { userJoin, getCurrentUser, userLeave, getRoomUsers } from './utils/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        
        socket.join(user.room)

        socket.emit('message', formatMessage('Chat bot', 'Welcome to Chat Project!'));

        socket.broadcast.to(user.room).emit('message', formatMessage('Chat bot', `${user.username} has joined the chat!`));
        
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    
    });

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', 
            formatMessage('Chat bot', `${user.username} has left the chat!`));
            
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
