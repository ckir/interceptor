console.log("*** MONITOR STARTED ***");
const originalFetch = window.fetch.bind(window);
window.FG_CNN_FearAndGreed = arguments[0];
window.FG_GSLogger = arguments[1];
window.FG_HeartBeat = arguments[2];
// Call this to exit script
// e.g window.FG_Exit(true) or window.FG_Exit(false)
const FG_Exit = arguments[arguments.length - 1];
window.FG_lastValue = 0;

/**
 * Extends fetch functionality by adding retries and repeats for http codes other than 200
 * @param {function} fetchFunction the fetch function to use for requests
 * @param {string} url the url to fetch
 * @param {object} options the fetch options
 * @param {numeric} n the number of retries
 * @param {numeric} n miliseconds to wait beetwin requests
 * @private
 */
 async function fetch_retry(fetchFunction, url, options, n, wait = 1000) {
    return new Promise(async function(resolve, reject) {
        for (let index = 1; index <= n; index++) {
            console.log(`Attempt #${index} to fetch ${url}`);
            let response = await fetchFunction(url, options);
            if (!response.ok) {
                console.log(`Attempt ${index} to fetch ${url} failed with http status`, response.status);
            } else {
                console.log(`Attempt #${index} to fetch ${url} succeeded`);
                resolve(await response.text());
                break;
            }
            await new Promise(resolve => setTimeout(resolve, wait));
        }
        reject("All attempts failed");
    });
}

/**
 * Sends http get requests to httpwatchdog server
 * @param {function} fetchFunction the fetch function to use for requests
 * @param {numeric} httpwatchdogPort the port number of the httpwatchdog server
 * @param {numeric} pid pid of the process to be killed from the httpwatchdog server
 * @param {object} beatExtras optional the interval of the heartbit requests
 * @param {numeric} heartbeatInterval optional the interval of the heartbit requests
 * @private
 */
class HttpwatchdogClient {
    constructor(fetchFunction, httpwatchdogPort, pid, beatExtras = {}, heartbeatInterval = 10000) {
        this.fetchFuntion = fetchFunction;
        this.watchdogUrl = 'http://127.0.0.1:' + httpwatchdogPort;
        this.pid = pid;
        this.beatExtras = beatExtras;
        this.heartbeatInterval = heartbeatInterval;
        setInterval(this.beat.bind(this), this.heartbeatInterval);
        console.log("HeartBeat started", this.watchdogUrl, this.pid = pid, this.heartbeatInterval);
    }

    async beat() {
        const getParameters = {
            ts: new Date().toISOString(),
            pid: this.pid            
        }
        Object.keys(this.beatExtras).forEach(key => {
            getParameters[key] = this.beatExtras[key];
          });
        this.fetchFuntion(this.watchdogUrl + '?' + new URLSearchParams(getParameters)).then(function(response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        }).then(function(response) {
            console.log("Heartbeat ok");
        }).catch(function(error) {
            console.log("Heartbeat error", error);
        });
    }
}

/**
 * Posts log records to GSLogger
 * @param {function} fetchFunction the fetch function to use for requests
 * @param {string} appName the application name for loggs
 * @param {string} gsloggerurl the url of the GSLogger server
 * @private
 */
class GSLoggerClient {
    constructor(fetchFunction, appName, gsloggerurl) {
        this.fetchFunction = fetchFunction;
        this.appName = appName;
        this.gsLogger = gsloggerurl;
        this.DEBUG = 10;
        this.INFO = 20;
        this.WARNING = 30;
        this.ERROR = 40;
        this.CRITICAL = 50;
    }

    GSLog(logLevel, logNotify, logMessage, logExtras = null) {
        const logRecord = {
            appName: this.appName,
            logLevel: logLevel,
            logNotify: logNotify,
            logMessage: logMessage
        };
        if (logExtras) {
            logRecord["logExtras"] = logExtras;
        }

        const options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logRecord)
        };

        fetch_retry(this.fetchFunction, this.gsLogger, options, 2, 5000)
        .then(function (result) {console.log("Log recorded", result);})
        .catch(function (err) {console.log("Log NOT recorded", err);});
    }

}

/**
 * Posts log records to GSLogger
 * @param {function} fetchFunction the fetch function to use for requests
 * @param {string} appName the application name for loggs
 * @param {string} gsloggerurl the url of the GSLogger server
 * @private
 */

