/* global Module */

/* node_helper.js
 * 
 * Magic Mirror
 * Module: MMM-RottenTomatoes
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-RottenTomatoes By Adam Moses http://adammoses.com
 * MIT Licensed.
 */

// call in the required classes
var APTOP25 = require("ap-top25-ncaaf");

// the main module helper create
module.exports = NodeHelper.create({
    // subclass start method, clears the initial config array
    start: function() {
        this.moduleConfigs = [];
        this.timers = [];
        this.errorCount = 0;
        // this value controls number of calls fails before giving up
        this.errorFailLimit = 10;
    },
    // subclass socketNotificationReceived, received notification from module
    socketNotificationReceived: function(notification, payload) {
        if (notification === "COLLEGE_FOOTBALL_REGISTER_CONFIG") {              
            // add the current config to an array of all configs used by the helper
            this.moduleConfigs[this.moduleConfigs.length] = payload;
            // this to self
            var self = this;     
            // call the initial update now
            this.updatePollData(payload);
            // schedule the updates
            this.timers[this.timers.length] = setInterval(
                function() { self.updatePollData(payload); }, payload.refreshRate);
        }
    },
    // increment error count, if passed limit send notice to module and stop updates
    processError: function() {
        this.errorCount += 1;
        if (this.errorCount >= this.errorFailLimit)
        {
            this.sendSocketNotification('COLLEGE_FOOTBALL_UPDATE_ERRORS', {} );
            for (var cIndex = 0; cIndex < this.timers.length; cIndex++)
                clearTimeout(this.timers[cIndex]);
            this.timers = [];
        }
    },    
    // main helper function to get the rotten tomatoes information
    updatePollData: function(theConfig) { 
        // this to self
        var self = this;
        // otherwise get a named list
        APTOP25.getAPTop25NCAAFRankingsData( function(error, data) {
            if (!error) {
                var returnPayload = {identifier: theConfig.identifier
                						, pollData: data};
                self.sendSocketNotification('COLLEGE_FOOTBALL_UPDATE', returnPayload );
            }
            else {
                this.processError();
            }
        });
    },      
});

//------------ end -------------
