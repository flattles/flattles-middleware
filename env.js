const powerups = [
  {
    name: 'Asteroid Belt',
    effect: {
      health: -1,
      range: -1,
    },
    probability: 0.5,
  },
  {
    name: 'Way Station',
    effect: {
      health: +2,
    },
    probability: 1,
  },
  {
    name: 'Scavenger Skrimish',
    effect: {
      health: -2,
    },
    probability: 0.3,
  },
  {
    name: 'Solar Siphon',
    effect: {
      speed: +2,
    },
    probability: 1,
  },
  {
    name: 'Scrapyard Revamp',
    effect: {
      range: +1,
      damage: +1,
    },
    probability: 1,
  }
];

module.exports = { powerups };