/* global Module */

/* MMM-CollegeFootballTop25.js
 * 
 * Magic Mirror
 * Module: MMM-CollegeFootballTop25
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-CollegeFootballTop25 By Adam Moses http://adammoses.com
 * MIT Licensed.
 */

Module.register("MMM-CollegeFootballTop25", {
	// setup the default config options
	defaults: {
		// all config options are optional
		headerText: 'College Football Top 25 Teams',
		teamsToShowAtATime: 25,
		// possible columns: 
		// 'rank', 'name', 'conference', 
		// 'record', 'previous_rank', 'rank_change', 'points'
		columnOrder: ['rank', 'name', 'record', 'rank_change'],
		showPollWeekAndDate: true,
		showColumnHeaders: true,
		textClass: 'xsmall',
		colorRankChange: 'true',
		maxTeamNameLength: 16,
		maxConferenceNameLength: 10,
        onScreenRefreshRate: 6000,
		animationSpeed: 3000,
		highlightTeams: [ ]
	},
	// the start function
	start: function() {
		// log starting
		Log.info("Starting module: " + this.name);
		// set refresh rate to 6 hours
		this.config.refreshRate = 6 * 60 * 60 * 1000;
        // set an identier config tag
		this.config.identifier = this.identifier;
		if (this.config.teamsToShowAtATime > 25) this.config.teamsToShowAtATime = 25;
		// set loaded, error, and the update to init values
		this.loaded = false;
		this.errorMessage = null;
		// set the header to this place
        if (this.config.headerText !== '') {  
            this.data.header = this.config.headerText;
        }
        // add this config to the helper functions
		this.sendSocketNotification('COLLEGE_FOOTBALL_REGISTER_CONFIG', this.config);
	},
	// the socket handler
	socketNotificationReceived: function(notification, payload) {
		// if an update was received
		if (notification === "COLLEGE_FOOTBALL_UPDATE") {
			// check this is for this module based on the woeid
			if (payload.identifier === this.identifier) {
				// set loaded flag, set the update, and call update dom                
				this.pollData = payload.pollData;
				// current index of shown team
				this.teamStep = 0;
                this.loaded = true;
				this.updateDom(this.config.animationSpeed);
				// if less than 25 teams at a time, enable referesh cycles
				if (this.config.teamsToShowAtATime < 25) {
					var self = this;
					this.updateTimer = setInterval(
							function() { self.updateDom(self.config.animationSpeed); }, 
											this.config.onScreenRefreshRate );				
				}
			}
		}
        // if sent error notice
        if (notification === "COLLEGE_FOOTBALL_UPDATE_ERRORS") {
            this.errorMessage("There was an error.");
            if (this.updateTimer !== null)
                clearTimeout(this.updateTimer);
            this.updateTimer = null;
            this.updateDom();
        }
	},
	// shortens a string to a max-length and appends '...' if longer than a specified length
	truncateString: function(theString, theLength) {
		if (theString.length > theLength)
			return theString.slice(0, theLength) + '...';
		else
			return theString;
	},
	// checks if team is meant to be highlighted, if so return the configured color
	getColorValue: function(theTeamName) {
		var returnVal = null;
		for (var cIndex = 0; cIndex < this.config.highlightTeams.length; cIndex++) {
			var cHighlight = this.config.highlightTeams[cIndex].split("::");
			var cTeamName = cHighlight[0];
			var cColor = cHighlight[1];
			if (theTeamName.trim().toLowerCase() === cTeamName.trim().toLowerCase())
				return cColor;
		}
		return returnVal;			
	},
	// the get dom handler
	getDom: function() {
        // if an error, say so
        if (this.errorMessage !== null) {
            var wrapper = document.createElement("div");
			wrapper.className = "small";
			wrapper.innerHTML = this.errorMessage;
			return wrapper;	
        }
		// if nothing loaded yet, put in placeholder text
		if (!this.loaded) {
			var wrapper = document.createElement("div");
			wrapper.className = "small";
			wrapper.innerHTML = "Awaiting Update...";
			return wrapper;			
		}
		// otherwise, build the table
		// set the row class value to the config option
		var rowSize = this.config.textClass;
		// create return wrapper
		var wrapper = document.createElement("table");
		// create a list to store generated rows		
        var allRows = [ ];
		// create a local copy of the configured columns
		var columns = this.config.columnOrder;
		// create a row for the header
		var headerRow = document.createElement("tr");
		headerRow.className = rowSize;
		// counter for valid columns specified
		var validColumnCount = 0;
		// iterate through each configured column in order
		for (var cColumn = 0;
				cColumn < columns.length;
				cColumn++) {
			// create a TD element to add the column to
			var cTD = document.createElement("td");
			cTD.align = "right";
			var cHTML = '';
			var validColumn = true;
			// check the name, if found set HTML
			switch (columns[cColumn]) {
				case 'rank':
					cHTML = "RK";
					break;
				case 'name':
					cHTML = "TEAM";
					cTD.align = 'left';					
					break;		
				case 'conference':
					cHTML = "CONF";
					cTD.align = 'left';					
					break;	
				case 'record':
					cHTML = "W-L";
					break;								
				case 'rank_previous':
					cHTML = "PREV"
					break;	
				case 'rank_change':
					cHTML = 'CHNG';
					break;
				case 'points':
					cHTML = "PTS";
					break;		
				// if not one of the above, column is not valid
				default:
					validColumn = false;
					break;
			}
			// if valid column, increase count and add HTML and TD
			if (validColumn) {
				validColumnCount++;
				cTD.innerHTML = "&nbsp;&nbsp;" + cHTML;
				headerRow.appendChild(cTD);					
			}			
		}		
		// if configuredc to have a column header, add row
		if (this.config.showColumnHeaders)
			allRows.push(headerRow);
		// start team to show index at current step value and config option
		var startAt = this.teamStep * this.config.teamsToShowAtATime;
		// end at the value of number of teams to show
		var endAt = startAt + this.config.teamsToShowAtATime;
		// if greater than 25, reset step value
		if (endAt >= 25)
			this.teamStep = 0
		// otherwise increase step value
		else
			this.teamStep++;
		// iterate through teams at start index to end index
		for (var cIndex = startAt;
				cIndex < this.pollData.ranks.length && cIndex < endAt;
				cIndex++) {
			// get data for current team
			var rankData = this.pollData.ranks[cIndex];
			var rankRow = document.createElement("tr");
			rankRow.className = rowSize;			
			// iterate through column values
			for (var cColumn = 0;
					cColumn < columns.length;
					cColumn++) {
				var cTD = document.createElement("td");
				cTD.align = "right";				
				var cHTML = '';
				var validColumn = true;
				// for each column value, get that date value
				switch (columns[cColumn]) {
					case 'rank':
						cHTML = rankData.rank_position;
						break;
					case 'name':
						cHTML = this.truncateString(rankData.team_name, this.config.maxTeamNameLength);
						cTD.align = 'left';
						break;	
					case 'conference':
						cHTML = this.truncateString(rankData.team_conference, this.config.maxConferenceNameLength);
						cTD.align = 'left';
						break;							
					case 'record':
						cHTML = rankData.record_wins + '-' + rankData.record_losses;
						break;							
					case 'rank_previous':
						// value is empty unless a previous value was found
						cHTML = '&nbsp;';
						if (rankData.rank_previous > 0)
							cHTML = rankData.rank_previous;
						break;	
					case 'rank_change':
						var changeVal = rankData.rank_change;
						cHTML = '&nbsp;';	
						// &#8593; = (↑)   
						// &#8595; = (↓)							
						// if value is greater than zero, prepend an up arrow
						if (changeVal > 0)
							cHTML = '&#8593;' + changeVal; 
						// if value is less than zero, prepend a down arrow
						else if (changeVal < 0)
							cHTML = '&#8595;' + Math.abs(changeVal);						
						break;
					case 'points':
						cHTML = rankData.votes_points;
						break;						
					default:
						validColumn = false;
						break;
				}
				// if valid column add the TD
				if (validColumn) {
					cTD.innerHTML = "&nbsp;&nbsp;" + cHTML;
					var colorValue = this.getColorValue(rankData.team_name);
					if (colorValue) cTD.style =  "color:" + colorValue;
					rankRow.appendChild(cTD);					
				}			
			}
			// add to all rows to be shown
			allRows.push(rankRow);
		}
		// if extra consistent spacing rows are needed, add them
		if (endAt - 25 > 0) {
			for (var cIndex = 0; cIndex < endAt - 25; cIndex++) {	
				var blankRow = document.createElement("tr");
				blankRow.className = rowSize;		
				var blankTD = document.createElement("td");
				blankTD.colSpan = validColumnCount;
				blankTD.innerHTML = '&nbsp;';
				blankRow.appendChild(blankTD);
				allRows.push(blankRow);
			}
		}
		// if the season week or poll date are configed to be shown, append them to the bottom
		if (this.config.showPollWeekAndDate) {
			var pollInfoString = this.pollData.weekName + ' - ' + this.pollData.pollDate;
			var pollInfoRow = document.createElement("tr");
			pollInfoRow.className = rowSize;		
			var pollInfoTD = document.createElement("td");
			pollInfoTD.colSpan = validColumnCount;
			pollInfoTD.align = "right";
			pollInfoTD.innerHTML = pollInfoString;
			pollInfoRow.appendChild(pollInfoTD);
			allRows.push(pollInfoRow);			
		}
        // add all rows to the return table wrapper
		for (var cIndex = 0; cIndex < allRows.length; cIndex++) {
			wrapper.appendChild(allRows[cIndex]);
		}
        // return table wrapper
		return wrapper;	
	}
});

// ------------ end -------------
