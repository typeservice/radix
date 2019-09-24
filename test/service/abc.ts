import { http, Context, HttpVersion } from '../../src';
import * as Koa from 'koa';
import { injectable, inject } from 'inversify';
type context = Context<HttpVersion['HTTP1']> & Koa.Context;

@injectable()
@http.Prefix('/test')
export default class ABC {
  @inject('a') private a: number;

  @http.Get('/user')
  @http.Middleware<context>(async (ctx, next) => {
    await next();
  })
  home(@http.Query('a') a: string, @http.Query('b') b: string) {
    return 'hello world - ' + (Number(a) + Number(b) + this.a);
  }
}