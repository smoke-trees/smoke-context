import { AsyncLocalStorage } from 'async_hooks'
import express from 'express'
import NodeFetch, { HeaderInit, RequestInfo, RequestInit, Response } from 'node-fetch'
import * as uuid from 'uuid'
import { ContextOptions, ContextType } from './index'

export default function Context(options: ContextOptions): express.RequestHandler {
  const generateTraceId = options.generateTraceId ?? uuid.v4
  const extractKeyValuePairs = options.extractKeyValuePairs ?? function () { return {} }
  return function (req, res, next) {
    const headerName = options.headerName ?? 'SMK-TRACE-ID'
    req.context = {
      traceId: (req.get(headerName) ?? generateTraceId()),
      values: extractKeyValuePairs(req),
      headerName: headerName
    }
    next()
  } as express.RequestHandler
}

class ContextProviderClass {
  asyncLocalStorage
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage()
  }

  getContext() {
    return this.asyncLocalStorage.getStore() as ContextType
  }

  setContext(store: any) {
    return this.asyncLocalStorage.enterWith(store)
  }

  getMiddleware(options: ContextOptions) {
    const generateTraceId = options.generateTraceId ?? uuid.v4
    const extractKeyValuePairs = options.extractKeyValuePairs ?? function () { return {} }
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const headerName = options.headerName ?? 'SMK-TRACE-ID'
      const traceId = req.get(headerName) ?? generateTraceId()
      const context = {
        traceId: (traceId),
        values: extractKeyValuePairs(req),
        headerName: headerName
      }
      res.set('x-context-id', traceId)
      req.context = context
      this.asyncLocalStorage.run(context, () => {
        next()
      })
    }
  }
}

export const ContextProvider = new ContextProviderClass()

export function fetch(url: RequestInfo, context?: ContextType, init?: RequestInit): Promise<Response> {
  const headers: HeaderInit = {
    ...init?.headers
  }
  if (!context && ContextProvider) {
    context = ContextProvider.getContext()
  }
  if (context) {
    if (typeof (headers) === 'object') {
      (headers as any)[context.headerName] = context.traceId
    }
  }
  return NodeFetch(url, {
    ...init,
    headers: headers
  })
}

export { ContextType, ContextOptions }
