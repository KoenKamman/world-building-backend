const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const Adventure = require('../../model/adventure.model');
const express = require('express');
const routes = express.Router();
// const mongodb = require('../../config/mongo.db');
const neo4j = require('../../config/neo4j.db');


// neo4j queries

const createRace =
	"MERGE (race:Race {name: {nameParam}, description: {descParam}, mongoID: {mongoParam}}) " +
	"MERGE (str_mod:StrengthModifier {value: {strParam}}) " +
	"MERGE (agi_mod:AgilityModifier {value: {agiParam}}) " +
	"MERGE (int_mod:IntelligenceModifier {value: {intParam}}) " +
	"MERGE (race)-[:HAS_MODIFIER]->(str_mod) " +
	"MERGE (race)-[:HAS_MODIFIER]->(agi_mod) " +
	"MERGE (race)-[:HAS_MODIFIER]->(int_mod) " +
	"RETURN race, str_mod, agi_mod, int_mod";

const deleteRace =
	"MATCH (race:Race {mongoID: {mongoParam}}) " +
	"WITH race " +
	"OPTIONAL MATCH (race)-[:HAS_MODIFIER]->(modifiers) " +
	"WHERE size((modifiers)<--()) = 1 " +
	"DETACH DELETE race, modifiers";

const deleteMods =
	"MATCH (race:Race {mongoID: {mongoParam}}) " +
	"WITH race " +
	"OPTIONAL MATCH (race)-[:HAS_MODIFIER]->(modifiers) " +
	"WHERE size((modifiers)<--()) = 1 " +
	"OPTIONAL MATCH (race)-[rel:HAS_MODIFIER]->(mods) " +
	"WHERE size((mods)<--()) > 1 " +
	"DETACH DELETE modifiers, rel";

const updateRace =
	"MATCH (race:Race {mongoID: {mongoParam}}) " +
	"WITH race " +
	"MERGE (str_mod:StrengthModifier {value: {strParam}}) " +
	"MERGE (agi_mod:AgilityModifier {value: {agiParam}}) " +
	"MERGE (int_mod:IntelligenceModifier {value: {intParam}}) " +
	"MERGE (race)-[:HAS_MODIFIER]->(str_mod) " +
	"MERGE (race)-[:HAS_MODIFIER]->(agi_mod) " +
	"MERGE (race)-[:HAS_MODIFIER]->(int_mod) " +
	"SET race.name =  {nameParam}, race.description = {descParam} " +
	"RETURN race, str_mod, agi_mod, int_mod";

const getRelatedRaces =
	"MATCH (n:Race {mongoID: {mongoParam}})-[:HAS_MODIFIER]->(n2)<-[:HAS_MODIFIER]-(n3:Race) " +
	"RETURN DISTINCT n3";


// Middleware - Removes _id from request body

routes.use((req, res, next) => {
	delete req.body._id;
	next()
});


// Returns a list containing all races

routes.get('/races', (req, res) => {
	res.contentType('application/json');

	Race.find()
		.then((races) => {
			res.status(200).json(races);
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json(error);
		});

});


// Returns a list of related races

routes.get('/races/:id/related', (req, res) => {
	const session = neo4j.driver.session();

	session.run(getRelatedRaces, {mongoParam: req.params.id})
		.then((result) => {
			res.status(200).json(result.records);
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json(error);
		})
});


// Returns a specific race

routes.get('/races/:id', (req, res) => {
	res.contentType('application/json');

	Race.findById(req.params.id)
		.then((race) => {
			if (race === null) {
				res.status(404).json({});
			} else {
				res.status(200).json(race);
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json(error);
		});
});


// Creates a new race

routes.post('/races', (req, res) => {
	res.contentType('application/json');
	const race = new Race(req.body);
	const session = neo4j.driver.session();

	let result;

	const transaction = session.beginTransaction();
	transaction.run(createRace,
		{
			nameParam: race.name,
			descParam: race.description,
			mongoParam: race._id.toString(),
			strParam: race.strength_mod,
			agiParam: race.agility_mod,
			intParam: race.intelligence_mod
		})
		.then(() => {
			return race.save();
		})
		.then((race) => {
			result = race;
			return transaction.commit();
		})
		.then(() => {
			session.close();
			res.status(201).json(result);
		})
		.catch((error) => {
			console.error(error);
			transaction.rollback()
				.then(() => {
					session.close();
					res.status(400).json(error);
				})
				.catch((error) => {
					console.error(error);
					session.close();
					res.status(400).json(error);
				});
		});

});


// Updates a specific race

routes.put('/races/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();
	const race = req.body;

	let result;

	const transaction = session.beginTransaction();
	transaction.run(deleteMods, {mongoParam: req.params.id})
		.then(() => {
			return transaction.run(updateRace,
				{
					nameParam: race.name,
					descParam: race.description,
					mongoParam: req.params.id,
					strParam: race.strength_mod,
					agiParam: race.agility_mod,
					intParam: race.intelligence_mod
				});
		})
		.then(() => {
			return Race.findByIdAndUpdate(req.params.id, race, {new: true});
		})
		.then((race) => {
			if (race === null) {
				return transaction.rollback();
			} else {
				result = race;
				return transaction.commit();
			}
		})
		.then((neo) => {
			session.close();
			if (neo.summary.statement.text === 'COMMIT') {
				res.status(200).json(result);
			} else if (neo.summary.statement.text === 'ROLLBACK') {
				res.status(404).json({});
			}
		})
		.catch((error) => {
			console.error(error);
			transaction.rollback()
				.then(() => {
					session.close();
					res.status(400).json(error);
				})
				.catch((error) => {
					console.log(error);
					session.close();
					res.status(400).json(error);
				});
		});

});


// Removes a specific race

routes.delete('/races/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();

	let result;

	const transaction = session.beginTransaction();
	transaction.run(deleteRace, {mongoParam: req.params.id})
		.then(() => {
			return Race.findByIdAndRemove(req.params.id);
		})
		.then((race) => {
			if (race === null) {
				return transaction.rollback();
			} else {
				result = race;
				return transaction.commit();
			}
		})
		.then((neo) => {
			session.close();
			if (neo.summary.statement.text === 'COMMIT') {
				res.status(200).json(result);
			} else if (neo.summary.statement.text === 'ROLLBACK') {
				res.status(404).json({});
			}
		})
		.catch((error) => {
			console.error(error);
			transaction.rollback()
				.then(() => {
					session.close();
					res.status(400).json(error);
				})
				.catch((error) => {
					console.error(error);
					session.close();
					res.status(400).json(error);
				});
		});

});

module.exports = routes;
