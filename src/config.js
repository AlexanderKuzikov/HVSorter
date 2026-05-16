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
    const required = ['sourcePath', 'output', 'filters', 'resize'];
    required.forEach(key => {
      if (!this.config[key]) {
        throw new Error(`Missing required config key: ${key}`);
      }
    });
  }

  normalizePaths() {
    // Нормализация пути источника
    this.config.sourcePath = path.resolve(this.config.sourcePath);
    
    // Проверка существования исходной папки
    if (!fs.existsSync(this.config.sourcePath)) {
      throw new Error(`Source path does not exist: ${this.config.sourcePath}`);
    }
  }

  getOutputPath(orientation) {
    const folderName = orientation === 'horizontal' 
      ? this.config.output.folders.horizontal 
      : this.config.output.folders.vertical;
    
    return path.join(this.config.sourcePath, folderName);
  }
}

module.exports = Config;