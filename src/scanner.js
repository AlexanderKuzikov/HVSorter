const fs = require('fs-extra');
const path = require('path');

class Scanner {
  constructor(sourcePath) {
    this.sourcePath = sourcePath;
    this.extensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
  }

  async scan() {
    const files = [];
    await this._scanDirectory(this.sourcePath, files);
    return files;
  }

  async _scanDirectory(dirPath, files) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this._scanDirectory(fullPath, files);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.extensions.includes(ext)) {
            files.push({
              fullPath,
              name: entry.name,
              parentDir: path.dirname(fullPath),
              parentDirName: path.basename(path.dirname(fullPath))
            });
          }
        }
      }
    } catch (err) {
      // Игнорируем ошибки доступа к папкам, продолжаем сканирование
      console.warn(`Warning: Could not access ${dirPath}`);
    }
  }
}

module.exports = Scanner;