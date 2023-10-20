DROP TABLE IF EXISTS prompts;

CREATE TABLE IF NOT EXISTS prompts (
    id text PRIMARY KEY,
    text text NOT NULL,
    category text,
    rating integer,
    rating_amount integer
);

CREATE TABLE IF NOT EXISTS users (
    id number PRIMARY KEY,
    prompts text
);
