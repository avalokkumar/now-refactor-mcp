# TypeScript 'any' Type Refactoring Template

## Issue

Using the `any` type defeats TypeScript's type checking system. It allows any operations on the value and doesn't provide any type safety or IDE support.

## Refactoring Options

### Option 1: Use `unknown` Type

The `unknown` type is a type-safe alternative to `any`. It requires type checking before operations.

#### Before:

```typescript
function processData(data: any): any {
  return data.value;
}
```

#### After:

```typescript
function processData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data format');
}
```

### Option 2: Create Specific Interface

Define an interface that describes the expected shape of the data.

#### Before:

```typescript
function processUser(user: any): any {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}
```

#### After:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown; // For additional properties
}

interface ProcessedUser {
  id: string;
  name: string;
  email: string;
}

function processUser(user: User): ProcessedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}
```

### Option 3: Use Generics

Use generics to create flexible but type-safe functions.

#### Before:

```typescript
function getData(url: string): Promise<any> {
  return fetch(url).then(response => response.json());
}
```

#### After:

```typescript
async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}

// Usage
interface User {
  id: string;
  name: string;
}

const user = await getData<User>('/api/user/123');
```

### Option 4: Use Union Types

When a value can be one of several types, use union types.

#### Before:

```typescript
function formatValue(value: any): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  } else if (typeof value === 'number') {
    return value.toFixed(2);
  } else {
    return String(value);
  }
}
```

#### After:

```typescript
function formatValue(value: string | number | boolean | null | undefined): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  } else if (typeof value === 'number') {
    return value.toFixed(2);
  } else {
    return String(value);
  }
}
```

## Best Practices

1. Never use `any` unless absolutely necessary
2. Prefer `unknown` over `any` when the type is truly unknown
3. Create interfaces for object shapes
4. Use generics for flexible, reusable code
5. Use union types for values that can be multiple types
6. Consider using type guards for runtime type checking
7. Use the TypeScript compiler option `noImplicitAny` to catch implicit `any` types
