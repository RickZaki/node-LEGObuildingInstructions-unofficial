/*jslint node: true */
'use strict';

var
    buildingInstructions = require('../LEGObuildingInstructions'),
    content_instructions = require('./content/instructions-set10020'),
    mask = require('json-mask'),
    schema_searchResults = require('./schemas/schema_searchResults'),
    schema_instructions = require('./schemas/schema_instructions'),
    Validator = require('jsonschema').Validator,
    instructions = null,
    instructions_mask = '/(ProductName,ProductId)',
    instructionsSearchTerm = '10020 Santa Fe Locomotive City Trains',
    searchResults = null,
    searchTerm = 'train'.toLowerCase(),
    validator = new Validator();

exports.search = {
    setUp: function (callback) {
        buildingInstructions.search(searchTerm, function (results) {
            searchResults = results;
            buildingInstructions.getByText(instructionsSearchTerm, function (instructionsContent) {
                instructions = instructionsContent;
                callback();
            });
        });
    },
    tearDown: function (callback) {
        instructions = null;
        searchResults = null;
        callback();
    },
    schema_instructions: function (test) {
        var results = validator.validate(instructions, schema_instructions));
        test.ok(results.valid);
        test.done();
    },
    schema_searchResults: function (test) {
        var results = validator.validate(searchResults, schema_searchResults);
        test.ok(results.valid);
        test.done();
    },
    content_instructions: function (test) {
        var
            instructions_masked = mask(instructions, instructions_mask);

        test.deepEqual(instructions_masked, content_instructions);
        test.done();
    },
    content_searchResults: function (test) {
        var
            passed = true;

        searchResults.forEach(function (item) {
            if (item.toLowerCase().indexOf(searchTerm) === -1) {
                passed = false;
                return;
            }
        });
        test.ok(passed);
        test.done();
    }
};