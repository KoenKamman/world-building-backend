const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdventureSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	experience_gain: {
		type: Number,
		required: true
	},
	characters: [{
		type: Schema.Types.ObjectId,
		ref: 'character'
	}]
});


// Middleware

AdventureSchema.pre('find', function (next) {
	this.populate('characters');
	next();
});

AdventureSchema.pre('findOne', function (next) {
	this.populate('characters');
	next();
});


const Adventure = mongoose.model('adventure', AdventureSchema);

module.exports = Adventure;
