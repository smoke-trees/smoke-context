import * as express from "express";
import NodeFetch, { HeaderInit, RequestInfo, RequestInit } from 'node-fetch';
import * as uuid from 'uuid';

declare global {
  namespace SmokeContext {
    type KeyValuePair = {}
  }
  namespace express {
    export interface Request {
      context: ContextType
    }
  }
}

export interface KeyValuePair extends SmokeContext.KeyValuePair {
}

export interface ContextOptions {
  /** Header name to extract the tracing id from*/
  headerName?: string;
  extractKeyValuePairs?: () => KeyValuePair;
  generateTraceId?: () => string;
}

export interface ContextType {
  traceId: string;
  values: KeyValuePair
  headerName: string;
}

export function fetch(url: RequestInfo, context?: ContextType, init?: RequestInit) {
  const headers: HeaderInit = {
    ...init?.headers
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

export default function Context(options: ContextOptions): express.RequestHandler {
  const generateTraceId = options.generateTraceId ?? uuid.v4
  const extractKeyValuePairs = options.extractKeyValuePairs ?? function () { return {} }
  return function (req, res, next) {
    const headerName = options.headerName ?? 'SMK-TRACE-ID'
    req.context = {
      traceId: (req.get(headerName) ?? generateTraceId()),
      values: extractKeyValuePairs(),
      headerName: headerName
    }
    next()
  } as express.RequestHandler
}
