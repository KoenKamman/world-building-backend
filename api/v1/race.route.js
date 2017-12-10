const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const Adventure = require('../../model/adventure.model');
const express = require('express');
const routes = express.Router();
const mongodb = require('../../config/mongo.db');
const neo4j = require('../../config/neo4j.db');


// neo4j queries and functions

const createRace =
	"MERGE (race:Race {name: {nameParam}, description: {descParam}, mongoID: {mongoParam}}) " +
	"MERGE (str_mod:StrengthModifier {value: {strParam}}) " +
	"MERGE (agi_mod:AgilityModifier {value: {agiParam}}) " +
	"MERGE (int_mod:IntelligenceModifier {value: {intParam}}) " +
	"MERGE (race)-[:HAS_MODIFIER]->(str_mod) " +
	"MERGE (race)-[:HAS_MODIFIER]->(agi_mod) " +
	"MERGE (race)-[:HAS_MODIFIER]->(int_mod) " +
	"RETURN race.name, race.description, race.mongoID, str_mod.value, agi_mod.value, int_mod.value";

const deleteRace =
	"MATCH (race:Race {mongoID: {mongoParam}}) " +
	"WITH race " +
	"OPTIONAL MATCH (race)-[r]-(allRelatedNodes) " +
	"WHERE size((allRelatedNodes)--()) = 1 " +
	"DETACH DELETE race, allRelatedNodes ";

function printQuery(result) {
	console.log("---Executed cypher query---");
	console.log(result.summary.statement.text);
	console.log("---------------------------");
}


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
			res.status(400).json(error);
		});

});


// Returns a specific race

routes.get('/races/:id', (req, res) => {
	res.contentType('application/json');

	Race.findById(req.params.id)
		.then((race) => {
			if (race === null) res.status(404).json();
			res.status(200).json(race);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Creates a new race

routes.post('/races', (req, res) => {
	res.contentType('application/json');
	const race = new Race(req.body);
	const session = neo4j.session();

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
		.then((result) => {
			printQuery(result);
			return race.save();
		})
		.then((race) => {
			res.status(200).json(race);
			return transaction.commit();
		})
		.then((result) => {
			console.log("Transaction committed to neo4j");
			session.close();
		})
		.catch((error) => {
			transaction.rollback();
			session.close();
			res.status(400).json(error);
		});

});


// Updates a specific race

routes.put('/races/:id', (req, res) => {
	res.contentType('application/json');

	Race.findByIdAndUpdate(req.params.id, req.body, {new: true})
		.then((race) => {
			if (race === null) res.status(404).json();
			res.status(200).json(race);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Removes a specific race

routes.delete('/races/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.session();

	const transaction = session.beginTransaction();
	transaction.run(deleteRace, {mongoParam: req.params.id})
		.then((result) => {
			console.log(result);
		})
		.catch((error) => {
			res.status(400).json(error);
		});


	// Race.findByIdAndRemove(req.params.id)
	// 	.then((race) => {
	// 		if (race === null) res.status(404).json();
	// 		res.status(200).json(race);
	// 	})
	// 	.catch((error) => {
	// 		res.status(400).json(error);
	// 	});

});

module.exports = routes;
