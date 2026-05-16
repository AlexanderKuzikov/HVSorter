const path = require('path');

class Naming {
  constructor(sourcePath) {
    this.sourcePath = sourcePath;
    this.sourceFolderName = path.basename(sourcePath);
    // Счетчики для H и V
    this.counters = {
      horizontal: 0,
      vertical: 0
    };
  }

  increment(orientation) {
    this.counters[orientation]++;
    return this.counters[orientation];
  }

  generateName(orientation) {
    const type = orientation === 'horizontal' ? 'H' : 'V';
    const count = this.increment(orientation);
    const num = String(count).padStart(5, '0');
    
    // Заменяем спецсимволы в имени папки на подчеркивания для безопасности
    const safeFolderName = this.sourceFolderName.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${safeFolderName}${type}${num}.webp`;
  }
}

module.exports = Naming;