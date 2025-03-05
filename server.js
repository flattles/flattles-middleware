require('dotenv').config({ path: './.env' });

let express = require('express');
const cors = require('cors');
let { Pool } = require('pg');
let WebSocket = require('ws');
const http = require('http');

const { reset, ship, stats, board, move, attack } = require('./src/queries');
const { validateMove, validateAttack } = require('./src/validators');
const { broadcastBoardState, broadcastAttack } = require('./src/websockets');
// const { powerup } = require('./src/powerup');

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

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}/`);
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/', async (_req, res) => {
  const { ships, bases } = await stats(pool);
  const gameboard = await board(pool);
  res.json({ ships, bases, gameboard });
});

app.post('/reset', async (_req, res) => {
  try {
    const result = await reset(pool, './sql/reset.sql');
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/ship', async (req, res) => {
  const player = req.query.player;

  if (!player) {
    return res.sendStatus(400);
  }

  res.json(await ship(pool, player));
});

app.get('/stats', async (_req, res) => {
  res.json(await stats(pool));
});

app.get('/board', async (_req, res) => {
  res.json(await board(pool));
});

app.post('/move', async (req, res) => {
  const { player, newX, newY } = req.body;

  try {
    validateMove(player, newX, newY);
    const updatedBoardState = await move(pool, newX, newY, player);
    broadcastBoardState(wss, updatedBoardState);
    res.send();
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

app.post('/attack', async (req, res) => {
  const { player, target, type } = req.body;

  try {
    validateAttack(player, target, type);
    const updatedStats = await attack(pool, player, target, type);
    broadcastAttack(wss, updatedStats);
    res.send();
  } catch (error) {
    return res.status(400).send(error.message);
  }
});
