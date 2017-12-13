const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const Adventure = require('../../model/adventure.model');
const express = require('express');
const routes = express.Router();
const mongodb = require('../../config/mongo.db');
const neo4j = require('../../config/neo4j.db');


// neo4j queries

const createAdventure =
	"CREATE (adv:Adventure {name: {nameParam}, description: {descParam}, experience_gain: {xpParam}, " +
	"mongoID: {mongoParam}}) " +
	"RETURN adv";

const linkCharacter =
	"MATCH (adv:Adventure {mongoID: {advIDParam}}) " +
	"MATCH (char:Character {mongoID: {charIDParam}}) " +
	"CREATE (adv)-[:HAS_CHARACTER]->(char) " +
	"RETURN adv, char";

const updateAdventure =
	"MATCH (adv:Adventure {mongoID: {mongoParam}}) " +
	"SET adv.name = {nameParam} " +
	"SET adv.description = {descParam} " +
	"SET adv.experience_gain = {xpParam} " +
	"RETURN adv";

const deleteAdventure =
	"MATCH (adv:Adventure {mongoID: {mongoParam}}) " +
	"DETACH DELETE adv";

const unlinkCharacters =
	"MATCH (adv:Adventure {mongoID: {mongoParam}})-[r:HAS_CHARACTER]->() " +
	"DELETE r " +
	"RETURN adv";


// Middleware - Removes _id from request body

routes.use((req, res, next) => {
	delete req.body._id;
	next()
});


// Returns a list containing all adventures

routes.get('/adventures', (req, res) => {
	res.contentType('application/json');

	Adventure.find()
		.then((adventures) => {
			res.status(200).json(adventures);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Returns a specific adventure

routes.get('/adventures/:id', (req, res) => {
	res.contentType('application/json');

	Adventure.findById(req.params.id)
		.then((adventure) => {
			if (adventure === null) {
				res.status(404).json();
			} else {
				res.status(200).json(adventure);
			}
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Creates a new adventure

routes.post('/adventures', (req, res) => {
	res.contentType('application/json');
	const adventure = new Adventure(req.body);
	const session = neo4j.driver.session();

	const transaction = session.beginTransaction();
	adventure.populate('characters').execPopulate()
		.then(() => {
			return transaction.run(createAdventure,
				{
					mongoParam: adventure._id.toString(),
					nameParam: adventure.name,
					descParam: adventure.description,
					xpParam: adventure.experience_gain
				});
		})
		.then((result) => {
			// neo4j.printQuery(result);
			let promises = [];
			for (let i = 0; i < adventure.characters.length; i++) {
				promises.push(transaction.run(linkCharacter,
					{
						advIDParam: adventure._id.toString(),
						charIDParam: adventure.characters[i]._id.toString()
					}));
			}
			return Promise.all(promises);
		})
		.then((result) => {
			for (let i = 0; i < result.length; i++) {
				// neo4j.printQuery(result[i]);
			}
			return adventure.save();
		})
		.then((result) => {
			// console.log("Adventure added to MongoDB");
			res.status(201).json(result);
			return transaction.commit();
		})
		.then((result) => {
			// console.log("Transaction committed to neo4j");
			session.close();
		})
		.catch((error) => {
			transaction.rollback()
				.then(() => {
					// console.log("Neo4j transaction rolled back");
					session.close();
				})
				.catch((error) => {
					console.log(error);
					session.close();
				});
			res.status(400).json(error);
		});

});


// Updates a specific adventure

routes.put('/adventures/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();
	const adventure = req.body;

	const transaction = session.beginTransaction();
	transaction.run(updateAdventure,
		{
			mongoParam: req.params.id,
			nameParam: adventure.name,
			descParam: adventure.description,
			xpParam: adventure.experience_gain
		})
		.then((result) => {
			// neo4j.printQuery(result);
			return transaction.run(unlinkCharacters, {mongoParam: req.params.id});
		})
		.then((result) => {
			// neo4j.printQuery(result);
			let promises = [];
			for (let i = 0; i < adventure.characters.length; i++) {
				promises.push(transaction.run(linkCharacter,
					{
						advIDParam: req.params.id,
						charIDParam: adventure.characters[i]
					}));
			}
			return Promise.all(promises);
		})
		.then((result) => {
			for (let i = 0; i < result.length; i++) {
				// neo4j.printQuery(result[i]);
			}
			return Adventure.findByIdAndUpdate(req.params.id, req.body, {new: true});
		})
		.then((adventure) => {
			if (adventure !== null) {
				return adventure.populate('characters').execPopulate();
			} else {
				return adventure;
			}
		})
		.then((adventure) => {
			if (adventure === null) {
				// console.log("Adventure not found in MongoDB");
				res.status(404).json();
				return transaction.rollback();
			} else {
				// console.log("Adventure deleted from MongoDB");
				res.status(200).json(adventure);
				return transaction.commit();
			}
		})
		.then((result) => {
			if (result.summary.statement.text === 'COMMIT') {
				// console.log("Transaction committed to neo4j");
			} else if (result.summary.statement.text === 'ROLLBACK') {
				// console.log("Neo4j transaction rolled back");
			}
			session.close();
		})
		.catch((error) => {
			session.close();
			console.log(error);
			res.status(400).json(error);
		});
});


// Deletes a specific adventure

routes.delete('/adventures/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();

	const transaction = session.beginTransaction();
	transaction.run(deleteAdventure, {mongoParam: req.params.id})
		.then((result) => {
			// neo4j.printQuery(result);
			return Adventure.findByIdAndRemove(req.params.id)
		})
		.then((adventure) => {
			if (adventure !== null) {
				return adventure.populate('characters').execPopulate();
			} else {
				return adventure;
			}
		})
		.then((adventure) => {
			if (adventure === null) {
				// console.log("Adventure not found in MongoDB");
				res.status(404).json();
				return transaction.rollback();
			} else {
				// console.log("Adventure deleted from MongoDB");
				res.status(200).json(adventure);
				return transaction.commit();
			}
		})
		.then((result) => {
			if (result.summary.statement.text === 'COMMIT') {
				// console.log("Transaction committed to neo4j");
			} else if (result.summary.statement.text === 'ROLLBACK') {
				// console.log("Neo4j transaction rolled back");
			}
			session.close();
		})
		.catch((error) => {
			session.close();
			console.log(error);
			res.status(400).json(error);
		});
});

module.exports = routes;
