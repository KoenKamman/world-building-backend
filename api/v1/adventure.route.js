const Character = require('../../model/character.model');
const Race = require('../../model/race.model');
const Adventure = require('../../model/adventure.model');
const express = require('express');
const routes = express.Router();
const mongodb = require('../../config/mongo.db');


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
			if (adventure === null) res.status(404).json();
			res.status(200).json(adventure);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Creates a new adventure

routes.post('/adventures', (req, res) => {
	res.contentType('application/json');
	const adventure = new Adventure(req.body);

	Promise.all([adventure.populate('characters').execPopulate(), adventure.save()])
		.then((result) => {
			res.status(201).json(result[1]);
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Updates a specific adventure

routes.put('/adventures/:id', (req, res) => {
	res.contentType('application/json');

	Adventure.findByIdAndUpdate(req.params.id, req.body, {new: true})
		.then((adventure) => {
			if (adventure === null) res.status(404).json();
			adventure.populate('characters').execPopulate()
				.then((adventure) => {
					res.status(200).json(adventure);
				})
				.catch((error) => {
					res.status(400).json(error);
				})
		})
		.catch((error) => {
			res.status(400).json(error);
		});
});


// Deletes a specific adventure

routes.delete('/adventures/:id', (req, res) => {
	res.contentType('application/json');

	Adventure.findByIdAndRemove(req.params.id)
		.then((adventure) => {
			if (adventure === null) res.status(404).json();
			adventure.populate('characters').execPopulate()
				.then((adventure) => {
					res.status(200).json(adventure);
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
