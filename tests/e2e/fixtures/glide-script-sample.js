/**
 * Sample GlideScript file with issues for testing
 */

// Nested query issue
function getIncidentProblems() {
  var incidents = [];
  var gr1 = new GlideRecord('incident');
  gr1.addQuery('active', true);
  gr1.query();
  
  while (gr1.next()) {
    var incident = {
      sys_id: gr1.sys_id.toString(),
      number: gr1.number.toString(),
      problems: []
    };
    
    // Nested query - should be refactored
    var gr2 = new GlideRecord('problem');
    gr2.addQuery('incident', gr1.sys_id);
    gr2.query();
    
    while (gr2.next()) {
      incident.problems.push({
        sys_id: gr2.sys_id.toString(),
        number: gr2.number.toString()
      });
    }
    
    incidents.push(incident);
  }
  
  return incidents;
}

// Query without conditions
function getAllUsers() {
  var users = [];
  var gr = new GlideRecord('sys_user');
  // Missing query conditions - should be refactored
  gr.query();
  
  while (gr.next()) {
    users.push({
      sys_id: gr.sys_id.toString(),
      name: gr.name.toString()
    });
  }
  
  return users;
}

// Deprecated GlideAjax usage
function getDataFromServer() {
  var ga = new GlideAjax('MyAjaxProcessor');
  ga.addParam('sysparm_name', 'getRecords');
  
  // Deprecated method - should be refactored
  var response = ga.getXMLWait();
  var answer = response.responseXML.documentElement.getAttribute('answer');
  
  return JSON.parse(answer);
}

// Log used for errors
function processRecord(record) {
  try {
    // Process record
    return true;
  } catch (ex) {
    // Using log for errors - should be refactored
    gs.log('ERROR: Failed to process record: ' + ex.message);
    return false;
  }
}

// Hardcoded values
function getApiConfig() {
  return {
    // Hardcoded values - should be refactored
    url: 'https://api.example.com',
    timeout: 30000,
    maxRetries: 3
  };
}