class CNN_FearAndGreed_Poster {
    constructor(fetchFunction, appName, fearandgreedurl, gsloggerurl) {
        this.fetchFunction = fetchFunction;
        this.appName = appName;
        this.fearandgreedurl = fearandgreedurl;
        this.gsLogger = new GSLoggerClient(this.fetchFunction, appName, gsloggerurl);
        this.OAuthToken = null;
        this.getOAuthToken();
        // Access token is valid for 1 hour. We renew it every half hour
        this.loadingTimer = setInterval(this.getOAuthToken.bind(this), 1800000);
    }

    getOAuthToken() {
        const options = {
            method: 'GET',
            redirect: 'follow'
        };

        const getOAuthTokenurl = this.fearandgreedurl + "?getOAuthToken=1";
        console.log("Retrieving OAuthToken");
        this.OAuthTokenjson = fetch_retry(this.fetchFunction, getOAuthTokenurl, options, 5, 5000)
            .then(response => response)
            .then(result => {
                this.OAuthToken = JSON.parse(result).getOAuthToken;
                console.log("Retrieved OAuthToken");
            })
            .catch(error => console.log('error', error));
    }

    async GSPost(payload) {
        // Wait until there is an OAuthToken so we can make the post
        while (! this.OAuthToken) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("Waiting for OAuthToken");
        }

        const options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'redirect': 'follow',
                'Authorization': 'Bearer ' + this.OAuthToken
            },
            body: JSON.stringify(payload)
        };

        fetch_retry(this.fetchFunction, this.fearandgreedurl, options, 2, 5000)
            .then((response) => {
                console.log("Post to CNN_FearAndGreed succeeded", response);
            })
            .catch((error) => {
                console.error('Post to CNN_FearAndGreed failed', error);
            })

    }

}

const logger = new GSLoggerClient(originalFetch, "FearAndGreed_Monitor", window.FG_GSLogger);
const heartbeat = new HttpwatchdogClient(originalFetch, window.FG_HeartBeat['port'], window.FG_HeartBeat['pid'], window.FG_HeartBeat['heartbeatinterval']);

function FG_ScriptExit(){
    console.log( "No data recieved for 5 minutes. Exiting in 5 sec");
    logger.GSLog(50, 0, "No data recieved for 5 minutes");
    async function FG_ScriptExitAsync() {
        await new Promise(resolve => setTimeout(resolve, 5000));
        FG_Exit("No data recieved for 5 minutes");
    }
    FG_ScriptExitAsync();
}

const post = new CNN_FearAndGreed_Poster(originalFetch, "FearAndGreed_Monitor", window.FG_CNN_FearAndGreed, window.FG_GSLogger);
window.FG_NoDataTimeout = setTimeout(FG_ScriptExit, 5 * 60 * 1000);

const {fetch: origFetch} = window;
window.fetch = async(...args) => {
    //   console.log("fetch called with args:", args);
    const response = await origFetch(...args);

    /* work with the cloned response in a separate promise
       chain -- could use the same chain with `await`. */
    response
        .clone()
        .text()
        .then(body => {
            console.log('[' + new Date().toISOString().slice(11, -5) + ']', "intercepted response");
            try {
                const jsonbody = JSON.parse(body);
                body = jsonbody;
                // if (body.hasOwnProperty('ts')) {
                //     console.log('[' + new Date().toISOString().slice(11, -5) + ']', "Deleting ", body['ts']);
                //     delete window.FG_dataOjects[body['ts']]
                // }
                if (body.hasOwnProperty('fear_and_greed')) {
                    clearTimeout(FG_NoDataTimeout);
                    FG_NoDataTimeout = setTimeout(FG_ScriptExit, 5 * 60 * 1000);
                    let score = Math.trunc(body.fear_and_greed.score);
                    if (window.FG_lastValue !== score) {
                        console.log('[' + new Date().toISOString().slice(11, -5) + ']', "****** Value Change from ", window.FG_lastValue, " to ", score);
                        window.FG_lastValue = score;
                        post.GSPost(body);
                    } else {
                        console.log('[' + new Date().toISOString().slice(11, -5) + ']', "****** Score not changed ", score);
                    }
                }
            } catch (error) {
                console.log("Invalid JSON");
            }

        });
    // .catch(err => console.error(err));

    /* the original response can be resolved unmodified: */
    return response;
};

