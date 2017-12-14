const mongoose = require('mongoose');
const neo4j = require('../config/neo4j.db');

mongoose.Promise = global.Promise;

before((done) => {
	mongoose.connect('mongodb://localhost/worldbuilding_test', {useMongoClient: true});
	mongoose.connection
		.once('open', () => done())
		.on('error', (err) => {
			console.warn('Warning', err);
		});
});

beforeEach((done) => {
	mongoose.connection.db.dropDatabase()
		.then(() => {
			return neo4j.driver.session().run('MATCH (n) DETACH DELETE n');
		})
		.then(() => {
			done();
		})
		.catch((error) => {
			console.error(error);
		})
});