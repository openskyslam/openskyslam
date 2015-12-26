var CLIENT_ID = "a93dfcee57b64124adc5fbc10181a7d0";
var TAG = "openskyslam";

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
        jsonp("https://api.instagram.com/v1/tags/" + TAG + "/media/recent?client_id=" + CLIENT_ID + "&count=16", function(err, res) {
            if (err) {
                return callback(err);
            }

            callback(null, res);

            if (res && res.data && res.data.length) {
                // Cache the response
                try {
                    window.localStorage.setItem("instagram-photos", JSON.stringify({
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
        cached = JSON.parse(window.localStorage.getItem("instagram-photos"));
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
                    window.localStorage.deleteItem("instagram-photos");
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
    var stream = document.getElementById("instagram-stream"),
        fragment;

    if (err) {
        return;
    }

    if (res.data.length === 0) {
        return;
    }

    fragment = document.createDocumentFragment();

    res.data.forEach(function(p) {
        var link = document.createElement("a"),
            url;

        link.className = "instagram-stream-photo";
        link.target = "_blank";
        link.href = p.link;

        if (window.devicePixelRatio > 1) {
            if (window.screen.width <= 360) {
                url = p.images.low_resolution.url;
            } else {
                url = p.images.standard_resolution.url;
            }
        } else {
            if (window.screen.width <= 360) {
                url = p.images.thumbnail.url;
            } else {
                url = p.images.low_resolution.url;
            }
        }

        link.style.cssText = "background-image: url(" + url + ")";

        fragment.appendChild(link);
    });

    stream.innerHTML = "";
    stream.appendChild(fragment);
}

instagram(function(err, res) {
    if (document.readyState === "complete") {
        loadPhotos(err, res);
    } else {
        document.onreadystatechange = function() {
            if (document.readyState === "complete") {
                loadPhotos(err, res);
            }
        };
    }
});
