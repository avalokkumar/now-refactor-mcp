# Functional Loop Refactoring Template

## Issue

Nested loops can be difficult to read, maintain, and often lead to performance issues. They can also make code more error-prone and harder to debug.

## Refactoring Options

### Option 1: Use Array Methods (map, filter, reduce)

Replace nested loops with array methods for cleaner, more declarative code.

#### Before:

```typescript
const results = [];
for (let i = 0; i < data.length; i++) {
  for (let j = 0; j < data[i].items.length; j++) {
    if (data[i].items[j].active) {
      results.push(data[i].items[j].value);
    }
  }
}
```

#### After:

```typescript
const results = data.flatMap(item => 
  item.items
    .filter(subItem => subItem.active)
    .map(subItem => subItem.value)
);
```

### Option 2: Use flatMap for Nested Arrays

The `flatMap` method is perfect for working with nested arrays.

#### Before:

```typescript
const results = [];
for (let i = 0; i < categories.length; i++) {
  const category = categories[i];
  
  for (let j = 0; j < category.items.length; j++) {
    const item = category.items[j];
    results.push(processItem(item));
  }
}
```

#### After:

```typescript
const results = categories.flatMap(category => 
  category.items.map(item => processItem(item))
);
```

### Option 3: Use reduce for Accumulation

When building up a result, use `reduce` instead of pushing to an array.

#### Before:

```typescript
const sum = 0;
for (let i = 0; i < orders.length; i++) {
  for (let j = 0; j < orders[i].items.length; j++) {
    sum += orders[i].items[j].price;
  }
}
```

#### After:

```typescript
const sum = orders.reduce(
  (total, order) => total + order.items.reduce(
    (orderTotal, item) => orderTotal + item.price, 
    0
  ), 
  0
);
```

### Option 4: Use async/await with Promise.all

For asynchronous operations, use Promise.all with map instead of nested loops.

#### Before:

```typescript
async function processAll(categories) {
  const results = [];
  
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    
    for (let j = 0; j < category.items.length; j++) {
      const item = category.items[j];
      const result = await processItem(item);
      results.push(result);
    }
  }
  
  return results;
}
```

#### After:

```typescript
async function processAll(categories) {
  const results = await Promise.all(
    categories.flatMap(category => 
      category.items.map(item => processItem(item))
    )
  );
  
  return results;
}
```

## Best Practices

1. Prefer declarative array methods over imperative loops
2. Use `map` for transformations
3. Use `filter` for selecting items
4. Use `reduce` for accumulation
5. Use `flatMap` for flattening nested arrays
6. Use `Promise.all` with `map` for parallel async operations
7. Consider performance implications for very large arrays
8. Use meaningful variable names in callbacks
9. Extract complex callback functions for better readability
