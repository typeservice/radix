import axios from 'axios';
import Koa from '@typeservice/koa';
import Http from '../src';


const app = new Koa(8000);
const http = new Http();
http.scan('service', __dirname);
http.container.bind('a').toConstantValue(99);
app.use(http.compose());
app.httpBootstrap();

beforeAll(() => app.listen());
afterAll(() => app.close());


describe('TypeService koa + radix unit tests', () => {
  test('test normalize', done => {
    axios.get('http://127.0.0.1:8000/test/user?a=44&b=56')
    .then(res => expect(res.data).toBe('hello world - 199'))
    .then(done);
  });

  test('test 404', done => {
    axios.get('http://127.0.0.1:8000/abc')
    .then(res => expect(res.status).toBe(404))
    .catch(e => expect(e.response.status).toBe(404))
    .then(done);
  });

  test('test no injectable', done => {
    axios.get('http://127.0.0.1:8000/def/ght?a=45&b=55')
    .then(res => expect(res.data).toBe('hello world - 100'))
    .then(done);
  });
})