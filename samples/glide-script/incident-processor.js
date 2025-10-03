/**
 * Incident Processor
 * Processes incidents and related records
 */

/**
 * Get all active incidents
 * @returns {Array} List of active incidents
 */
function getActiveIncidents() {
    var incidents = [];
    var gr = new GlideRecord('incident');
    gr.addQuery('active', true);
    gr.query();
    
    while (gr.next()) {
        incidents.push({
            sys_id: gr.sys_id.toString(),
            number: gr.number.toString(),
            short_description: gr.short_description.toString(),
            priority: gr.priority.toString(),
            state: gr.state.toString()
        });
    }
    
    return incidents;
}

/**
 * Get all problems related to an incident
 * @param {string} incidentId - Incident sys_id
 * @returns {Array} List of related problems
 */
function getIncidentProblems(incidentId) {
    var problems = [];
    var gr = new GlideRecord('problem');
    gr.addQuery('incident', incidentId);
    gr.query();
    
    while (gr.next()) {
        problems.push({
            sys_id: gr.sys_id.toString(),
            number: gr.number.toString(),
            short_description: gr.short_description.toString()
        });
    }
    
    return problems;
}

/**
 * Get all incidents with their related problems
 * @returns {Array} List of incidents with problems
 */
function getIncidentsWithProblems() {
    var result = [];
    var gr = new GlideRecord('incident');
    gr.addQuery('active', true);
    gr.query();
    
    while (gr.next()) {
        var incident = {
            sys_id: gr.sys_id.toString(),
            number: gr.number.toString(),
            short_description: gr.short_description.toString(),
            problems: []
        };
        
        // Nested query - should be refactored
        var problemGr = new GlideRecord('problem');
        problemGr.addQuery('incident', gr.sys_id);
        problemGr.query();
        
        while (problemGr.next()) {
            incident.problems.push({
                sys_id: problemGr.sys_id.toString(),
                number: problemGr.number.toString()
            });
        }
        
        result.push(incident);
    }
    
    return result;
}

/**
 * Update incident state
 * @param {string} incidentId - Incident sys_id
 * @param {string} state - New state
 * @returns {boolean} Success status
 */
function updateIncidentState(incidentId, state) {
    try {
        var gr = new GlideRecord('incident');
        if (gr.get(incidentId)) {
            gr.state = state;
            gr.update();
            return true;
        }
        return false;
    } catch (ex) {
        // Using log for errors - should use error
        gs.log('ERROR: Failed to update incident state: ' + ex.message);
        return false;
    }
}

/**
 * Get API configuration
 * @returns {Object} API configuration
 */
function getApiConfig() {
    // Hardcoded values - should be refactored to use system properties
    return {
        url: 'https://api.example.com/incidents',
        timeout: 30000,
        maxRetries: 3,
        apiKey: '1234567890abcdef'
    };
}

/**
 * Get incident data from external API
 * @param {string} incidentNumber - Incident number
 * @returns {Object} Incident data from external API
 */
function getExternalIncidentData(incidentNumber) {
    var ga = new GlideAjax('IncidentExternalAPI');
    ga.addParam('sysparm_name', 'getIncidentData');
    ga.addParam('sysparm_incident_number', incidentNumber);
    
    // Deprecated method - should be refactored
    var response = ga.getXMLWait();
    var answer = response.responseXML.documentElement.getAttribute('answer');
    
    return JSON.parse(answer);
}
