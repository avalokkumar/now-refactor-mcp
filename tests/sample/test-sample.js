/**
 * Test sample for ServiceNow Code Intelligence & Refactoring MCP
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
