const express = require('express');
const { PORT } = require('./config/index');

//* newer setup
const { createServer } = require('node:http');
const cors = require("cors");
const { join } = require('node:path');
const { Server } = require('socket.io');
const patientRoutes = require('./routes/patientRoutes');
const { stateOPDS } = require('./controllers/patientController');
//* newer setup

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

app.use('/api', patientRoutes);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Emit initial patient data
  stateOPDS({ }, { json: (data) => socket.emit('patient state', data) });

  // Set interval to fetch updated patient state every 5 seconds
  const interval = setInterval(async () => {
    stateOPDS({ }, { json: (data) => socket.emit('patient state', data) });
  }, 100000);

  socket.on('disconnect', () => {
    console.log('User disconnected');
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
