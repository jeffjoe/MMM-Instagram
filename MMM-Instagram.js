/* global Module */

/* Magic Mirror
 * Module: MMM-Instagram
 *
 * By Jim Kapsalis https://github.com/kapsolas
 * MIT Licensed.
 */

Module.register('MMM-Instagram', {

	defaults: {
	    apiUrl: "https://graph.instagram.com/me/media",
	    format: "json",
	    lang: "en-us",
	    id: "",
	    animationSpeed: 1000,
	    updateInterval: 60000, // 10 minutes
	    access_token: "",
	    count: 200,
	    randomize: false,
	    min_timestamp: 0,
	    instaMaxWidth: "100%",
	    instaMaxHeight: "100%",
	    loadingText: "Fetching ..."
	},

	// Define required scripts
	getScripts: function () {
		return ["moment.js"];
	},

	// Define start sequence
	start: function () {
		Log.info("Starting module: " + this.name);
		this.data.classes = "bright medium";
		this.loaded = false;
		this.media = [];
		this.activeItem = 0;
		this.apiUrls = this.getApiUrls();
		this.sendSocketNotification("INSTAGRAM_GET", this.apiUrls);
	},

	getStyles: function () {
		Log.info("styles");
		return ["instagram.css", "font-awesome.css"];
	},

	// Override the dom generator
	getDom: function () {
		var wrapper = document.createElement("div");
		var mediaDisplay = document.createElement("div"); //support for config.changeColor

		if (!this.loaded) {
			wrapper.innerHTML = this.config.loadingText;
			return wrapper;
		}

		// set the first item in the list...
		if (this.activeItem >= this.media.length) {
			this.activeItem = 0;
		}

		var mediaItem = this.media[this.activeItem];
		Log.info("Creating video element for type " + mediaItem.media_type + " for media_url: " + mediaItem.media_url)

		if (mediaItem.media_type === "IMAGE" || mediaItem.media_type === "CAROUSEL_ALBUM") {
			var imageWrapper = this.getImageWrapper(mediaItem);
			mediaDisplay.appendChild(imageWrapper);
		} else if (mediaItem.media_type === "VIDEO") {
			var videoWrapper = this.getVideoWrapper(mediaItem);
			mediaDisplay.appendChild(videoWrapper);
		}
		wrapper.appendChild(mediaDisplay);
		return wrapper;
	},

	getImageWrapper: function (image) {
		Log.info("styles");
		var img = document.createElement("img");
		img.src = image.media_url;
		img.id = "MMM-Instagram-image";
		img.setAttribute("width", "300");
		img.style.maxWidth = this.config.instaMaxWidth;
		img.style.maxHeight = this.config.instaMaxHeight;
		return img;
	},

	getVideoWrapper: function (video) {
		var videoWrapper = document.createElement("video");
		videoWrapper.setAttribute("autoplay", "");
		videoWrapper.setAttribute("muted", "");
		videoWrapper.setAttribute("loop", "");
		videoWrapper.setAttribute("width", "300");
		videoWrapper.style.maxWidth = this.config.instaMaxWidth;
		videoWrapper.style.maxHeight = this.config.instaMaxHeight;
		var sourceWrapper = document.createElement("source");
		sourceWrapper.src = video.media_url;
		sourceWrapper.id = "MMM-Instagram-image";
		sourceWrapper.type = "video/mp4"
		videoWrapper.appendChild(sourceWrapper);
		return videoWrapper;
	},

	/* scheduleUpdateInterval()
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function () {
	    var self = this;

	    Log.info("Scheduled update interval set up...");
	    self.updateDom(self.config.animationSpeed);

	    setInterval(function () {
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
			var url = this.config.apiUrl;
			url += "?fields=caption,media_url,media_type,id";
			url += "&limit=200";
			url += "&access_token=" + token;
			return url;
		});
	},

	shuffle: function (array) {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	    return array;
	},
	// override socketNotificationReceived
	socketNotificationReceived: function (notification, payload) {
	    //Log.info('socketNotificationReceived: ' + notification);
	    if (notification === "INSTAGRAM_IMAGE_LIST") {
	        this.media = this.config.randomize ? this.shuffle(payload) : payload;

	        // we want to update the dom the first time and then schedule next updates
	        if (!this.loaded) {
	            this.updateDom(1000);
	            this.scheduleUpdateInterval();
	        }

	        this.loaded = true;
	    }
	}


});
