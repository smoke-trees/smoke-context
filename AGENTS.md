# @smoke-trees/smoke-context

## Package Overview
Express middleware for distributed tracing and context propagation across microservices. Automatically manages trace IDs and custom context values throughout request lifecycles using AsyncLocalStorage.

## Core Exports

### `Context(options: ContextOptions): express.RequestHandler`
Basic middleware that attaches context to `req.context`.

**Options:**
- `headerName?: string` - Header for trace ID (default: "SMK-TRACE-ID")
- `extractKeyValuePairs?: (req) => object` - Extract custom values from request
- `generateTraceId?: () => string` - Custom ID generator (default: uuid.v4)

**Usage:**
```typescript
import Context from '@smoke-trees/smoke-context';
app.use(Context({ headerName: 'X-Trace-ID' }));
```

### `ContextProvider`
Advanced singleton for AsyncLocalStorage-based context management.

**Methods:**
- `getMiddleware(options: ContextOptions)` - Returns middleware with async storage support
- `getContext(): ContextType` - Retrieve current context from any point in async chain
- `setContext(store: any, traceId?: string)` - Manually set context

**Usage:**
```typescript
import { ContextProvider } from '@smoke-trees/smoke-context';

// Setup
app.use(ContextProvider.getMiddleware({ headerName: 'X-Trace-ID' }));

// Access anywhere in request chain
const context = ContextProvider.getContext();
console.log(context.traceId); // Access trace ID
```

### `fetch(url, context?, init?): Promise<Response>`
Wrapper around node-fetch that automatically propagates trace headers.

**Behavior:**
- Auto-injects trace ID header from current context (via ContextProvider)
- Can accept explicit context as second parameter
- Falls back to regular fetch if no context available

**Usage:**
```typescript
import { fetch } from '@smoke-trees/smoke-context';

// Automatic propagation
const response = await fetch('https://api.example.com/data');

// Manual context
const response = await fetch('https://api.example.com/data', req.context);
```

## Types

### `ContextType`
```typescript
{
  traceId: string;
  values: { [key: string]: any };
  headerName: string;
}
```

### `ContextOptions`
```typescript
{
  headerName?: string;
  extractKeyValuePairs?: (req?: Request) => { [key: string]: any };
  generateTraceId?: () => string;
}
```

## Common Patterns

**Basic Setup:**
```typescript
import express from 'express';
import { ContextProvider } from '@smoke-trees/smoke-context';

const app = express();
app.use(ContextProvider.getMiddleware({
  headerName: 'X-Trace-ID',
  extractKeyValuePairs: (req) => ({
    userId: req.user?.id,
    requestPath: req.path
  })
}));
```

**Service-to-Service Calls:**
```typescript
import { fetch, ContextProvider } from '@smoke-trees/smoke-context';

async function callDownstream() {
  // Trace ID automatically propagated
  const result = await fetch('http://downstream-service/api');
  return result.json();
}
```

**Logging with Trace ID:**
```typescript
import { ContextProvider } from '@smoke-trees/smoke-context';

function log(message: string) {
  const context = ContextProvider.getContext();
  console.log(`[${context?.traceId}] ${message}`);
}
```

## Key Features
- Automatic trace ID generation and propagation
- AsyncLocalStorage for context access anywhere in request chain
- Custom context values via extractKeyValuePairs
- Built-in fetch wrapper for microservices
- TypeScript support with Express Request augmentation

## Peer Dependencies
- express >= 4.0.0
- @types/express

## Main Entry Point
`dist/context.js` (TypeScript declarations at `dist/context.d.ts`)
