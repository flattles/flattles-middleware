const fs = require('fs');
const path = require('path');

async function reset(pool, file) {
  const resetFilePath = path.join(__dirname, file);

  try {
    const sql = fs.readFileSync(resetFilePath, 'utf-8');

    pool
      .query('BEGIN')
      .then(() => {
        pool.query(sql).then(() => {
          pool.query('COMMIT');
          return 'Database reset successfully';
        });
      })
      .catch(() => {
        pool.query('ROLLBACK');
        throw new Error('Database reset failed');
      });
  } catch (error) {
    throw new Error('Error reading SQL file');
  }
}

async function ship(pool, player) {
  const ship = await pool.query('SELECT * FROM ships WHERE ship_id = $1;', [
    player,
  ]);
  return ship.rows;
}

async function stats(pool) {
  const shipStats = await pool.query('SELECT * FROM ships');
  const baseStats = await pool.query('SELECT * FROM bases');

  return { ships: shipStats.rows, bases: baseStats.rows };
}

async function board(pool) {
  const board = await pool.query(
    'SELECT * FROM board ORDER BY position_id ASC;'
  );
  return board.rows;
}

async function move(pool, newX, newY, player) {
  const occupied = await pool.query(
    `SELECT entity_type, entity_id FROM board WHERE x_coord = $1 AND y_coord = $2`,
    [newX, newY]
  );

  if (
    occupied.rows[0].entity_type !== 'none' &&
    occupied.rows[0].entity_id !== null
  ) {
    throw new Error('Target position is occupied');
  }
  const currentPos = await pool.query(
    `SELECT x_coord, y_coord FROM board WHERE entity_type = 'ship' AND entity_id = $1`,
    [player]
  );

  if (currentPos.rows.length === 0) {
    throw new Error('Ship not found');
  }

  const currentX = currentPos.rows[0].x_coord;
  const currentY = currentPos.rows[0].y_coord;

  await pool.query(
    `UPDATE board SET entity_type = 'none', entity_id = NULL WHERE x_coord = $1 AND y_coord = $2;`,
    [currentX, currentY]
  );

  await pool.query(
    `UPDATE board SET entity_type = 'ship', entity_id = $1 WHERE x_coord = $2 AND y_coord = $3;`,
    [player, newX, newY]
  );

  const updateBoard = await pool.query(
    'SELECT * FROM board ORDER BY position_id ASC;'
  );
  return updateBoard.rows;
}

async function attack(pool, player, target, type) {
  const targetShip = await pool.query(
    `SELECT health FROM ${type}s WHERE ${type}_id = $1`,
    [target]
  );

  if (targetShip.rows.length === 0) {
    throw new Error(`Target ${type} not found`);
  }

  if (targetShip.rows[0].health === 0) {
    throw new Error(`Target ${type} is already destroyed`);
  }

  const attacker = await pool.query(
    'SELECT damage FROM ships WHERE ship_id = $1',
    [player]
  );

  const newHealth = Math.max(
    0,
    targetShip.rows[0].health - attacker.rows[0].damage
  );

  await pool.query(`UPDATE ${type}s SET health = $1 WHERE ${type}_id = $2`, [
    newHealth,
    target,
  ]);

  return await stats(pool);
}

module.exports = { reset, ship, stats, board, move, attack };
