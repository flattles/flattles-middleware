DROP TABLE IF EXISTS board;
DROP TABLE IF EXISTS ships;
DROP TABLE IF EXISTS bases;
DROP TYPE IF EXISTS entity_type;

CREATE TYPE entity_type AS ENUM ('none', 'ship', 'base');

-- Create the ships table which holds base stats for all ships
CREATE TABLE ships (
  ship_id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  health INT,
  speed INT,
  damage INT,
  range INT,
  player INT
);

-- Create the players table which holds player information
CREATE TABLE bases (
  base_id SERIAL PRIMARY KEY,
  health INT,
	player INT
);

-- Create the board table which holds the current state of the board
CREATE TABLE board (
  position_id SERIAL PRIMARY KEY,
  x_coord VARCHAR(1),
  y_coord INT,
  entity_type entity_type,  -- Specifies if it’s a "ship" or "base"
  entity_id INT             -- The ID of the referenced entity
);

-- Insert all the unique ships for each player into the ships table
INSERT INTO ships (name, health, speed, damage, range, player)
VALUES
  ('Light Ship', 3, 2, 2, 2, 1),
  ('Heavy Ship', 5, 1, 3, 3, 2),
  ('Glass Cannon', 2, 1, 5, 2, 3),
  ('Light Ship', 3, 2, 2, 2, 4);

-- Insert all the bases into the bases table
INSERT INTO bases (health, player)
VALUES
  (2, 1),
  (2, 2),
  (2, 3),
  (2, 4);

-- Insert all the positions on the board into the board table
DO $$
DECLARE
  x INT;
  y INT;
BEGIN
  FOR x IN ASCII('A')..ASCII('J') LOOP
    FOR y IN 1..10 LOOP
      INSERT INTO board (x_coord, y_coord, entity_type, entity_id)
      VALUES (CHR(x), y, 'none', NULL);
    END LOOP;
  END LOOP;
END $$;

-- Update the board table to reflect the initial positions of the players
UPDATE board SET entity_type = 'ship', entity_id = 1 WHERE x_coord = 'B' AND y_coord = 2;
UPDATE board SET entity_type = 'ship', entity_id = 2 WHERE x_coord = 'B' AND y_coord = 10;
UPDATE board SET entity_type = 'ship', entity_id = 3 WHERE x_coord = 'I' AND y_coord = 1;
UPDATE board SET entity_type = 'ship', entity_id = 4 WHERE x_coord = 'I' AND y_coord = 9;

UPDATE board SET entity_type = 'base', entity_id = 1 WHERE x_coord = 'A' AND y_coord = 1;
UPDATE board SET entity_type = 'base', entity_id = 2 WHERE x_coord = 'A' AND y_coord = 10;
UPDATE board SET entity_type = 'base', entity_id = 3 WHERE x_coord = 'J' AND y_coord = 1;
UPDATE board SET entity_type = 'base', entity_id = 4 WHERE x_coord = 'J' AND y_coord = 10;