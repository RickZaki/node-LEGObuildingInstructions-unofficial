/*jslint node: true */
/*!
 * Unofficial LEGObuildingInstructions
 * Copyright (C) 2014 Rick Zaki
 * Creative Commons Attribution-ShareAlike 4.0 International Licenes
 * http://creativecommons.org/licenses/by-sa/4.0/legalcode
 */

/**
 * A module used for retrieving instructions and details about LEGO sets from http://service.LEGO.com/en-us/buildinginstructions
 * @module      LEGObuildingInstructions
 * @namespace
 */

/**
 * Instruction objects returned by many functions have the follwing structure
 * @typedef     {Object}    InstructionContent
 * @property    {string}    ImageLocation    a smallish image of the product
 * @property    {string}    FrontpageInfo    UNKNOWN
 * @property    {string}    ProductImageInfo UNKNOWN
 * @property    {string}    ProductName      name of the set
 * @property    {string}    ProductId        product ID # of the set
 * @property    {string}    PdfLocation      URL of instructions PDF
 * @property    {string}    DownloadSize     size of PDF download
 * @property    {string}    Description      UNKNOWN
 * @property    {boolean}   IsAlternative    UNKNOWN
 */
'use strict';

var
    config = {
        host: 'service.lego.com',
        search: {
            param: '&prefixText=',
            path: '/Views/Service/Pages/BIService.ashx/GetCompletionList?count=',
            resultsMax: 10
        },
        getByText: {
            param: '&prefixText=',
            paramValFromIdx: 0,
            path: '/Views/Service/Pages/BIService.ashx/GetCompletionListHtml?fromIdx='
        },
        getForThemeRange: {
            param: '&searchValue=',
            paramValFromIdx: 0,
            path: '/Views/Service/Pages/BIService.ashx/GetThemeListHtml?fromIdx='
        },
        getForYear: {
            param: '&searchValue=',
            paramValFromIdx: 0,
            path: '/Views/Service/Pages/BIService.ashx/SearchByLaunchYear?fromIdx='
        },
        getThemeRanges: {
            selector: '#ThemeDropdown option[value!=""]'
        },
        getYears: {
            selector: '#YearDropdown option[value!=""]'
        },
        page: '/en-us/buildinginstructions'
    },
    contentConcat = [],
    cheerio = require('cheerio'),
    http = require('http');

// Utility Helper Functions
/**
 * helper for making remote http.requests
 * @private
 * @param       {Object}    options         an http.request configuration object
 * @param       {string}    options.host    host of the remote call
 * @param       {string}    options.path    path of the remote call
 * @param       {function}  callback        callback function to be executed upon completion
 * @return      {string}                    string of the resulting call
 */
function httpRequest(options, callback) {
    callback = (callback || process.noop);

    http.request(options, function (response) {
        var
            str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            callback(str);
        });

        response.on('error', function () {
            console.log('unimplemented error in httpRequest');
        });
    }).end();
}

/**
 * helper function for making remote http.requests that result in JSON
 * @private
 * @param       {Object}    options         an http.request configuration object
 * @param       {string}    options.host    host of the remote call
 * @param       {string}    options.path    path of the remote call
 * @param       {function}  callback        callback function to be executed upon completion
 * @return      {Object}                    resulting JSON data
 */
function jsonRequest(options, callback) {
    callback = (callback || process.noop);

    httpRequest(options, function (response) {
        var jsonData = JSON.parse(response);
        callback(jsonData);
    });
}


// Search Field and individual items
/**
 * request a list of known sets that match a certain search string
 * @memberof                LEGObuildingInstructions
 * @param       {string}    searchTerm      string to match against
 * @param       {function}  callback        callback function to be executed upon completion
 * @return      {Array}                     array of strings of matching sets in the format "SetID SET_NAME"
 */
function search(searchTerm, callback) {
    var
        options = {
            host: config.host,
            path: config.search.path + config.search.resultsMax + config.search.param + searchTerm
        };

    callback = (callback || process.noop);

    jsonRequest(options, callback);
}

/**
 * request details for a set using a string returned from the search function
 * @memberof                LEGObuildingInstructions
 * @param       {string}    searchText  search string
 * @param       {function}  callback    callback function to be executed upon completion
 * @return      {Array}                 an array of Instruction objects
 */
function getByText(searchText, callback) {
    var
        options = {
            host: config.host,
            path: config.getByText.path + config.getByText.paramValFromIdx + config.getByText.param + encodeURIComponent(searchText)
        };

    callback = (callback || process.noop);

    jsonRequest(options, function (jsonResponse) {
        callback(jsonResponse.Content);
    });
}

//  Themes
/**
 * retrieve all instructions for a theme by range returned from getThemeRanges
 * @memberof                        LEGObuildingInstructions
 * @param       {string|Object}     themeRangeConfig            either the theme range value or an object that contains a theme range value
 * @param       {string}            themeRangeConfig.fromIdx    offset of the return results
 * @param       {string}            themeRangeConfig.range      theme range string value
 * @callback                        callback                    callback function to be executed upon completion
 * @return      {Array}                                         an array of Instruction objects
 */
