require('dotenv').config({ path: './.env' });
let express = require('express');
const cors = require('cors');
let { Pool } = require('pg');
let WebSocket = require('ws');
const { powerups } = require('./env');

let hostname = '0.0.0.0';
let port = process.env.PORT || 3000;
let app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

let pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.connect().then(() => {
  console.log('Connected to database');
});

const wss = new WebSocket.Server({ port: process.env.WS_PORT || 8080 });
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/', async (_req, res) => {
  let database = {};
  database['bases'] = (await pool.query('SELECT * FROM bases;')).rows;
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

app.get('/ship', (req, res) => {
  const player = req.query.player;

  if (!player) {
    return res.sendStatus(400);
  }

  pool
    .query('SELECT * FROM ships WHERE ship_id = $1;', [player])
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
    return res.status(400).send('Invalid request body');
  }

  // Check if the required properties have values contigent to their type
  if (
    body.shipID == '' ||
    typeof body.x !== 'string' ||
    !Number.isInteger(parseInt(body.y))
  ) {
    return res.status(400).send('Invalid coordinate types');
  }

  // Check if the required x and y properties are within the board's parameters
  if (
    body.x < 'A' ||
    body.x > 'J' ||
    parseInt(body.y) < 1 ||
    parseInt(body.y) > 10
  ) {
    return res.status(400).send('Invalid coordinate values');
  }

  const shipID = body.shipID;
  const newX = body.x;
  const newY = parseInt(body.y);

  // Get the current position of the ship
  // Then take those coordinates and set the reset the position to be empty (no ship entity)
  // Finally set the new position at the new coordinates to contain the ship
  pool
    .query(
      `SELECT entity_type, entity_id FROM board WHERE x_coord = $1 AND y_coord = $2`,
      [newX, newY]
    )
    .then((result) => {
      if (
        result.rows[0].entity_type !== 'none' &&
        result.rows[0].entity_id !== null
      ) {
        throw new Error('Target position is occupied');
      }

      return pool.query(
        `SELECT x_coord, y_coord FROM board WHERE entity_type = 'ship' AND entity_id = $1`,
        [shipID]
      );
    })
    .then((result) => {
      if (result.rows.length === 0) {
        throw new Error('Ship not found');
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
      return res.status(400).send(error.message);
    });
});

const getRandomAttribute = () => {
  const attributes = ['speed', 'range'];
  return attributes[Math.floor(Math.random() * attributes.length)];
};

app.post('/attack', (req, res) => {
  const { player, target } = req.body;

  if (!player || !target) {
    return res.send(400).status('Invalid request body');
  }

  const randomAttribute = getRandomAttribute();

  pool
    .query(
      'SELECT health, damage, speed, range FROM ships WHERE ship_id = $1',
      [target]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        throw new Error('Target ship not found');
      }

      const newHealth = result.rows[0].health - result.rows[0].damage;
      const newAttributeValue =
        result.rows[0][randomAttribute] - result.rows[0].damage;

      if (newHealth <= 0) {
        throw new Error('Target ship is already destroyed');
      }

      return pool.query(
        `UPDATE ships SET health = $1, ${randomAttribute} = $2 WHERE ship_id = $3`,
        [newHealth, newAttributeValue, target]
      );
    })
    .then(() => {
      console.log(
        `Attacked ship ${target}: health and ${randomAttribute} decreased`
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
      return res.status(400).send(error.message);
    });
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
