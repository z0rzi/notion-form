DROP TABLE IF EXISTS prompts;

CREATE TABLE IF NOT EXISTS prompts (
    id text PRIMARY KEY,
    text text NOT NULL,
    category text,
    ratings text
);

CREATE TABLE IF NOT EXISTS users (
    id number PRIMARY KEY,
    prompts text
);
