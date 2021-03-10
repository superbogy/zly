const path = require('path');
const Yaml = require('yaml');
const fs = require('fs');
const util = require('util');
const fetch = require('node-fetch');
const url = require('url');

class Zly {
  constructor(entry, root, extname) {
    if (Zly.isUrl(entry)) {
      this.entry = entry;
      this.root = '';
      this.isRemote = true;
    } else {
      this.entry = path.isAbsolute(entry) ? entry : path.resolve(entry);
      this.root = root ? root : path.dirname(this.entry);
      this.isRemote = false;
    }

    this.stack = [];
    this.current = this.root;
    this.extname =
      Array.isArray(extname) && extname.length ? extname : ['.yaml', '.yml'];
  }

  /**
   * start to parse yaml
   */
  async run() {
    if (this.isRemote) {
      return this.parseRemote(this.entry);
    }
    this.stack.push(this.root);
    const documents = await this.parse(path.relative(this.current, this.entry));
    const output = await this.sniffer(documents);

    return this.embellish(output);
  }

  /**
   * parse entry file
   */
  async parse(file) {
    if (Zly.isUrl(file)) {
      return this.parseRemote(file);
    }
    if (this.isReference(file)) {
      return this.parseFile(file);
    }

    return file;
  }

  async parseFile(file) {
    this.current = this.stack.pop();
    file = path.resolve(this.current, file);
    if (!fs.existsSync(file)) {
      throw new Error(util.format('no such file: %s', file));
    }

    const pwd = this.current;
    const content = fs.readFileSync(file);
    this.current = path.dirname(file);
    this.stack.push(pwd);
    this.stack.push(this.current);
    try {
      return Yaml.parse(String(content));
    } catch (err) {
      throw new Error(
        util.format('parse file: %s, error: %j', file, err.message),
      );
    }
  }

  async parseRemote(url) {
    const res = await fetch(url);
    const bf = await res.buffer();
    return Yaml.parse(String(bf));
  }

  /**
   * check $ref is piece of yaml
   */
  isReference(item) {
    if (typeof item !== 'string') {
      return false;
    }
    if (this.extname.includes(path.extname(item))) {
      return true;
    }
    return false;
  }

  static isUrl(path) {
    if (typeof path !== 'string') {
      return false;
    }
    const result = url.parse(path);
    return result.host ? true : false;
  }

  /**
   * loop parse yaml node
   * @param {Object} child child node
   * @returns {Object}
   */
  async sniffer(child) {
    let changed = false;
    for (const field in child) {
      const item = child[field];
      if (field === '$ref') {
        const node = await this.parse(item);
        child[field] = node;
        changed = node !== item;
      }

      if (child[field] && typeof child[field] === 'object') {
        child[field] = await this.sniffer(child[field]);
      }
    }
    if (changed && this.stack.length) {
      this.current = this.stack.pop();
    }

    return child;
  }

  embellish(documents) {
    for (const key in documents) {
      const item = documents[key];
      if (item.$ref && typeof item.$ref === 'object') {
        documents[key] = this.embellish(item.$ref);
      } else if (typeof item === 'object') {
        this.embellish(item);
      }
    }

    return documents;
  }
}

module.exports = Zly;
