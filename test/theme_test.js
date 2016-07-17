/*jslint node: true */
'use strict';

var
    buildingInstructions = require('../LEGObuildingInstructions'),
    content_instructions = require('./content/instructions-themeRange10000-20130.json'),
    mask = require('json-mask'),
    schema_instructions = require('./schemas/schema_instructions'),
    schema_themeRanges = require('./schemas/schema_themeRanges'),
    Validator = require('jsonschema').Validator,
    instructions_mask = '/(ProductName,ProductId)',
    instructionsByTheme_mask = '/(ImageLocation,ProductImageInfo,ProductName,ProductId,PdfLocation,DownloadSize,Description,IsAlternative)',
    themesByName = null,
    themesByRange = null,
    themeRanges = null,
    themeName = 'World Racers',
    themeRange = '10000-20130',
    validator = new Validator();

exports.theme = {
    setUp: function (callback) {
        buildingInstructions.getThemeRanges(function (resultsRanges) {
            themeRanges = resultsRanges;
            buildingInstructions.getForThemeRange(themeRange, function (resultsByRange) {
                themesByRange = resultsByRange;
                buildingInstructions.getForThemeName(themeName, function (resultsByName) {
                    themesByName = resultsByName;
                    callback();
                });
            });
        });
    },
    tearDown: function (callback) {
        themesByName = null;
        themesByRange = null;
        themeRanges = null;
        callback();
    },
    schema_themeInstructions: function (test) {
        test.ok(validator.validate(themesByName, schema_instructions) && validator.validate(themesByRange, schema_instructions));
        test.done();
    },
    schema_themeRanges: function (test) {
        test.ok(validator.validate(themeRanges, schema_themeRanges));
        test.done();
    },
    content_themeInstructions: function (test) {
        var
            instructions_masked = mask(themesByRange, instructions_mask);

        test.deepEqual(instructions_masked, content_instructions);
        test.done();
    },
    content_themeMethods: function (test) {
        test.deepEqual(mask(themesByName, instructionsByTheme_mask), mask(themesByRange, instructionsByTheme_mask));
        test.done();
    },
    content_themeRanges: function (test) {
        test.ok(themeRanges.length >= 125);
        test.done();
    }
};