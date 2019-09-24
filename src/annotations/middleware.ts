import { NAMESPACE } from './namespace';
import { Compose, ComposeMiddleware } from '@typeservice/core';
import { Context, HttpVersion } from '..';
export class MiddlewareMetaData<C extends Context<HttpVersion[keyof HttpVersion]>> {
  private readonly stacks: ComposeMiddleware<C>[] = [];

  static bind<C extends Context<HttpVersion[keyof HttpVersion]>, T = any>(target: TypedPropertyDescriptor<T>) {
    let meta: MiddlewareMetaData<C>;
    if (!Reflect.hasMetadata(NAMESPACE.MIDDLEWARE, target)) {
      meta = new MiddlewareMetaData();
      Reflect.defineMetadata(NAMESPACE.MIDDLEWARE, meta, target);
    } else {
      meta = Reflect.getMetadata(NAMESPACE.MIDDLEWARE, target);
    }
    return meta;
  }

  add(...args: ComposeMiddleware<C>[]) {
    args.reverse().forEach(arg => {
      if (!this.stacks.includes(arg)) {
        this.stacks.unshift(arg);
      }
    });
    return this;
  }

  render(fn: ComposeMiddleware<C>) {
    this.stacks.push(fn);
    return this;
  }

  compose() {
    return Compose(this.stacks);
  }
}

export function Middleware<C extends Context<HttpVersion[keyof HttpVersion]>, T = any>(...args: ComposeMiddleware<C>[]): MethodDecorator {
  return (target, property, descriptor) => {
    const meta = MiddlewareMetaData.bind<C, T>(descriptor.value);
    meta.add(...args);
  }
}