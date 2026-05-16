const fs = require('fs-extra');
const path = require('path');

class Config {
  constructor(configPath = './config.json', pathsFile = './paths.txt') {
    this.configPath = path.resolve(configPath);
    this.pathsFile  = path.resolve(pathsFile);
    this.config = null;
  }

  load() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
    } catch (err) {
      throw new Error(`Failed to parse config.json: ${err.message}`);
    }

    this.validate();
    this.loadSourcePaths();

    return this.config;
  }

  validate() {
    const required = ['output', 'filters', 'resize'];
    required.forEach(key => {
      if (!this.config[key]) {
        throw new Error(`Missing required config key: ${key}`);
      }
    });
  }

  loadSourcePaths() {
    // 1. paths.txt (приоритет)
    if (fs.existsSync(this.pathsFile)) {
      const lines = fs.readFileSync(this.pathsFile, 'utf-8').split(/\r?\n/);
      const parsed = lines
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'))
        .map(l => this._normalizePath(l));

      if (parsed.length > 0) {
        this.config.sourcePaths = parsed;
        this.config.sourcePath  = parsed[0];
        return;
      }
    }

    // 2. Fallback: sourcePaths / sourcePath из config.json
    if (!this.config.sourcePaths && !this.config.sourcePath) {
      throw new Error(
        'No source paths defined. Create paths.txt or set sourcePaths in config.json.'
      );
    }
    if (this.config.sourcePath && !this.config.sourcePaths) {
      this.config.sourcePaths = [this.config.sourcePath];
    }
    this.config.sourcePaths = this.config.sourcePaths.map(p => this._normalizePath(p));
    this.config.sourcePath  = this.config.sourcePaths[0];
  }

  _normalizePath(rawPath) {
    // Нормализуем любые варианты слэшей: \, /, \\
    const normalized = path.resolve(rawPath.replace(/\\\\/g, '\\'));
    if (!fs.existsSync(normalized)) {
      throw new Error(`Source path does not exist: ${normalized}`);
    }
    return normalized;
  }

  getOutputPath(basePath, orientation) {
    const folderName = orientation === 'horizontal'
      ? this.config.output.folders.horizontal
      : this.config.output.folders.vertical;
    return path.join(basePath, folderName);
  }
}

module.exports = Config;
