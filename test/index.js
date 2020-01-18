const Zly = require('../lib');
const assert = require('assert');
const path = require('path');
const yaml = require('yaml');
const fs = require('fs');
const sinon = require('sinon');


describe('test zly', () => {
  const entry = path.join(__dirname, '/example/index.yaml');
  const entire = path.join(path.dirname(entry), 'entire.yaml');
  it('should return', () => {
    const zly = new Zly(entry);
    assert.ok(path.isAbsolute(zly.entry));
    assert.equal(zly.root, path.dirname(zly.entry));
    assert.ok(zly.stack.length === 0);
  });
  it('should parse file well', () => {
    const r = new Zly(entry);
    r.stack.push(r.root);
    const result = r.parseFile('index.yaml');
    assert.ok(result && typeof result === 'object');
  });
  it('should throw error with parse non-exist file', () => {
    const zly = new Zly(entry);
    zly.stack.push(zly.root);
    assert.throws(_ => zly.parseFile('.somefile.yaml'));
    assert.throws(_ => zly.parse('.somefile.yaml'));
  });
  it('sniffer should loop check documents', () => {
    const zly = new Zly(entry);
    let called = false;
    const stub = sinon.stub(zly, 'parseFile').callsFake( file => {
      zly.stack.push(file);
      if (!called) {
        called = true;
        return {
          foo: 'bar',
          baz: 'qux',
          $ref: 'something.yaml'
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
      }
    }
    const result = zly.sniffer(documents);
    assert.ok(called);
    assert.ok(stub.calledTwice);
    assert.deepEqual(result, {
      foo: 'bar',
      baz: 'qux',
      qux: {
        $ref: {
          foo: 'bar',
          baz: 'qux',
          $ref: {
            called: true
          }
        },
      }
    });
  });
  it('should omit $ref with object node', () => {
    const demo = {
      foo: 'bar',
      baz: {
        $ref: 'sth'
      },
      qux: {
        $ref: {
          foo: 'bar',
          baz: 'qux',
        },
      }
    };
    const r = new Zly(entry);
    const result = r.embellish(demo);
    assert.ok('$ref' in result.baz);
    assert.deepEqual(result.qux, {
      foo: 'bar',
      baz: 'qux',
    });
  });
  it('should parse success', () => {
    const zly = new Zly(entry);
    const result = zly.run();
    const content = fs.readFileSync(entire);
    const obj = yaml.parse(String(content));
    assert.deepEqual(result, obj);
  });
});
