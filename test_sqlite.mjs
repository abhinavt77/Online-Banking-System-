import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);");
const insert = db.prepare("INSERT INTO test (name) VALUES (?)");
insert.run("Apex Bank");
const rows = db.prepare("SELECT * FROM test").all();
console.log("SQLITE_SUCCESS:", rows);
