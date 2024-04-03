DROP TABLE IF EXISTS prompts;

CREATE TABLE IF NOT EXISTS prompts (
    id text PRIMARY KEY,
    text text NOT NULL,
    category text,
    timesUsed number,
    timesSkipped number
);

CREATE TABLE IF NOT EXISTS users (
    id number PRIMARY KEY,
    prompts text
);