function getForThemeRange(themeRangeConfig, callback) {
    var
        options = {
            host: config.host
        };

    callback = (callback || process.noop);

    if (typeof themeRangeConfig === 'object') {
        options.path = config.getForThemeRange.path + themeRangeConfig.fromIdx + config.getForThemeRange.param + themeRangeConfig.range;
    } else {
        contentConcat = [];
        options.path = config.getForThemeRange.path + config.getForThemeRange.paramValFromIdx + config.getForThemeRange.param + themeRangeConfig;
    }

    jsonRequest(options, function (jsonResponse) {
        contentConcat = contentConcat.concat(jsonResponse.Content);
        if (jsonResponse.MoreData === true) {
            getForThemeRange({
                fromIdx: getForThemeRange.fromIdx ? getForThemeRange.fromIdx + jsonResponse.Content.length : jsonResponse.Content.length,
                range: getForThemeRange.range || getForThemeRange
            }, callback);
        } else {
            callback(contentConcat);
        }
    });
}

/**
 * retrieve a list of of themes and their corresponding range strings
 * @memberof            LEGObuildingInstructions
 * @callback            callback    callback function to be executed upon completion
 * @return      {Array}              array of ThemeRanges
 */
function getThemeRanges(callback) {
    var
        options = {
            host: config.host,
            path: config.page
        };

    callback = (callback || process.noop);

    httpRequest(options, function (httpResponse) {
        var
            $ = cheerio.load(httpResponse),
            options = $(config.getThemeRanges.selector),
            optionsMapped = [];

        $(options).each(function (index, currentOption) {
            optionsMapped.push({
                name: $(currentOption).text(),
                value: parseInt($(currentOption).attr('value'), 10)
            });
        });
        callback(optionsMapped);
    });
}
/**
 * ThemeRange objects returned from getThemeRanges
 * @typedef     {Object}    ThemeRange
 * @property    {string}    name    the name of the theme
 * @property    {string}    value   the string of the theme range
 */

/**
 * retrieve all instructions for a theme by name returned from getThemeRanges
 * @memberof            LEGObuildingInstructions
 * @param   {string}    themeName   theme name from getThemeRanges
 * @callback            callback    callback function to be executed upon completion
 * @return  {Array}                 an array of Instruction objects
 */
function getForThemeName(themeName, callback) {
    callback = (callback || process.noop);

    getThemeRanges(function (themeRanges) {
        var
            filteredThemeRanges = themeRanges.filter(function (themeRange) {
                return themeRange.name === themeName;
            });

        if (filteredThemeRanges.length === 1) {
            getForThemeRange(filteredThemeRanges[0].value, callback);
        } else {
            callback([]);
        }
    });
}

/**
 * retrieve all instructions for a sets released in a year
 * @memberof                        LEGObuildingInstructions
 * @param       {string|Object}     yearConfig          either the year or an object that contains a year value
 * @param       {string}            yearConfig.fromIdx  offset of the return results
 * @param       {string}            yearConfig.value    year value to search against
 * @callback                        callback            callback function to be executed upon completion
 * @return      {Array}                                 an array of Instruction objects
 */
function getForYear(yearConfig, callback) {
    var
        options = {
            host: config.host
        };

    callback = (callback || process.noop);

    if (typeof yearConfig === 'object') {
        options.path = config.getForYear.path + yearConfig.fromIdx + config.getForYear.param + yearConfig.year;
    } else {
        contentConcat = [];
        options.path = config.getForYear.path + config.getForYear.paramValFromIdx + config.getForYear.param + yearConfig;
    }

    jsonRequest(options, function (jsonResponse) {
        contentConcat = contentConcat.concat(jsonResponse.Content);
        if (jsonResponse.MoreData) {
            getForYear({
                fromIdx: yearConfig.fromIdx ? yearConfig.fromIdx + jsonResponse.Content.length : jsonResponse.Content.length,
                year: yearConfig.year || yearConfig
            }, callback);
        } else {
            callback(contentConcat);
        }
    });
}

/**
 * retrieve a list of known years that building instructions have been published for.
 * @memberof            LEGObuildingInstructions
 * @callback            callback    callback function to be executed upon completion
 * @return      {Array}             Array of year strings
 */
function getYears(callback) {
    var
        options = {
            host: config.host,
            path: config.page
        };

    callback = (callback || process.noop);

    httpRequest(options, function (httpResponse) {
        var
            $ = cheerio.load(httpResponse),
            options = $(config.getYears.selector),
            optionsMapped = [];

        $(options).each(function (index, currentOption) {
            optionsMapped.push(parseInt($(currentOption).attr('value'), 10));
        });
        callback(optionsMapped);
    });
}



//  module.exports
module.exports = {
    getByText: getByText,
    getForThemeName: getForThemeName,
    getForThemeRange: getForThemeRange,
    getForYear: getForYear,
    getThemeRanges: getThemeRanges,
    getYears: getYears,
    search: search
};