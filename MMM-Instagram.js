/* global Module */

/* Magic Mirror
 * Module: MMM-Instagram
 *
 * By Jim Kapsalis https://github.com/kapsolas
 * MIT Licensed.
 */

Module.register('MMM-Instagram', {

    defaults: {
        apiUrl: 'https://api.instagram.com/v1/users/self/media/recent',
        format: 'json',
        lang: 'en-us',
        id: '',
        animationSpeed: 1000,
        updateInterval: 60000, // 10 minutes
        access_token: '',
        count: 200,
        min_timestamp: 0,
        instaMaxWidth: '100%',
        instaMaxHeight: '100%',
        loadingText: 'Loading...'
    },

    // Define required scripts
    getScripts: function() {
        return ["moment.js"];
    },

    // Define start sequence
    start: function() {
        Log.info('Starting module: ' + this.name);
        this.data.classes = 'bright medium';
        this.loaded = false;
        this.images = {};
        this.activeItem = 0;
        this.apiUrls = this.getApiUrls();
        this.sendSocketNotification("INSTAGRAM_GET", this.apiUrls);
    },

    getStyles: function() {
        return ['instagram.css', 'font-awesome.css'];
    },

    // Override the dom generator
    getDom: function() {
        var wrapper = document.createElement("div");
        var imageDisplay = document.createElement('div'); //support for config.changeColor

        if (!this.loaded) {
            wrapper.innerHTML = this.config.loadingText;
            return wrapper;
        }

        // set the first item in the list...
        if (this.activeItem >= this.images.photo.length) {
            this.activeItem = 0;
        }

        var tempImage = this.images.photo[this.activeItem];

        var imageWrapper = document.createElement("img");
  	    imageWrapper.src = tempImage.photolink;
  	    imageWrapper.id = "MMM-Instagram-image";
  	    imageWrapper.style.maxWidth = this.config.instaMaxWidth;
  	    imageWrapper.style.maxHeight = this.config.instaMaxHeight;
  	    imageDisplay.appendChild(imageWrapper);

	      wrapper.appendChild(imageDisplay);

        return wrapper;
    },

    /* scheduleUpdateInterval()
     * Schedule visual update.
     */
    scheduleUpdateInterval: function() {
        var self = this;

        Log.info("Scheduled update interval set up...");
        self.updateDom(self.config.animationSpeed);

        setInterval(function() {
            Log.info("incrementing the activeItem and refreshing");
            self.activeItem++;
            self.updateDom(self.config.animationSpeed);
        }, this.config.updateInterval);
    },

    /*
     * getApiUrls()
     * returns the query strings required for the request to instagram to get the
     * photo streams of the users requested
     */
    getApiUrls: function() {
        var tokens = this.config.access_token || this.config.access_tokens; //default for backwards compatibility
        if(!Array.isArray(tokens)){
          tokens = [tokens];
        }
        return tokens.map(token => {
          var url = this.config.apiUrl + '?';
          url += 'count=' + this.config.count;
          url += '&min_timestamp=' + this.config.min_timestamp;
          url += '&access_token=' + token;
          return url;
        });
    },

    // override socketNotificationReceived
    socketNotificationReceived: function(notification, payload) {
        //Log.info('socketNotificationReceived: ' + notification);
        if (notification === 'INSTAGRAM_IMAGE_LIST')
        {
            this.images = payload;

            // we want to update the dom the first time and then schedule next updates
            if (!this.loaded) {
              this.updateDom(1000);
              this.scheduleUpdateInterval();
            }

            this.loaded = true;
        }
    }

});
