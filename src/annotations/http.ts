import 'reflect-metadata';
import * as Router from 'find-my-way';
import { interfaces, Container } from 'inversify';
import { NAMESPACE } from './namespace';
import { HttpException } from '@typeservice/core';
import { ParameterMetaData } from './parameter';
import { MiddlewareMetaData } from './middleware';
import { HttpVersion, Context } from '..';
export * from './parameter';
export * from './middleware';

export class HttpMethodMetaData {
  public url: string;
  public readonly methods: Set<Router.HTTPMethod> = new Set();
  constructor(url: string = '/') {
    this.url = url;
  } 

  get canRegister() {
    return this.url && this.methods.size;
  }

  get allowedMethods() {
    return Array.from(this.methods.values());
  }

  add(method: Router.HTTPMethod) {
    this.methods.add(method);
    return this;
  }

  static bind<T>(target: TypedPropertyDescriptor<T>, url?: string) {
    let meta: HttpMethodMetaData;
    if (!Reflect.hasMetadata(NAMESPACE.METHOD, target)) {
      meta = new HttpMethodMetaData(url);
      Reflect.defineMetadata(NAMESPACE.METHOD, meta, target);
    } else {
      meta = Reflect.getMetadata(NAMESPACE.METHOD, target);
    }
    if (!meta.url) meta.url = url;
    return meta;
  }
}

export const Acl = HttpMethodResolver('ACL');
export const Bind = HttpMethodResolver('BIND');
export const Checkout = HttpMethodResolver('CHECKOUT');
export const Connect = HttpMethodResolver('CONNECT');
export const Copy = HttpMethodResolver('COPY');
export const Delete = HttpMethodResolver('DELETE');
export const Get = HttpMethodResolver('GET');
export const Head = HttpMethodResolver('HEAD');
export const Link = HttpMethodResolver('LINK');
export const Lock = HttpMethodResolver('LOCK');
export const Msearch = HttpMethodResolver('M-SEARCH');
export const Merge = HttpMethodResolver('MERGE');
export const Mkactivity = HttpMethodResolver('MKACTIVITY');
export const Mkcalendar = HttpMethodResolver('MKCALENDAR');
export const Mkcol = HttpMethodResolver('MKCOL');
export const Move = HttpMethodResolver('MOVE');
export const Notify = HttpMethodResolver('NOTIFY');
export const Options = HttpMethodResolver('OPTIONS');
export const Patch = HttpMethodResolver('PATCH');
export const Post = HttpMethodResolver('POST');
export const Propfind = HttpMethodResolver('PROPFIND');
export const Proppatch = HttpMethodResolver('PROPPATCH');
export const Purge = HttpMethodResolver('PURGE');
export const Put = HttpMethodResolver('PUT');
export const Rebind = HttpMethodResolver('REBIND');
export const Report = HttpMethodResolver('REPORT');
export const Search = HttpMethodResolver('SEARCH');
export const Source = HttpMethodResolver('SOURCE');
export const Subscribe = HttpMethodResolver('SUBSCRIBE');
export const Trace = HttpMethodResolver('TRACE');
export const Unbind = HttpMethodResolver('UNBIND');
export const Unlink = HttpMethodResolver('UNLINK');
export const Unlock = HttpMethodResolver('UNLOCK');
export const Unsubscribe = HttpMethodResolver('UNSUBSCRIBE');

export function Prefix(url: string = '/'): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(NAMESPACE.PREFIX, url, target);
  }
}

export function HttpAnnotationResolver<C extends Context<HttpVersion[keyof HttpVersion]>, T = any>(
  container: Container,
  router: Router.Instance<HttpVersion[keyof HttpVersion]>, 
  clazz: interfaces.Newable<T>
) {
  const prefix: string = Reflect.hasMetadata(NAMESPACE.PREFIX, clazz) ? Reflect.getMetadata(NAMESPACE.PREFIX, clazz) : '/';
  const properties = Object.getOwnPropertyNames(clazz.prototype);

  properties.forEach(property => {
    if (property === 'constructor') return;
    const that = clazz.prototype[property];
    const isInjectable = Reflect.hasMetadata('inversify:paramtypes', clazz);
    const MethodMetaData = Reflect.hasMetadata(NAMESPACE.METHOD, that) 
      ? Reflect.getMetadata(NAMESPACE.METHOD, that) as HttpMethodMetaData 
      : null;

    if (MethodMetaData && MethodMetaData.canRegister) {
      let Middlewares = Reflect.hasMetadata(NAMESPACE.MIDDLEWARE, that) 
        ? Reflect.getMetadata(NAMESPACE.MIDDLEWARE, that) as MiddlewareMetaData<C> 
        : null;

      if (!Middlewares) Middlewares = new MiddlewareMetaData();

      let Parameters = Reflect.hasMetadata(NAMESPACE.PARAMETER, that) 
        ? Reflect.getMetadata(NAMESPACE.PARAMETER, that) as ParameterMetaData 
        : null;

      if (!Parameters) Parameters = new ParameterMetaData();

      Middlewares.render(async (ctx, next) => {
        const injector = isInjectable ? container.get<any>(clazz.name) : new clazz(ctx);
        if (!injector[property]) throw new HttpException('cannot find the method name of ' + property + ' on class ' + clazz.name);
        const injectorArgs = await Parameters.exec(ctx);
        const injectorRes = await Promise.resolve(injector[property](...injectorArgs));
        ctx.body = injectorRes;
        await next();
      });

      const composedCallback = Middlewares.compose();

      router.on(MethodMetaData.allowedMethods, fixUrl(prefix, MethodMetaData.url), function (req: any, res: any, params: any = {}) {
        (<C>this).params = params;
        return composedCallback(this);
      });
    }
  });
}

function fixUrl(prefix: string, url: string) {
  if (prefix.endsWith('/')) prefix = prefix.substring(0, -1);
  if (!url.startsWith('/')) url = '/' + url;
  return prefix + url;
}

function HttpMethodResolver(name: Router.HTTPMethod) {
  return (url: string = '/'): MethodDecorator => {
    return (target, property, descriptor) => {
      const meta = HttpMethodMetaData.bind(descriptor.value, url);
      meta.add(name);
    }
  }
}