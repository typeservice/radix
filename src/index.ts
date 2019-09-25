import 'reflect-metadata';
import * as path from 'path';
import * as Http from 'http';
import * as HTTP2 from 'http2';
import * as Router from 'find-my-way';
import * as globby from 'globby';
import * as Cookies from 'cookies';
import { RequireFileWithDefault } from '@typeservice/core';
import { Container, interfaces } from 'inversify';
import { HttpAnnotationResolver } from './annotations/http';
import * as http from './annotations/http';
const isClass = require('is-class');

export {
  http,
}

export type HttpVersion = {
  HTTP1: Router.HTTPVersion.V1,
  HTTP2: Router.HTTPVersion.V2,
}

export type RadixOptions = Router.Config<HttpVersion[keyof HttpVersion]>;

export interface Context<T = HttpVersion['HTTP1']> {
  req: T extends HttpVersion['HTTP1'] ? Http.IncomingMessage : HTTP2.Http2ServerRequest,
  res: T extends HttpVersion['HTTP1'] ? Http.ServerResponse : HTTP2.Http2ServerResponse,
  method: Router.HTTPMethod | string,
  url: string,
  headers: T extends HttpVersion['HTTP1'] ? Http.IncomingHttpHeaders : HTTP2.IncomingHttpHeaders,
  query?: { 
    [key:string]: string 
  },
  request: {
    body?: any,
    files?: {
      [file: string]: {
        path: string,
        size: number,
        [key: string]: any,
      }
    }
  },
  params?: {
    [key: string]: string,
  },
  body?: any,
  status?: number,
  cookies?: Cookies,
}

export default class Radix<T extends HttpVersion[keyof HttpVersion] = HttpVersion['HTTP1']> {
  private router: Router.Instance<T>;
  public readonly container: Container = new Container();
  constructor(options: RadixOptions = {}) {
    this.router = Router({
      ignoreTrailingSlash: options.ignoreTrailingSlash,
      allowUnsafeRegex: options.allowUnsafeRegex,
      caseSensitive: options.caseSensitive,
      maxParamLength: options.maxParamLength,
      defaultRoute() {
        (<Context<T>>this).status = 404;
      }
    });
  }

  scan(dir: string, cwd: string = process.cwd()) {
    const dictionary = path.resolve(cwd, dir);
    const dictionaries = globby.sync([
      '**/*.ts',
      '**/*.js',
      '!**/*.d.ts'
    ], {
      cwd: dictionary
    });
    dictionaries.forEach(dic => {
      const clazz = RequireFileWithDefault<interfaces.Newable<any>>(dic, dictionary);
      this.bind(clazz.name, clazz);
    });
  }

  bind<U = any>(name: string, clazz: interfaces.Newable<U>) {
    if (isClass(clazz) as boolean) {
      if (Reflect.hasMetadata('inversify:paramtypes', clazz)) {
        this.container.bind(name).to(clazz);
      }
      HttpAnnotationResolver<Context<T>, U>(this.container, this.router, clazz);
    }
    return this;
  }

  compose<U extends Context<T>>() {
    return async (ctx: U, next: Function) => {
      const composed = this.router.lookup<U>(ctx.req, ctx.res, ctx);
      await Promise.resolve(composed);
      await next();
    }
  }
}