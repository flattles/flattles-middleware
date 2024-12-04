\c postgres
DROP DATABASE IF EXISTS flattles;
CREATE DATABASE flattles;
\c flattles

CREATE TYPE entity_type AS ENUM ('none', 'ship', 'mine', 'base');

-- Create the ships table which holds base stats for all ships
CREATE TABLE ships (
  ship_id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  health INT,
  speed INT,
  damage INT,
  range INT,
  player VARCHAR(50)
);

-- Create the mines table which holds mine information
CREATE TABLE mines (
  mine_id SERIAL PRIMARY KEY,
  damage INT,
  player VARCHAR(50)
);

-- Create the players table which holds player information
CREATE TABLE bases (
  base_id SERIAL PRIMARY KEY,
  health INT,
	player VARCHAR(50)
);

-- Create the board table which holds the current state of the board
CREATE TABLE board (
  position_id SERIAL PRIMARY KEY,
  x_coord VARCHAR(1),
  y_coord INT,
  entity_type entity_type,  -- Specifies if it’s a "mine", "ship", or "base"
  entity_id INT             -- The ID of the referenced entity
);

-- Insert all the unique ships for each player into the ships table
INSERT INTO ships (name, health, speed, damage, range, player)
VALUES
  ('Light Ship', 3, 4, 1, 2, 'playerOne'),
  ('Heavy Ship', 6, 1, 4, 3, 'playerTwo'),
  ('Glass Cannon', 1, 3, 6, 3, 'playerThree'),
  ('Light Ship', 1, 3, 6, 3, 'playerFour');

-- Insert all the mines into the mines table
INSERT INTO mines (damage, player)
VALUES
  (2, 'playerOne'),
  (2, 'playerTwo'),
  (2, 'playerThree'),
  (2, 'playerFour');

-- Insert all the bases into the bases table
INSERT INTO bases (health, player)
VALUES
  (2, 'playerOne'),
  (2, 'playerTwo'),
  (2, 'playerThree'),
  (2, 'playerFour');

-- Insert all the positions on the board into the board table
DO $$
DECLARE
  x INT;
  y INT;
BEGIN
  FOR x IN ASCII('A')..ASCII('E') LOOP
    FOR y IN 1..5 LOOP
      INSERT INTO board (x_coord, y_coord, entity_type, entity_id)
      VALUES (CHR(x), y, 'none', NULL);
    END LOOP;
  END LOOP;
END $$;

-- Update the board table to reflect the initial positions of the players
UPDATE board SET entity_type = 'ship', entity_id = 1 WHERE x_coord = 'A' AND y_coord = 1;
UPDATE board SET entity_type = 'ship', entity_id = 2 WHERE x_coord = 'A' AND y_coord = 5;
UPDATE board SET entity_type = 'ship', entity_id = 3 WHERE x_coord = 'E' AND y_coord = 1;
UPDATE board SET entity_type = 'ship', entity_id = 4 WHERE x_coord = 'E' AND y_coord = 5;

UPDATE board SET entity_type = 'mine', entity_id = 1 WHERE x_coord = 'B' AND y_coord = 2;
UPDATE board SET entity_type = 'mine', entity_id = 2 WHERE x_coord = 'B' AND y_coord = 4;
UPDATE board SET entity_type = 'mine', entity_id = 3 WHERE x_coord = 'D' AND y_coord = 2;
UPDATE board SET entity_type = 'mine', entity_id = 4 WHERE x_coord = 'D' AND y_coord = 4;




-- -- Create the ships table which holds base stats for all ships
-- CREATE TABLE ships (
--   ship_id SERIAL PRIMARY KEY,
--   name VARCHAR(50),
--   health INT,
--   speed INT,
--   damage INT,
--   range INT
-- );

-- -- Create the players table which holds player information
-- CREATE TABLE players (
--   player_id SERIAL PRIMARY KEY,
-- 	name VARCHAR(50),
-- 	position_x INT,
--   position_y INT,
-- 	ship INT,
--   home_health INT
-- );

-- -- Create the board table which holds the current state of the board
-- CREATE TABLE board (
--   board_id SERIAL PRIMARY KEY,
--   position_x INT,
--   position_y INT,
--   player VARCHAR(50)
-- );


-- -- Insert all the unique ships for each player into the ships table
-- INSERT INTO ships (name, health, speed, damage, range)
-- VALUES
--   ('Light Ship', 3, 4, 1, 2),
--   ('Heavy Ship', 6, 1, 4, 3),
--   ('Glass Cannon', 1, 3, 6, 3),
--   ('Light Ship', 1, 3, 6, 3);

-- -- Insert all the players into the players table
-- INSERT INTO players (name, position_x, position_y, ship, home_health)
-- VALUES
--   ('playerOne', 1, 1, (SELECT ship_id FROM ships WHERE ship_id=1), 2),
--   ('playerTwo', 1, 5, (SELECT ship_id FROM ships WHERE ship_id=2), 2),
--   ('playerThree', 5, 1, (SELECT ship_id FROM ships WHERE ship_id=3), 2),
--   ('playerFour', 5, 5, (SELECT ship_id FROM ships WHERE ship_id=4), 2);

-- -- Insert all the positions on the board into the board table
-- DO $$
-- DECLARE
--   x INT;
--   y INT;
-- BEGIN
--   FOR x IN 1..5 LOOP
--     FOR y IN 1..5 LOOP
--       INSERT INTO board (position_x, position_y, player)
--       VALUES (x, y, NULL);
--     END LOOP;
--   END LOOP;
-- END $$;

-- -- Update the board table to reflect the initial positions of the players
-- UPDATE board SET player='playerOne' WHERE position_x=1 AND position_y=1;
-- UPDATE board SET player='playerTwo' WHERE position_x=1 AND position_y=5;
-- UPDATE board SET player='playerThree' WHERE position_x=5 AND position_y=1;
-- UPDATE board SET player='playerFour' WHERE position_x=5 AND position_y=5;