/**
 * Catalog Item Processor
 * Processes catalog items and related records in ServiceNow
 */

/**
 * Get all catalog items
 * @returns {Array} List of catalog items
 */
function getAllCatalogItems() {
    // ISSUE: Missing limit, could return too many records
    var gr = new GlideRecord('sc_cat_item');
    gr.addQuery('active', true);
    gr.query();
    
    var items = [];
    while (gr.next()) {
        items.push({
            sys_id: gr.sys_id.toString(),
            name: gr.name.toString(),
            short_description: gr.short_description.toString(),
            category: gr.category.toString()
        });
    }
    
    return items;
}

/**
 * Get catalog item details
 * @param {string} itemId - Catalog item sys_id
 * @returns {Object} Catalog item details
 */
function getCatalogItemDetails(itemId) {
    var gr = new GlideRecord('sc_cat_item');
    if (!gr.get(itemId)) {
        return null;
    }
    
    var item = {
        sys_id: gr.sys_id.toString(),
        name: gr.name.toString(),
        short_description: gr.short_description.toString(),
        description: gr.description.toString(),
        category: gr.category.toString(),
        price: gr.price.toString(),
        variables: [],
        options: []
    };
    
    // ISSUE: Nested query for variables
    var varGr = new GlideRecord('item_option_new');
    varGr.addQuery('cat_item', itemId);
    varGr.orderBy('order');
    varGr.query();
    
    while (varGr.next()) {
        item.variables.push({
            sys_id: varGr.sys_id.toString(),
            name: varGr.name.toString(),
            label: varGr.question_text.toString(),
            type: varGr.type.toString(),
            mandatory: varGr.mandatory.toString() === 'true'
        });
    }
    
    // ISSUE: Nested query for options
    var optGr = new GlideRecord('sc_cat_item_option');
    optGr.addQuery('cat_item', itemId);
    optGr.query();
    
    while (optGr.next()) {
        // ISSUE: Nested query within nested query
        var optValGr = new GlideRecord('sc_cat_item_option_mtom');
        optValGr.addQuery('sc_cat_item_option', optGr.sys_id);
        optValGr.query();
        
        var values = [];
        while (optValGr.next()) {
            values.push({
                sys_id: optValGr.sys_id.toString(),
                value: optValGr.value.toString()
            });
        }
        
        item.options.push({
            sys_id: optGr.sys_id.toString(),
            name: optGr.name.toString(),
            values: values
        });
    }
    
    return item;
}

/**
 * Submit catalog item order
 * @param {string} itemId - Catalog item sys_id
 * @param {Object} variables - Variable values
 * @param {string} userId - User sys_id
 * @returns {string} Request sys_id
 */
function submitCatalogItemOrder(itemId, variables, userId) {
    // ISSUE: Missing validation
    var cart = new Cart();
    var item = cart.addItem(itemId);
    
    // ISSUE: No validation on variables
    for (var key in variables) {
        item.setVariable(key, variables[key]);
    }
    
    // ISSUE: Hardcoded values
    var requestId = cart.placeOrder();
    
    // ISSUE: Using log instead of info
    gs.log('Submitted catalog item order: ' + requestId + ' for user: ' + userId);
    
    return requestId;
}

/**
 * Get user's catalog requests
 * @param {string} userId - User sys_id
 * @returns {Array} List of requests
 */
function getUserCatalogRequests(userId) {
    var gr = new GlideRecord('sc_request');
    gr.addQuery('requested_for', userId);
    gr.orderByDesc('sys_created_on');
    gr.query();
    
    var requests = [];
    while (gr.next()) {
        var request = {
            sys_id: gr.sys_id.toString(),
            number: gr.number.toString(),
            short_description: gr.short_description.toString(),
            state: gr.state.toString(),
            requested_for: gr.requested_for.toString(),
            created_on: gr.sys_created_on.toString(),
            items: []
        };
        
        // ISSUE: Nested query
        var itemGr = new GlideRecord('sc_req_item');
        itemGr.addQuery('request', gr.sys_id);
        itemGr.query();
        
        while (itemGr.next()) {
            request.items.push({
                sys_id: itemGr.sys_id.toString(),
                number: itemGr.number.toString(),
                short_description: itemGr.short_description.toString(),
                state: itemGr.state.toString(),
                cat_item: itemGr.cat_item.toString()
            });
        }
        
        requests.push(request);
    }
    
    return requests;
}

/**
 * Get popular catalog items
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} List of popular catalog items
 */
function getPopularCatalogItems(limit) {
    // ISSUE: Inefficient approach, should use GlideAggregate
    var counts = {};
    
    var gr = new GlideRecord('sc_req_item');
    gr.addQuery('sys_created_on', '>=', gs.beginningOfLastMonth());
    gr.query();
    
    while (gr.next()) {
        var catItem = gr.cat_item.toString();
        if (!counts[catItem]) {
            counts[catItem] = 0;
        }
        counts[catItem]++;
    }
    
    // ISSUE: Inefficient sorting
    var items = [];
    for (var id in counts) {
        items.push({
            id: id,
            count: counts[id]
        });
    }
    
    items.sort(function(a, b) {
        return b.count - a.count;
    });
    
    // ISSUE: Inefficient limiting
    if (limit && items.length > limit) {
        items = items.slice(0, limit);
    }
    
    // ISSUE: Multiple queries to get item details
    var result = [];
    for (var i = 0; i < items.length; i++) {
        var itemGr = new GlideRecord('sc_cat_item');
        if (itemGr.get(items[i].id)) {
            result.push({
                sys_id: itemGr.sys_id.toString(),
                name: itemGr.name.toString(),
                short_description: itemGr.short_description.toString(),
                category: itemGr.category.toString(),
                order_count: items[i].count
            });
        }
    }
    
    return result;
}

/**
 * Get catalog item approval status
 * @param {string} requestId - Request sys_id
 * @returns {Object} Approval status
 */
function getCatalogItemApprovalStatus(requestId) {
    var gr = new GlideRecord('sc_request');
    if (!gr.get(requestId)) {
        return null;
    }
    
    var status = {
        sys_id: gr.sys_id.toString(),
        number: gr.number.toString(),
        state: gr.state.toString(),
        approvals: []
    };
    
    // ISSUE: Nested query for approvals
    var approvalGr = new GlideRecord('sysapproval_approver');
    approvalGr.addQuery('document_id', requestId);
    approvalGr.query();
    
    while (approvalGr.next()) {
        status.approvals.push({
            sys_id: approvalGr.sys_id.toString(),
            approver: approvalGr.approver.toString(),
            state: approvalGr.state.toString(),
            comments: approvalGr.comments.toString()
        });
    }
    
    return status;
}
