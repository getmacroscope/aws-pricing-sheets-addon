function analyticsWrapper(args, callback) {
  try { credentials } catch(err) { return callback(); }
  if(!cfg.logCustomFunctionToAnalytics ||
     !credentials.measurement_id_analytics || 
     !credentials.api_secret_analytics) {
     return callback();
  }

  const startTime = Date.now();
  const result = callback();
  const options = {
    funcName: args.callee.name, 
    args: [...args], 
    timeExecution: Date.now() - startTime,
    email: getUserEmail(),
    userLocale: getUserLocale(),
    scriptTimeZone: Session.getScriptTimeZone()
  };
  validateAndSendToGoogleAnalytics(options);
  return result;
}

function getUserEmail() {
  return PropertiesService.getUserProperties().getProperty('emailUser')
    || "Unknown email";
}

function getUserLocale() {
  return PropertiesService.getUserProperties().getProperty('userLocale')
    || "Unknown locale";
}

function validateAndSendToGoogleAnalytics(options) {
  options.debug = true;
  const test = sendToGoogleAnalytics(options);
  if(test?.response?.validationMessages?.length > 0)
    throw test.response.validationMessages.map(x => JSON.stringify(x)).join(". ");
  
  options.debug = false;
  return sendToGoogleAnalytics(options);
}

// if debug is true, it will send the data to the debug endpoint
// that debug endpoint returns 
function sendToGoogleAnalytics(parameters) {
  const {funcName, args, timeExecution, debug, email, userLocale, scriptTimeZone} = parameters;

  const argumentsWithCommas = args.join(", ");
  const fullFunction = funcName + "(" + argumentsWithCommas + ")";

  const emailFormattedForEventName = email
    .replace(/@/g, "_at_") // event name can't have @
    .replace(/\./g, "_dot_") // event name can't have .
    .replace(/[^\w]/g, "") // event name should be alphanumeric
    .slice(0,44); // max size event name is 44 chars

  const data = {
      "client_id": email,
      "user_id": email,
      "events": [
        {
          "name": emailFormattedForEventName,
          "params": {
            timeExecution,
            "session_id": Date.now(),
            userLocale,
            scriptTimeZone,
            email,
            functionName: funcName,
            "fullFunction": fullFunction + " " + timeExecution + "ms",
          }
        }
      ]
    };

  const options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };
  const analyticsUrl = `https://www.google-analytics.com/${debug?"debug/":""}mp/collect?measurement_id=${credentials.measurement_id_analytics}&api_secret=${credentials.api_secret_analytics}`;
  const response = UrlFetchApp.fetch(analyticsUrl, options);
  
  let result = { code: response.getResponseCode() };
  try { 
    result.response = JSON.parse(response.getContentText())
  } catch(err) {}

  return result;
}