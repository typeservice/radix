import { http, Context, HttpVersion } from '../../src';
import * as Koa from 'koa';
type context = Context<HttpVersion['HTTP1']> & Koa.Context;

@http.Prefix('/def')
export default class DEF {
  @http.Get('/ght')
  home(
    @http.Query('a') a: string, 
    @http.Query('b') b: string, 
    @http.Querys c: Object,
    @http.Headers d: Object,
    @http.Datas e: Object,
    @http.Files f: Object,
    @http.Params g: Object,
    @http.Header('content-type') h: string,
    @http.Param('abc') i: string,
    @http.Data('aa') k: any,
    @http.File('bb') l: any,
    @http.Ctx n: Context,
  ) {
    return 'hello world - ' + (Number(a) + Number(b));
  }
}