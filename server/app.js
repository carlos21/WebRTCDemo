import * as http from 'http';

const http = require('http');
const io = require('socket.io')();
const socketAuth = require('socketio-auth');
const adapter = require('socket.io-redis');
const redis = require('./redis');

const PORT = process.env.PORT || 9000;
const server = http.createServer();

const redisAdapter = adapter({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASS || 'carlos'
})

io.attach(server);
io.adapter(redisAdapter);

const roomKey = "123456";

async function verifyUser(name) {
  return new Promise((resolve, reject) => {
    // setTimeout to mock a cache or database call
    setTimeout(() => {
      // this information should come from your cache or database
      const users = [
        {
          id: 1,
          name: 'Sebastian'
        },
        {
          id: 2,
          name: 'Carlos'
        }
      ];

      const user = users.find((user) => user.name === name);

      if (!user) {
        return reject('USER_NOT_FOUND');
      }

      return resolve(user);
    }, 200);
  });
}

const authenticate = async (socket, data, callback) => {
  const { name } = data;

  try {
    const user = await verifyUser(name);
    const canConnect = await redis.setAsync(`users:${user.id}`, socket.id, 'NX', 'EX', 30);

    // if (!canConnect) {
    //   return callback({ message: 'ALREADY_LOGGED_IN' });
    // }

    socket.user = user;

    return callback(null, true);
  } catch (e) {
    console.log(`Socket ${socket.id} unauthorized`);
    console.log(e);
    return callback({ message: 'UNAUTHORIZED' });
  }
}

const postAuthenticate = (socket) => {
  console.log(`Socket ${socket.id} authenticated`);
  socket.emit('authorized');

  console.log('Joined to room', roomKey);
  let myRoom = io.sockets.adapter.rooms[roomKey] || { length: 0 };
  const numClients = myRoom.length;
  console.log(roomKey, 'has', numClients, 'clients');

  myRoom = io.sockets.adapter.rooms[roomKey] || { length: 0 };
  console.log(roomKey, 'now has', myRoom.length, 'clients');

  if (numClients <= 1) {
    socket.join(roomKey, () => {
      socket.emit('joined', roomKey);
    });
    
  } else {
    socket.emit('full', roomKey);
  }

  socket.conn.on('packet', async (packet) => {
    if (socket.auth && packet.type === 'ping') {
      await redis.setAsync(`users:${socket.user.id}`, socket.id, 'XX', 'EX', 30);
    }
  });

  socket.on('ready', room => {
    console.log(`Broadcasting room ${room}`);
    // io.in(room).emit('ready');
    socket.broadcast.to(room).emit('ready');
  });

  socket.on('candidate', event => {
    socket.broadcast.to(event.room).emit('candidate', event);
  });

  socket.on('offer', event => {
    socket.broadcast.to(event.room).emit('offer', event.sdp);
  });

  socket.on('answer', event => {
    socket.broadcast.to(event.room).emit('answer', event.sdp);
  });
}

const disconnect = (socket) => {
  console.log(`Socket ${socket.id} disconnected.`)

  if (socket.user) {
    redis.delAsync(`users:${socket.user.id}`);
  }
}

socketAuth(io, {
  authenticate: authenticate,
  postAuthenticate: postAuthenticate,
  disconnect: disconnect
});

server.listen(PORT);