//debugger;

// fetch_retry(originalFetch, "https://httpstat.us/503", {}, 2, 4000)
// .then(function (result) {console.log("Result", result);})
// .catch(function (err) {console.log("Error", err);});

// // const hb =  new HttpwatchdogClient(originalFetch, 9999, 99999999, {e1:"a", e2:0}, 20000);
const u = "https://script.google.com/macros/s/AKfycbyw--s4_JGb6Cri38oJwuLVea0-uptuASHKrToKbQlyVdOAH--faSeY5DfLprYMYNSGZA/exec";
// const logger = new GSLoggerClient(originalFetch, "Interceptor.js", u);
// logger.GSLog(10, 0, "Log message");

// const f = "https://script.google.com/macros/s/AKfycbwbN-NBmazuxiLwnVdUYXX66FtbV2HefP5pMtnw724ekA1DlyTsltS-_rH0k5Chs_z7/exec";
// const p = new CNN_FearAndGreed_Poster(originalFetch, "CNN_FearAndGreed_Poster", f, u);
// const z = p.GSPost(testdata());

// function testdata() {
//     return {
//         fear_and_greed: {
//             score: 100.895697074,
//             rating: "neutral",
//             timestamp: "2022-08-13T00:00:28.767000+00:00",
//             previous_close: 54.895697074,
//             previous_1_week: 49.5205966724,
//             previous_1_month: 23.4270797475571,
//             previous_1_year: 41.4333333333333
//         },
//         fear_and_greed_historical: {
//             timestamp: 1660348828767,
//             score: 54.895697074,
//             rating: "neutral",
//             data: [{
//                 x: 1660348828767,
//                 y: 54.895697074,
//                 rating: "neutral"
//             }]
//         },
//         market_momentum_sp500: {
//             timestamp: 1660348826765,
//             score: 32.2,
//             rating: "fear",
//             data: [{
//                 x: 1660348826765,
//                 y: 4280.15,
//                 rating: "extreme greed"
//             }]
//         },
//         market_momentum_sp125: {
//             timestamp: 1660348826765,
//             score: 32.2,
//             rating: "fear",
//             data: [{
//                 x: 1660348826765,
//                 y: 4149.37904,
//                 rating: "extreme greed"
//             }]
//         },
//         stock_price_strength: {
//             timestamp: 1660348826811,
//             score: 100.3694779116,
//             rating: "extreme greed",
//             data: [{
//                 x: 1660348826811,
//                 y: -0.268188994665897,
//                 rating: "extreme fear"
//             }]
//         },
//         stock_price_breadth: {
//             timestamp: 1660348826792,
//             score: 25.1004016064,
//             rating: "fear",
//             data: [{
//                 x: 1660348826792,
//                 y: -1603.96594004459,
//                 rating: "extreme fear"
//             }]
//         },
//         put_call_options: {
//             timestamp: 1660338497794,
//             score: 77.2,
//             rating: "extreme greed",
//             data: [{
//                 x: 1660338497794,
//                 y: 0.769680390576059,
//                 rating: "extreme fear"
//             }]
//         },
//         market_volatility_vix: {
//             timestamp: 1660336278763,
//             score: 50,
//             rating: "neutral",
//             data: [{
//                 x: 1660336278763,
//                 y: 19.53,
//                 rating: "extreme fear"
//             }]
//         },
//         market_volatility_vix_50: {
//             timestamp: 1660336278763,
//             score: 50,
//             rating: "neutral",
//             data: [{
//                 x: 1660336278763,
//                 y: 25.5398,
//                 rating: "fear"
//             }]
//         },
//         junk_bond_demand: {
//             timestamp: 1660345465789,
//             score: 24.4,
//             rating: "extreme fear",
//             data: [{
//                 x: 1660345465789,
//                 y: 1.86065740902391,
//                 rating: "extreme fear"
//             }]
//         },
//         safe_haven_demand: {
//             timestamp: 1660334408791,
//             score: 83,
//             rating: "extreme greed",
//             data: [{
//                 x: 1660334408791,
//                 y: 1.4451591006658,
//                 rating: "extreme fear"
//             }]
//         }
//     }
// }
