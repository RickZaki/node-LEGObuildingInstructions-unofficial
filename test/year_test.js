/*jslint node: true */
'use strict';

var
    buildingInstructions = require('../LEGObuildingInstructions'),
    content_instructions = require('./content/instructions-year1997.json'),
    mask = require('json-mask'),
    schema_instructions = require('./schemas/schema_instructions'),
    schema_years = require('./schemas/schema_years.json'),
    Validator = require('jsonschema').Validator,
    instructions_mask = '/(ProductName,ProductId)',
    searchResults = null,
    searchYear = 1997,
    validator = new Validator(),
    years = null;

exports.year = {
    setUp: function (callback) {
        buildingInstructions.getYears(function (resultYears) {
            years = resultYears;
            buildingInstructions.getForYear(searchYear, function (resultIntructions) {
                searchResults = resultIntructions;
                callback();
            });
        });
    },
    tearDown: function (callback) {
        searchResults = null;
        years = null;
        callback();
    },
    schema_searchResults: function (test) {
        test.ok(validator.validate(searchResults, schema_instructions));
        test.done();
    },
    schema_years: function (test) {
        test.ok(validator.validate(years, schema_years));
        test.done();
    },
    content_instructions: function (test) {
        var
            instructions_masked = mask(searchResults, instructions_mask);

        test.deepEqual(instructions_masked, content_instructions);
        test.done();
    },
    content_years: function (test) {
        test.ok(years.length >= 22);
        test.done();
    }
};