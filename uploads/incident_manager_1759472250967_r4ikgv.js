/**
 * Incident Manager
 * Manages incidents and related records in ServiceNow
 */

/**
 * Get all incidents assigned to a user
 * @param {string} userId - User sys_id
 * @returns {Array} List of incidents
 */
function getIncidentsForUser(userId) {
    // Missing condition validation
    var gr = new GlideRecord('incident');
    gr.addQuery('assigned_to', userId);
    gr.query();
    
    var incidents = [];
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
 * Get incident details with related records
 * @param {string} incidentId - Incident sys_id
 * @returns {Object} Incident details with related records
 */
function getIncidentDetails(incidentId) {
    var gr = new GlideRecord('incident');
    if (!gr.get(incidentId)) {
        return null;
    }
    
    var incident = {
        sys_id: gr.sys_id.toString(),
        number: gr.number.toString(),
        short_description: gr.short_description.toString(),
        description: gr.description.toString(),
        priority: gr.priority.toString(),
        state: gr.state.toString(),
        assigned_to: gr.assigned_to.toString(),
        caller_id: gr.caller_id.toString(),
        created_on: gr.created_on.toString(),
        updated_on: gr.updated_on.toString(),
        comments: [],
        tasks: [],
        attachments: []
    };
    
    // ISSUE: Nested query for comments
    var commentGr = new GlideRecord('sys_journal_field');
    commentGr.addQuery('element_id', incidentId);
    commentGr.addQuery('element', 'incident');
    commentGr.orderBy('sys_created_on');
    commentGr.query();
    
    while (commentGr.next()) {
        incident.comments.push({
            sys_id: commentGr.sys_id.toString(),
            value: commentGr.value.toString(),
            created_by: commentGr.sys_created_by.toString(),
            created_on: commentGr.sys_created_on.toString()
        });
    }
    
    // ISSUE: Nested query for tasks
    var taskGr = new GlideRecord('task');
    taskGr.addQuery('parent', incidentId);
    taskGr.query();
    
    while (taskGr.next()) {
        incident.tasks.push({
            sys_id: taskGr.sys_id.toString(),
            number: taskGr.number.toString(),
            short_description: taskGr.short_description.toString(),
            state: taskGr.state.toString()
        });
    }
    
    // ISSUE: Nested query for attachments
    var attachGr = new GlideRecord('sys_attachment');
    attachGr.addQuery('table_name', 'incident');
    attachGr.addQuery('table_sys_id', incidentId);
    attachGr.query();
    
    while (attachGr.next()) {
        incident.attachments.push({
            sys_id: attachGr.sys_id.toString(),
            file_name: attachGr.file_name.toString(),
            size_bytes: attachGr.size_bytes.toString(),
            content_type: attachGr.content_type.toString()
        });
    }
    
    return incident;
}

/**
 * Update incident state
 * @param {string} incidentId - Incident sys_id
 * @param {string} state - New state
 * @param {string} comment - Comment to add
 * @returns {boolean} Success status
 */
function updateIncidentState(incidentId, state, comment) {
    // ISSUE: Missing validation
    var gr = new GlideRecord('incident');
    if (gr.get(incidentId)) {
        gr.state = state;
        
        if (comment) {
            gr.work_notes = comment;
        }
        
        gr.update();
        
        // ISSUE: Using log for errors
        gs.log('Updated incident ' + incidentId + ' state to ' + state);
        
        return true;
    }
    
    return false;
}

/**
 * Create a new incident
 * @param {Object} incidentData - Incident data
 * @returns {string} New incident sys_id
 */
function createIncident(incidentData) {
    // ISSUE: Missing validation
    var gr = new GlideRecord('incident');
    gr.initialize();
    
    // ISSUE: Direct property assignment without validation
    gr.short_description = incidentData.short_description;
    gr.description = incidentData.description;
    gr.priority = incidentData.priority;
    gr.caller_id = incidentData.caller_id;
    gr.category = incidentData.category;
    gr.subcategory = incidentData.subcategory;
    
    // ISSUE: Hardcoded values
    gr.assignment_group = 'e35b2c2fc0a800090152507d0d364806';
    
    var incidentId = gr.insert();
    
    // ISSUE: Using log instead of info
    gs.log('Created new incident: ' + gr.number);
    
    return incidentId;
}

/**
 * Get incident metrics
 * @param {string} timeframe - Timeframe (daily, weekly, monthly)
 * @returns {Object} Incident metrics
 */
function getIncidentMetrics(timeframe) {
    // ISSUE: Hardcoded values
    var metrics = {
        created: 0,
        resolved: 0,
        backlog: 0,
        averageResolutionTime: 0,
        byPriority: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
        }
    };
    
    var startDate;
    var endDate = new GlideDateTime();
    
    // ISSUE: Inefficient date calculation
    if (timeframe == 'daily') {
        startDate = new GlideDateTime();
        startDate.addDays(-1);
    } else if (timeframe == 'weekly') {
        startDate = new GlideDateTime();
        startDate.addDays(-7);
    } else if (timeframe == 'monthly') {
        startDate = new GlideDateTime();
        startDate.addMonths(-1);
    } else {
        startDate = new GlideDateTime();
        startDate.addDays(-30); // Default to 30 days
    }
    
    // ISSUE: Inefficient queries
    var createdGr = new GlideRecord('incident');
    createdGr.addQuery('sys_created_on', '>=', startDate);
    createdGr.addQuery('sys_created_on', '<=', endDate);
    createdGr.query();
    metrics.created = createdGr.getRowCount();
    
    var resolvedGr = new GlideRecord('incident');
    resolvedGr.addQuery('resolved_at', '>=', startDate);
    resolvedGr.addQuery('resolved_at', '<=', endDate);
    resolvedGr.query();
    metrics.resolved = resolvedGr.getRowCount();
    
    var backlogGr = new GlideRecord('incident');
    backlogGr.addQuery('active', true);
    backlogGr.addQuery('sys_created_on', '<=', endDate);
    backlogGr.query();
    metrics.backlog = backlogGr.getRowCount();
    
    // ISSUE: Multiple separate queries for priority counts
    for (var i = 1; i <= 5; i++) {
        var priorityGr = new GlideRecord('incident');
        priorityGr.addQuery('priority', i);
        priorityGr.addQuery('sys_created_on', '>=', startDate);
        priorityGr.addQuery('sys_created_on', '<=', endDate);
        priorityGr.query();
        metrics.byPriority[i] = priorityGr.getRowCount();
    }
    
    return metrics;
}
