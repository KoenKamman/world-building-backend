const neo4j = require('neo4j-driver').v1;
const config = require('./env');

const driver = neo4j.driver(config.dburlNeo, neo4j.auth.basic(config.env.dbUserNeo, config.env.dbPasswordNeo));

function printQuery(result) {
	console.log("---Executed cypher query---");
	console.log(result.summary.statement.text);
	console.log("---------------------------");
}

module.exports = {
	driver: driver,
	printQuery
};
