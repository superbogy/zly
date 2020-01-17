const path = require('path');
const Yaml = require('yaml');
const fs = require('fs');
const util = require('util');

class Zly {

  constructor(entry, root, extname) {
    this.entry = path.isAbsolute(entry) ? entry : path.resolve(entry);
    this.root = root ? root : path.dirname(this.entry);
    this.stack = [];
    this.current = this.root;
    this.extname = Array.isArray(extname) && extname.length ? extname : ['.yaml', '.yml'];
  }

  /**
   * start to parse yaml
   */
  run() {
    this.stack.push(this.root);
    const docuemnts = this.parse(path.relative(this.current, this.entry));
    const output = this.sniffer(docuemnts);

    return this.embellish(output);
  }

  /**
   * parse entry file
   */
  parse(file) {
    const docuemnt = this.parseFile(file);

    return docuemnt;
  }

  parseFile(file) {
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
    } catch(err) {
      throw new Error(util.format('parse file: %s, error: %j', file, err.message));
    }
  }

  /**
   * loop parse yaml node
   * @param {Object} child child node
   * @return {Object}
   */
  sniffer(child) {
    let changed = false;
    for (const field in child) {
      const item = child[field];
      if (field === '$ref' && this.extname.includes(path.extname(item))) {
          const node = this.parse(item);
          child[field] = node;
          changed = true;
      }

      if (child[field] && typeof child[field] === 'object') {
        child[field] = this.sniffer(child[field]);
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
