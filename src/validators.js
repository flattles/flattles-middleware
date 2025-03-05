function validateMove(player, newX, newY) {
  if (!player || !newX || !newY) {
    throw new Error('Invalid request body');
  }

  if (
    player == '' ||
    typeof newX !== 'string' ||
    !Number.isInteger(parseInt(newY))
  ) {
    throw new Error('Invalid coordinate types');
  }

  if (newX < 'A' || newX > 'J' || parseInt(newY) < 1 || parseInt(newY) > 10) {
    throw new Error('Invalid coordinate values');
  }
}

function validateAttack(player, target, type) {
  if (!player || !target || !type) {
    throw new Error('Invalid request body');
  }

  if (type !== 'ship' && type !== 'base') {
    throw new Error('Invalid target type');
  }

  if (player === target) {
    throw new Error('Cannot attack self');
  }
}

module.exports = { validateMove, validateAttack };
