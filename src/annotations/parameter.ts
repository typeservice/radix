import 'reflect-metadata';
import { NAMESPACE } from './namespace';
import { ProcessException } from '@typeservice/core';
import { Context } from '..';

type ParameterTransform = {
  (ctx: any): any | Promise<any>;
  transformed?: true;
}

export class ParameterMetaData {
  private readonly parameters: ParameterTransform[] = [];

  static bind<T = any>(target: TypedPropertyDescriptor<T>) {
    let meta: ParameterMetaData;
    if (!Reflect.hasMetadata(NAMESPACE.PARAMETER, target)) {
      meta = new ParameterMetaData();
      Reflect.defineMetadata(NAMESPACE.PARAMETER, meta, target);
    } else {
      meta = Reflect.getMetadata(NAMESPACE.PARAMETER, target);
    }
    return meta;
  }

  set(index: number, value: ParameterTransform) {
    if (typeof value !== 'function') throw new ProcessException('set(index, value): value must be a function');
    value.transformed = true;
    this.parameters[index] = value;
    return this;
  }

  exec(ctx: any) {
    return Promise.all(this.parameters.map(param => {
      if (typeof param === 'function' && param.transformed) return Promise.resolve(param(ctx));
      return Promise.resolve();
    }))
  }
}

export const Headers = parameterResolver(ctx => ctx.headers);
export const Header = functionalParameterResolver((ctx, name: string) => ctx.headers[name]);
export const Querys = parameterResolver(ctx => ctx.query);
export const Query = functionalParameterResolver((ctx, name: string) => ctx.query[name]);
export const Datas = parameterResolver(ctx => ctx.request.body);
export const Data = functionalParameterResolver((ctx, ...keys: (string | number)[]) => reduceData(ctx.request.body || {}, ...keys));
export const Files = parameterResolver(ctx => ctx.request.files);
export const File = functionalParameterResolver((ctx, ...keys: (string | number)[]) => reduceData(ctx.request.files || {}, ...keys));
export const Params = parameterResolver(ctx => ctx.params);
export const Param = functionalParameterResolver((ctx, name: string) => ctx.params[name]);
export const Cookie = parameterResolver(ctx => ctx.cookies);

export function parameterResolver(fn: (ctx: Context) => any): ParameterDecorator {
  return (target, property, index) => {
    const obj = target.constructor.prototype[property];
    const meta = ParameterMetaData.bind(obj);
    meta.set(index, fn);
  }
}

export function functionalParameterResolver(fn: (ctx: Context, ...args: any[]) => any) {
  return (...args: any[]): ParameterDecorator => {
    return (target, property, index) => {
      const obj = target.constructor.prototype[property];
      const meta = ParameterMetaData.bind(obj);
      meta.set(index, (ctx: Context) => {
        return fn(ctx, ...args);
      })
    }
  }
}

function reduceData(data: any, ...keys: (string | number)[]) {
  return keys.reduce((object, key) => {
    if (object === undefined) return;
    if (object[key]) return object[key];
    return;
  }, data);
}