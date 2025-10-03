# GlideScript Nested Query Refactoring Template

## Issue

Nested GlideRecord queries can cause performance issues by executing N+1 database queries. This pattern is inefficient and can lead to slow script execution, especially with large datasets.

## Refactoring Options

### Option 1: Use GlideAggregate for Counting

When you only need to count related records, use GlideAggregate instead of nested queries.

#### Before:

```javascript
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var count = 0;
  var gr2 = new GlideRecord('problem');
  gr2.addQuery('incident', gr1.sys_id);
  gr2.query();
  while (gr2.next()) {
    count++;
  }
  gs.log('Incident ' + gr1.number + ' has ' + count + ' problems');
}
```

#### After:

```javascript
var ga = new GlideAggregate('problem');
ga.addAggregate('COUNT');
ga.groupBy('incident');
ga.query();
while (ga.next()) {
  var incidentId = ga.incident;
  var count = ga.getAggregate('COUNT');
  var gr = new GlideRecord('incident');
  if (gr.get(incidentId)) {
    gs.log('Incident ' + gr.number + ' has ' + count + ' problems');
  }
}
```

### Option 2: Use Encoded Query with IN Operator

When you need to fetch related records, collect IDs first and then use a single query with the IN operator.

#### Before:

```javascript
var incidents = [];
var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var incident = {
    sys_id: gr1.sys_id.toString(),
    number: gr1.number.toString(),
    problems: []
  };
  
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
```

#### After:

```javascript
// Step 1: Collect all incident IDs
var incidentIds = [];
var incidentMap = {};
var incidents = [];

var gr1 = new GlideRecord('incident');
gr1.query();
while (gr1.next()) {
  var incidentId = gr1.sys_id.toString();
  incidentIds.push(incidentId);
  
  var incident = {
    sys_id: incidentId,
    number: gr1.number.toString(),
    problems: []
  };
  
  incidentMap[incidentId] = incident;
  incidents.push(incident);
}

// Step 2: Get all related problems in a single query
if (incidentIds.length > 0) {
  var gr2 = new GlideRecord('problem');
  gr2.addQuery('incident', 'IN', incidentIds.join(','));
  gr2.query();
  
  while (gr2.next()) {
    var relatedIncidentId = gr2.incident.toString();
    if (incidentMap[relatedIncidentId]) {
      incidentMap[relatedIncidentId].problems.push({
        sys_id: gr2.sys_id.toString(),
        number: gr2.number.toString()
      });
    }
  }
}
```

### Option 3: Use GlideRecord getReference()

For simple parent-child relationships, use getReference() to avoid nested queries.

#### Before:

```javascript
var gr1 = new GlideRecord('task');
gr1.query();
while (gr1.next()) {
  var assignedTo = '';
  var gr2 = new GlideRecord('sys_user');
  if (gr2.get(gr1.assigned_to)) {
    assignedTo = gr2.name.toString();
  }
  gs.log('Task ' + gr1.number + ' is assigned to ' + assignedTo);
}
```

#### After:

```javascript
var gr = new GlideRecord('task');
gr.query();
while (gr.next()) {
  var user = gr.assigned_to.getRefRecord();
  var assignedTo = user ? user.name.toString() : '';
  gs.log('Task ' + gr.number + ' is assigned to ' + assignedTo);
}
```

## Best Practices

1. Always consider the performance impact of nested queries
2. Use GlideAggregate for counting and aggregation operations
3. Use the IN operator for batch operations
4. Use getReference() for simple reference field lookups
5. Consider caching results for frequently accessed data
