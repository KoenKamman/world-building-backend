const env = {
	webPort: process.env.PORT || 3000,
	dbHost: process.env.DB_HOST || 'localhost',
	dbPort: process.env.DB_PORT || '',
	dbUser: process.env.DB_USER || '',
	dbPassword: process.env.DB_PASSWORD || '',
	dbDatabase: process.env.DB_DATABASE || 'world-building',
	dbHostNeo: process.env.DB_HOST_NEO || 'localhost',
	dbPortNeo: process.env.DB_PORT_NEO || '',
	dbUserNeo: process.env.DB_USER_NEO || '',
	dbPasswordNeo: process.env.DB_PASSWORD_NEO || '',
};

const dburl = process.env.NODE_ENV === 'production' ?
	'mongodb://' + env.dbUser + ':' + env.dbPassword + '@' + env.dbHost + ':' + env.dbPort + '/' + env.dbDatabase :
	'mongodb://localhost/' + env.dbDatabase;

const dburlNeo = process.env.NODE_ENV === 'production' ?
	'bolt://' + env.dbHostNeo + ':' + env.dbPortNeo:
	'bolt://localhost:7687/';

module.exports = {
	env: env,
	dburl: dburl,
	dburlNeo: dburlNeo
};
