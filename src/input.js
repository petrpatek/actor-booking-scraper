const Apify = require('apify');

const { checkDate, checkDateGap } = require('./util.js');

const { log } = Apify.utils;

module.exports.validateInput = (input) => {
    if (!input.search && !input.startUrls) {
        throw new Error('WRONG INPUT: Missing "search" or "startUrls" attribute in INPUT!');
    } else if (input.search && input.startUrls && input.search.trim().length > 0 && input.startUrls.length > 0) {
        throw new Error('WRONG INPUT: It is not possible to use both "search" and "startUrls" attributes in INPUT!');
    }
    if (!(input.proxyConfig && input.proxyConfig.useApifyProxy)) {
        throw new Error('WRONG INPUT: This actor cannot be used without Apify proxy.');
    }
    if (input.useFilters && input.propertyType !== 'none') {
        throw new Error('WRONG INPUT: Property type and filters cannot be used at the same time.');
    }

    if (input.startUrls && !Array.isArray(input.startUrls)) {
        throw new Error('WRONG INPUT: startUrls must an array!');
    }

    const daysInterval = checkDateGap(checkDate(input.checkIn), checkDate(input.checkOut));

    if (daysInterval >= 30) {
        log.warning(`=============
        The selected check-in and check-out dates have ${daysInterval} days between them.
        Some listings won't return available room information!

        Decrease the days interval to fix this
      =============`);
    } else if (daysInterval > 0) {
        log.info(`Using check-in / check-out with an interval of ${daysInterval} days`);
    } else if (daysInterval === -1 && !input.simple) {
        log.warning(`=============
        You aren't providing both check-in and checkout dates, some information will be missing from the output
      =============`);
    }
};

module.exports.cleanInput = (input) => {
    // Input Schema doesn't support floats yet
    if (input.minScore) {
        input.minScore = parseFloat(input.minScore);
    }
};

module.exports.evalExtendOutputFn = (input) => {
    let extendOutputFunction;
    if (typeof input.extendOutputFunction === 'string' && input.extendOutputFunction.trim() !== '') {
        try {
            // eslint-disable-next-line no-eval
            extendOutputFunction = eval(input.extendOutputFunction);
        } catch (e) {
            throw new Error(`'extendOutputFunction' is not valid Javascript! Error: ${e}`);
        }
        if (typeof extendOutputFunction !== 'function') {
            throw new Error('extendOutputFunction is not a function! Please fix it or use just default ouput!');
        }
    }
    return extendOutputFunction;
};