# @typeservice/radix

[![codecov](https://codecov.io/gh/typeservice/radix/branch/master/graph/badge.svg)](https://codecov.io/gh/typeservice/radix)

It is a super-performance routing middleware based on find-my-way, which can be directly connected to the current mainstream server framework and provides programmable AOP annotation programming.

## Installing

For the latest stable version:

```bash
$ npm install @typeservice/radix
```

## Usage

```ts
import Koa from '@typeservice/koa';
import Http from '@typeservice/radix';
const app = new Koa(8000);
const http = new Http();
http.scan('service', __dirname);
http.container.bind('a').toConstantValue(99);
app.use(http.compose());
app.httpBootstrap();
app.listen();
```

## Radix Options

It is created based on [https://www.npmjs.com/package/find-my-way](https://www.npmjs.com/package/find-my-way), so you can use all the parameters above it.

- Trailing slashes can be ignored by supplying the `ignoreTrailingSlash` option
- You can set a custom length for parameters in parametric (standard, regex and multi) routes by using `maxParamLength` option, the default value is 100 characters.
- If you are using a regex based route, it will throw an error if detects potentially catastrophic exponential-time regular expressions (internally uses [safe-regex2](https://github.com/fastify/safe-regex2)).If you want to disable this behavior, pass the option `allowUnsafeRegex`.
- According to [RFC3986](https://tools.ietf.org/html/rfc3986#section-6.2.2.1), it is case sensitive by default. You can disable this by setting the `caseSensitive` option to false: in that case, all paths will be matched as lowercase, but the route parameters or wildcards will maintain their original letter casing. 

## Scan files

`.scan(dir, cwd)` 

It automatically scans files under the folder for automatic injection into internal routes and dependencies. You don't have to worry about it. 

> `cwd` is optional

```ts
http.scan('service', __dirname);
```

## Render a middleware

`.compose()`

Generate a service middleware.

```ts
http.compose()
```

# License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
