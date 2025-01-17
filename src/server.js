let express = require('express');
let { Pool } = require('pg');
let WebSocket = require('ws');
const cors = require('cors');
let env = require('../env.json');

let hostname = '0.0.0.0';
let port = 3000;
let app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(
  cors({
    origin: 'http://localhost:5173', // Allow only this origin
  })
);
// or, to allow all origins (less secure, use with caution):
// app.use(cors());

let pool = new Pool(env);
pool.connect().then(() => {
  console.log('Connected to database');
});

const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log(data);
    console.log(`Received: ${data.payload} 
    from client ${data.clientId}`);
    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Client ${data.clientId} 
        sent -> ${data.payload}`);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/', async (_req, res) => {
  let database = {};
  database['bases'] = (await pool.query('SELECT * FROM bases;')).rows;
  database['mines'] = (await pool.query('SELECT * FROM mines;')).rows;
  database['ships'] = (await pool.query('SELECT * FROM ships;')).rows;
  database['board'] = (
    await pool.query('SELECT * FROM board ORDER BY position_id ASC;')
  ).rows;

  res.json(database);
});

app.get('/board', (_req, res) => {
  pool
    .query('SELECT * FROM board ORDER BY position_id ASC;')
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
});

function broadcastBoardState(updatedBoardState) {
  const data = JSON.stringify({
    type: 'UPDATE_BOARD',
    boardState: updatedBoardState,
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

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

  // Check if the required x and y properties are within the board's parameters
  if (
    body.x < 'A' ||
    body.x > 'E' ||
    parseInt(body.y) < 0 ||
    parseInt(body.y) > 5
  ) {
    return res.sendStatus(400);
  }

  const shipID = body.shipID;
  const newX = body.x;
  const newY = parseInt(body.y);

  // Get the current position of the ship
  // Then take those coordinates and set the reset the position to be empty (no ship entity)
  // Finally set the new position at the new coordinates to contain the ship
  pool
    .query(
      "SELECT x_coord, y_coord FROM board WHERE entity_type = 'ship' AND entity_id = $1",
      [shipID]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return res.sendStatus(404);
      }

      const currentX = result.rows[0].x_coord;
      const currentY = result.rows[0].y_coord;
      return pool.query(
        `UPDATE board SET entity_type = 'none', entity_id = NULL WHERE x_coord = $1 AND y_coord = $2;`,
        [currentX, currentY]
      );
    })
    .then(() => {
      return pool.query(
        `UPDATE board SET entity_type = 'ship', entity_id = $1 WHERE x_coord = $2 AND y_coord = $3;`,
        [shipID, newX, newY]
      );
    })
    .then(() => {
      console.log('Updated:', body);
      return pool.query('SELECT * FROM board ORDER BY position_id ASC;');
    })
    .then((result) => {
      const updatedBoardState = result.rows;
      broadcastBoardState(updatedBoardState);
      res.send();
    })
    .catch((error) => {
      console.log(error);
      return res.sendStatus(500);
    });
  res.send();
});

const getRandomAttribute = () => {
  const attributes = ['speed', 'range'];
  return attributes[Math.floor(Math.random() * attributes.length)];
};

app.post('/attack', (req, res) => {
  const { attackerShipID, targetShipID } = req.body;

  if (!attackerShipID || !targetShipID) {
    return res.sendStatus(400);
  }

  const randomAttribute = getRandomAttribute();

  pool
    .query(
      'SELECT health, damage, speed, range FROM ships WHERE ship_id = $1',
      [targetShipID]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return res.sendStatus(404);
      }

      const newHealth = result.rows[0].health - result.rows[0].damage;
      const newAttributeValue =
        result.rows[0][randomAttribute] - result.rows[0].damage;

      if (newHealth <= 0) {
        return res.sendStatus(400);
      }

      return pool.query(
        `UPDATE ships SET health = $1, ${randomAttribute} = $2 WHERE ship_id = $3`,
        [newHealth, newAttributeValue, targetShipID]
      );
    })
    .then(() => {
      console.log(
        `Attacked ship ${targetShipID}: health and ${randomAttribute} decreased`
      );
      return pool.query('SELECT * FROM board ORDER BY position_id ASC;');
    })
    .then((result) => {
      const updatedBoardState = result.rows;
      broadcastBoardState(updatedBoardState);
      res.send();
    })
    .catch((error) => {
      console.log(error);
      return res.sendStatus(500);
    });
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
