var CLIENT_ID = "a93dfcee57b64124adc5fbc10181a7d0",
    TAG = "openskyslam",
    NUM_PHOTOS = 16,
    STORAGE_KEY = "instagram-photos-" + TAG + "-" + NUM_PHOTOS,
    PHOTOS_CONTAINER_ID = "instagram-stream";

function jsonp(url, cb) {
    var callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());

    var script = document.createElement("script");

    window[callbackName] = function(data) {
        delete window[callbackName];

        document.body.removeChild(script);

        cb(null, data);
    };

    script.src = url + (url.indexOf("?") > -1 ? "&" : "?") + "callback=" + callbackName;

    script.onerror = function() {
        cb(new Error("Failed to load script"));
    };

    document.body.appendChild(script);
}

function instagram(cb) {
    var cached, timestamp;

    function getPhotos(callback) {
        jsonp("https://api.instagram.com/v1/tags/" + TAG + "/media/recent?client_id=" + CLIENT_ID + "&count=" + NUM_PHOTOS, function(err, res) {
            if (err) {
                return callback(err);
            }

            callback(null, res);

            if (res && res.data && res.data.length) {
                // Cache the response
                try {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        response: res,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    // Failed to cache data
                }
            }
        });
    }

    try {
        cached = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    } catch (e) {
        // We don't have any cached data
    }

    if (cached) {
        timestamp = parseInt(cached.timestamp, 10);

        if (cached.response && cached.response.data && cached.response.data.length) {
            // Return cached data
            cb(null, cached.response);

            if (isNaN(timestamp) || Date.now() - timestamp > 3600000) {
                // It's been over an hour
                try {
                    window.localStorage.deleteItem(STORAGE_KEY);
                } catch (e) {
                    // Failed to clear data
                }

                // Fetch data again
                getPhotos(function() {});
            }

            return;
        }
    }

    getPhotos(cb);
}

// Load instagram photos
function loadPhotos(err, res) {
    var stream,
        screenWidth,
        pixelRatio,
        fragment;

    if (err) {
        return;
    }

    if (res.data.length === 0) {
        return;
    }

    stream = document.getElementById(PHOTOS_CONTAINER_ID);
    screenWidth = window.screen.width;
    pixelRatio = window.devicePixelRatio;
    fragment = document.createDocumentFragment();

    res.data.forEach(function(p) {
        var link = document.createElement("a"),
            url;

        link.target = "_blank";
        link.href = p.link;

        if (pixelRatio > 1) {
            if (screenWidth > 640) {
                url = p.images.standard_resolution.url;
            } else {
                url = p.images.low_resolution.url;
            }
        } else {
            if (screenWidth > 960) {
                url = p.images.standard_resolution.url;
            } else if (screenWidth > 640) {
                url = p.images.low_resolution.url;
            } else {
                url = p.images.thumbnail.url;
            }
        }

        link.style.backgroundImage = "url(" + url + ")";

        fragment.appendChild(link);
    });

    stream.innerHTML = "";
    stream.appendChild(fragment);
}

// Call the callback on document ready
function onDOMReady(cb) {
    if (document.readyState === "complete") {
        cb();
    } else {
        document.onreadystatechange = function() {
            if (document.readyState === "complete") {
                cb();
            }
        };
    }
}

onDOMReady(function() {
    instagram(loadPhotos);
});
