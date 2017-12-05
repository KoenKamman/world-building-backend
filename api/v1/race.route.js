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

	race.save()
		.then((race) => {
			res.status(201).json(race);
		})
		.catch((error) => {
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

	Race.findByIdAndRemove(req.params.id)
		.then((race) => {
			if (race === null) res.status(404).json();
			res.status(200).json(race);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});

module.exports = routes;
