const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const Adventure = require('../../model/adventure.model');
const express = require('express');
const routes = express.Router();
// const mongodb = require('../../config/mongo.db');
const neo4j = require('../../config/neo4j.db');


// neo4j queries

const createCharacter =
	"MATCH (race:Race {mongoID: {raceIDParam}}) " +
	"CREATE (char:Character {name: {nameParam}, description: {descParam}, experience: {xpParam}, " +
	"mongoID: {charIDParam}})-[:HAS_RACE]->(race) " +
	"RETURN char, race";

const updateCharacter =
	"MATCH (char:Character {mongoID: {charIDParam}}) " +
	"MATCH (newRace:Race {mongoID: {raceIDParam}}) " +
	"OPTIONAL MATCH (char)-[r:HAS_RACE]->(race:Race) " +
	"SET char.name = {nameParam} " +
	"SET char.experience = {xpParam} " +
	"SET char.description = {descParam} " +
	"DELETE r " +
	"CREATE (char)-[:HAS_RACE]->(newRace) " +
	"RETURN char, newRace";

const deleteCharacter =
	"MATCH (char:Character {mongoID: {mongoParam}}) " +
	"DETACH DELETE (char)";


// Middleware - Removes _id from request body

routes.use((req, res, next) => {
	delete req.body._id;
	next()
});


// Returns a list containing all characters

routes.get('/characters', (req, res) => {
	res.contentType('application/json');

	Character.find()
		.then((characters) => {
			res.status(200).json(characters);
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json(error);
		});
});


// Returns a specific character

routes.get('/characters/:id', (req, res) => {
	res.contentType('application/json');

	Character.findById(req.params.id)
		.then((character) => {
			if (character === null) {
				res.status(404).json({});
			} else {
				res.status(200).json(character);
			}
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json(error);
		});
});


// Creates a new character

routes.post('/characters', (req, res) => {
	res.contentType('application/json');
	const character = new Character(req.body);
	const session = neo4j.driver.session();

	let result;

	const transaction = session.beginTransaction();
	character.populate('race').execPopulate()
		.then(() => {
			return transaction.run(createCharacter,
				{
					raceIDParam: character.race._id.toString(),
					nameParam: character.name,
					descParam: character.description,
					xpParam: character.experience,
					charIDParam: character._id.toString()
				});
		})
		.then(() => {
			return character.save();
		})
		.then((character) => {
			result = character;
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


// Updates a specific character

routes.put('/characters/:id', (req, res) => {
	res.contentType('application/json');
	const newCharacter = req.body;
	const session = neo4j.driver.session();

	let result;

	const transaction = session.beginTransaction();
	transaction.run(updateCharacter,
		{
			raceIDParam: newCharacter.race,
			charIDParam: req.params.id,
			nameParam: newCharacter.name,
			descParam: newCharacter.description,
			xpParam: newCharacter.experience
		})
		.then(() => {
			return Character.findByIdAndUpdate(req.params.id, req.body, {new: true})
		})
		.then((character) => {
			if (character === null) {
				return transaction.rollback();
			} else {
				result = character;
				return transaction.commit();
			}
		})
		.then((neo) => {
			session.close();
			if (neo.summary.statement.text === 'COMMIT') {
				return result.populate('race').execPopulate();
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


// Deletes a specific character

routes.delete('/characters/:id', (req, res) => {
	res.contentType('application/json');
	const session = neo4j.driver.session();

	let result;

	const transaction = session.beginTransaction();
	transaction.run(deleteCharacter, {mongoParam: req.params.id})
		.then(() => {
			return Character.findByIdAndRemove(req.params.id);
		})
		.then((character) => {
			if (character === null) {
				return transaction.rollback();
			} else {
				result = character;
				return transaction.commit();
			}
		})
		.then((neo) => {
			session.close();
			if (neo.summary.statement.text === 'COMMIT') {
				return result.populate('race').execPopulate();
			} else if (neo.summary.statement.text === 'ROLLBACK') {
				res.status(404).json();
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

module.exports = routes;
