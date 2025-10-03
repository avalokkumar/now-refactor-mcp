/**
 * User Utilities
 * Utility functions for user management
 */

/**
 * Get all users
 * @returns {Array} List of users
 */
function getAllUsers() {
    var users = [];
    var gr = new GlideRecord('sys_user');
    // Missing query conditions - should be refactored
    gr.query();
    
    while (gr.next()) {
        users.push({
            sys_id: gr.sys_id.toString(),
            user_name: gr.user_name.toString(),
            name: gr.name.toString(),
            email: gr.email.toString()
        });
    }
    
    return users;
}

/**
 * Get active users
 * @returns {Array} List of active users
 */
function getActiveUsers() {
    var users = [];
    var gr = new GlideRecord('sys_user');
    gr.addQuery('active', true);
    gr.query();
    
    while (gr.next()) {
        users.push({
            sys_id: gr.sys_id.toString(),
            user_name: gr.user_name.toString(),
            name: gr.name.toString(),
            email: gr.email.toString()
        });
    }
    
    return users;
}

/**
 * Get user groups
 * @param {string} userId - User sys_id
 * @returns {Array} List of user groups
 */
function getUserGroups(userId) {
    var groups = [];
    var gr = new GlideRecord('sys_user_grmember');
    gr.addQuery('user', userId);
    gr.query();
    
    while (gr.next()) {
        var groupGr = new GlideRecord('sys_user_group');
        if (groupGr.get(gr.group)) {
            groups.push({
                sys_id: groupGr.sys_id.toString(),
                name: groupGr.name.toString()
            });
        }
    }
    
    return groups;
}

/**
 * Get users with their groups
 * @returns {Array} List of users with groups
 */
function getUsersWithGroups() {
    var result = [];
    var gr = new GlideRecord('sys_user');
    gr.addQuery('active', true);
    gr.query();
    
    while (gr.next()) {
        var user = {
            sys_id: gr.sys_id.toString(),
            name: gr.name.toString(),
            groups: []
        };
        
        // Nested query - should be refactored
        var memberGr = new GlideRecord('sys_user_grmember');
        memberGr.addQuery('user', gr.sys_id);
        memberGr.query();
        
        while (memberGr.next()) {
            var groupGr = new GlideRecord('sys_user_group');
            if (groupGr.get(memberGr.group)) {
                user.groups.push({
                    sys_id: groupGr.sys_id.toString(),
                    name: groupGr.name.toString()
                });
            }
        }
        
        result.push(user);
    }
    
    return result;
}

/**
 * Check if user is in group
 * @param {string} userId - User sys_id
 * @param {string} groupId - Group sys_id
 * @returns {boolean} True if user is in group
 */
function isUserInGroup(userId, groupId) {
    var gr = new GlideRecord('sys_user_grmember');
    gr.addQuery('user', userId);
    gr.addQuery('group', groupId);
    gr.query();
    
    return gr.hasNext();
}

/**
 * Log user activity
 * @param {string} userId - User sys_id
 * @param {string} action - Action performed
 * @param {string} details - Action details
 */
function logUserActivity(userId, action, details) {
    try {
        var gr = new GlideRecord('sys_user_activity');
        gr.initialize();
        gr.user = userId;
        gr.action = action;
        gr.details = details;
        gr.insert();
    } catch (ex) {
        // Using log for errors - should use error
        gs.log('ERROR: Failed to log user activity: ' + ex.message);
    }
}
