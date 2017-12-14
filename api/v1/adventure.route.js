const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const Adventure = require('../../model/adventure.model');
const express = require('express');
const routes = express.Router();
// const mongodb = require('../../config/mongo.db');
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
			console.error(error);
			res.status(400).json(error);
		});
});


// Returns a specific adventure

routes.get('/adventures/:id', (req, res) => {
	res.contentType('application/json');

	Adventure.findById(req.params.id)
		.then((adventure) => {
			if (adventure === null) {
				res.status(404).json({});
			} else {
				res.status(200).json(adventure);
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json(error);
		});
});


// Creates a new adventure

routes.post('/adventures', (req, res) => {
	res.contentType('application/json');
	const adventure = new Adventure(req.body);
	const session = neo4j.driver.session();

	let result;

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
		.then(() => {
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
		.then(() => {
			return adventure.save();
		})
		.then((adventure) => {
			result = adventure;
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


// Updates a specific adventure

routes.put('/adventures/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();
	const adventure = req.body;

	let result;

	const transaction = session.beginTransaction();
	transaction.run(updateAdventure,
		{
			mongoParam: req.params.id,
			nameParam: adventure.name,
			descParam: adventure.description,
			xpParam: adventure.experience_gain
		})
		.then(() => {
			return transaction.run(unlinkCharacters, {mongoParam: req.params.id});
		})
		.then(() => {
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
		.then(() => {
			return Adventure.findByIdAndUpdate(req.params.id, req.body, {new: true});
		})
		.then((adventure) => {
			if (adventure === null) {
				return transaction.rollback();
			} else {
				result = adventure;
				return transaction.commit();
			}
		})
		.then((neo) => {
			session.close();
			if (neo.summary.statement.text === 'COMMIT') {
				return result.populate('characters').execPopulate();
			} else if (neo.summary.statement.text === 'ROLLBACK') {
				res.status(404).json({});
			}
		})
		.then(() => {
			res.status(200).json(result);
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


// Deletes a specific adventure

routes.delete('/adventures/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();

	let result;

	const transaction = session.beginTransaction();
	transaction.run(deleteAdventure, {mongoParam: req.params.id})
		.then(() => {
			return Adventure.findByIdAndRemove(req.params.id)
		})
		.then((adventure) => {
			if (adventure === null) {
				return transaction.rollback();
			} else {
				result = adventure;
				return transaction.commit();
			}
		})
		.then((neo) => {
			session.close();
			if (neo.summary.statement.text === 'COMMIT') {
				return result.populate('characters').execPopulate();
			} else if (neo.summary.statement.text === 'ROLLBACK') {
				res.status(404).json({});
			}
		})
		.then(() => {
			res.status(200).json(result);
		})
		.catch((error) => {
			session.close();
			console.log(error);
			res.status(400).json(error);
		});
});

module.exports = routes;
