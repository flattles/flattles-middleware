let express = require('express');
let { Pool } = require('pg');
let env = require('../env.json');
let WebSocket = require('ws');

// let hostname = 'localhost';
let hostname = '0.0.0.0';
let port = 3000;
let app = express();

app.use(express.json());
app.use(express.static('public'));

let pool = new Pool(env);
pool.connect().then(() => {
  console.log('Connected to database');
});

app.get('/', async (_req, res) => {
  let database = {};
  database['bases'] = (await pool.query('SELECT * FROM bases;')).rows;
  database['mines'] = (await pool.query('SELECT * FROM mines;')).rows;
  database['ships'] = (await pool.query('SELECT * FROM ships;')).rows;
  database['board'] = (await pool.query('SELECT * FROM board ORDER BY position_id ASC;')).rows;

  res.json(database);
});

app.get('/board', (_req, res) => {
  pool.query('SELECT * FROM board ORDER BY position_id ASC;').then((result) => {
    res.json(result.rows);

    // WebSocket communication with Python script
    let ws = new WebSocket('ws://localhost:8765');
    ws.on('open', function open() {
      ws.send('Test message from server.js');
    });
    ws.on('message', function incoming(data) {
      console.log(`Received message: ${data}`);
    });
  });
});

app.post('/move', (req, res) => {
  let body = req.body;

  // Check if the request body has the required properties
  if (
    !body.hasOwnProperty('shipID') ||
    !body.hasOwnProperty('x') ||
    !body.hasOwnProperty('y')
  ) {
    return res.sendStatus(400);
  }

  // Check if the required properties have values contigent to their type
  if (
    body.shipID == '' ||
    body.x == '' ||
    !Number.isInteger(parseInt(body.y))
  ) {
    return res.sendStatus(400);
  }

  // Additional code for handling the move request
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});