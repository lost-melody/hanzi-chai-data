DROP TABLE IF EXISTS repertoire;
DROP TABLE IF EXISTS form;
DROP TABLE IF EXISTS alias;

CREATE TABLE IF NOT EXISTS repertoire (
	unicode INTEGER PRIMARY KEY,
	tygf INTEGER,
	gb2312 INTEGER,
	pinyin TEXT
);

CREATE TABLE IF NOT EXISTS form (
	unicode INTEGER PRIMARY KEY,
	name TEXT,
	default_type INTEGER,
	gf0014_id INTEGER,
	component TEXT,
	compound TEXT,
	slice TEXT
);
