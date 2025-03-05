function broadcastBoardState(wss, updatedBoardState) {
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

function broadcastAttack(wss, updatedStats) {
  const data = JSON.stringify({
    type: 'UPDATE_STATS',
    stats: updatedStats,
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = { broadcastBoardState, broadcastAttack };