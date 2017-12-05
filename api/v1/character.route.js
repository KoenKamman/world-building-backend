const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const express = require('express');
const routes = express.Router();
const mongodb = require('../../config/mongo.db');


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
			res.status(400).json(error);
		});
});


// Returns a specific character

routes.get('/characters/:id', (req, res) => {
	res.contentType('application/json');

	Character.findById(req.params.id)
		.then((character) => {
			if (character === null) res.status(404).json();
			res.status(200).json(character);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Creates a new character

routes.post('/characters', (req, res) => {
	res.contentType('application/json');
	const character = new Character(req.body);

	Promise.all([character.populate('race').execPopulate(), character.save()])
		.then((result) => {
			res.status(201).json(result[1]);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Updates a specific character

routes.put('/characters/:id', (req, res) => {
	res.contentType('application/json');

	Character.findByIdAndUpdate(req.params.id, req.body, {new: true})
		.then((character) => {
			if (character === null) res.status(404).json();
			character.populate('race').execPopulate()
				.then((character) => {
					res.status(200).json(character);
				})
				.catch((error) => {
					res.status(400).json(error);
				})
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Deletes a specific character

routes.delete('/characters/:id', (req, res) => {
	res.contentType('application/json');

	Character.findByIdAndRemove(req.params.id)
		.then((character) => {
			if (character === null) res.status(404).json();
			character.populate('race').execPopulate()
				.then((character) => {
					res.status(200).json(character);
				})
				.catch((error) => {
					res.status(400).json(error);
				})
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

module.exports = routes;
