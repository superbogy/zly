const Zly = require('../lib');
const assert = require('assert');
const path = require('path');
const yaml = require('yaml');
const fs = require('fs');

describe('test zly', () => {
  const entry = path.join(__dirname, '/example/index.yaml');
  const entire = path.join(path.dirname(entry), 'entire.yaml');
  it('should return', () => {
    const zly = new Zly(entry);
    expect(path.isAbsolute(zly.entry)).toBe(true);
    expect(zly.root).toEqual(path.dirname(zly.entry));
    assert.ok(zly.stack.length === 0);
  });
  it('should parse file well', async () => {
    const r = new Zly(entry);
    r.stack.push(r.root);
    const result = await r.parseFile('index.yaml');
    expect(result).toBeTruthy();
    expect(typeof result === 'object').toBe(true);
  });
  it('should throw error with parse non-exist file', async () => {
    const zly = new Zly(entry);
    zly.stack.push(zly.root);
    await expect(zly.parseFile('.somefile.yaml')).rejects.toThrow(
      'no such file',
    );
    zly.stack.push(zly.root);
    await expect(zly.parse('./some-random-file.yaml')).rejects.toThrow(
      'no such file',
    );
  });
  it('sniffer should loop check documents', async () => {
    const zly = new Zly(entry);
    let called = false;
    const spy = jest.spyOn(zly, 'parseFile').mockImplementation((file) => {
      zly.stack.push(file);
      if (!called) {
        called = true;
        return {
          foo: 'bar',
          baz: 'qux',
          $ref: 'something.yaml',
        };
      } else {
        return { called };
      }
    });
    const documents = {
      foo: 'bar',
      baz: 'qux',
      qux: {
        $ref: 'refer.yaml',
      },
    };
    const result = await zly.sniffer(documents);
    expect(spy).toHaveBeenCalled();
    expect(result).toMatchObject({
      foo: 'bar',
      baz: 'qux',
      qux: {
        $ref: {
          foo: 'bar',
          baz: 'qux',
          $ref: {
            called: true,
          },
        },
      },
    });
  });
  it('should omit $ref with object node', () => {
    const demo = {
      foo: 'bar',
      baz: {
        $ref: 'sth',
      },
      qux: {
        $ref: {
          foo: 'bar',
          baz: 'qux',
        },
      },
    };
    const r = new Zly(entry);
    const result = r.embellish(demo);
    expect(result).toHaveProperty('baz.$ref');
    expect(result).toHaveProperty('qux', {
      foo: 'bar',
      baz: 'qux',
    });
  });
  it('should able to parse remote yaml file', async () => {
    const url =
      'https://raw.githubusercontent.com/superbogy/zly/master/test/example/definitions/Error.yaml';
    const zly = new Zly('');
    const res = await zly.parseRemote(url);
    expect(res).toMatchObject({
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'integer', format: 'int32' },
        message: { type: 'string' },
      },
    });
  });
  it('should parse success', async () => {
    const zly = new Zly(entry);
    const result = await zly.run();
    const content = fs.readFileSync(entire);
    const obj = yaml.parse(String(content));
    expect(result).toEqual(obj);
  });
});
