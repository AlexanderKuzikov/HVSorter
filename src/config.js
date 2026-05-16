const fs = require('fs-extra');
const path = require('path');

class Config {
  constructor(configPath = './config.json') {
    this.configPath = path.resolve(configPath);
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
    this.normalizePaths();

    return this.config;
  }

  validate() {
    // Поддержка sourcePaths (массив) и legacy sourcePath (строка)
    if (!this.config.sourcePaths && !this.config.sourcePath) {
      throw new Error('Missing required config key: sourcePaths (array) or sourcePath (string)');
    }
    const required = ['output', 'filters', 'resize'];
    required.forEach(key => {
      if (!this.config[key]) {
        throw new Error(`Missing required config key: ${key}`);
      }
    });
  }

  normalizePaths() {
    // Нормализуем в единый массив sourcePaths
    if (this.config.sourcePath && !this.config.sourcePaths) {
      this.config.sourcePaths = [this.config.sourcePath];
    }
    this.config.sourcePaths = this.config.sourcePaths.map(p => {
      const resolved = path.resolve(p);
      if (!fs.existsSync(resolved)) {
        throw new Error(`Source path does not exist: ${resolved}`);
      }
      return resolved;
    });
    // Для обратной совместимости
    this.config.sourcePath = this.config.sourcePaths[0];
  }

  getOutputPath(basePath, orientation) {
    const folderName = orientation === 'horizontal'
      ? this.config.output.folders.horizontal
      : this.config.output.folders.vertical;
    return path.join(basePath, folderName);
  }
}

module.exports = Config;
