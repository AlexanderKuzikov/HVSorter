const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Config = require('./config');
const Scanner = require('./scanner');
const Processor = require('./processor');
const Naming = require('./naming');
const UI = require('./ui');

async function main() {
  const startTime = Date.now();
  const ui = new UI();
  
  try {
    ui.showBanner();
    console.log(chalk.gray('Loading configuration...'));
    
    // 1. Загрузка конфига
    const configLoader = new Config();
    const config = configLoader.load();
    console.log(chalk.green('✔ Configuration loaded successfully\n'));
    console.log(chalk.gray(`Source: ${config.sourcePath}`));

    // 2. Подготовка папок вывода
    const pathH = configLoader.getOutputPath('horizontal');
    const pathV = configLoader.getOutputPath('vertical');
    
    console.log(chalk.gray(`Output H: ${pathH}`));
    console.log(chalk.gray(`Output V: ${pathV}\n`));

    // Очистка и создание папок
    if (config.options.clearOutputFolders) {
      if (fs.existsSync(pathH)) await fs.emptyDir(pathH);
      if (fs.existsSync(pathV)) await fs.emptyDir(pathV);
    }
    await fs.ensureDir(pathH);
    await fs.ensureDir(pathV);

    // 3. Сканирование
    console.log(chalk.gray('Scanning files...'));
    const scanner = new Scanner(config.sourcePath);
    const files = await scanner.scan();
    
    // Исключаем файлы из выходных папок H и V, чтобы не обрабатывать себя же
    const filteredFiles = files.filter(f => {
      const parent = path.dirname(f.fullPath);
      return parent !== pathH && parent !== pathV;
    });

    console.log(chalk.green(`✔ Found ${filteredFiles.length} images\n`));

    if (filteredFiles.length === 0) {
      console.log(chalk.yellow('No images to process. Exiting.'));
      return;
    }

    // 4. Обработка
    const processor = new Processor(config);
    const naming = new Naming(config.sourcePath);
    
    ui.startProgress(filteredFiles.length);

    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i];
      let processedCount = i + 1;
      
      try {
        // Получаем визуальные размеры
        const dims = await processor.getVisualDimensions(file.fullPath);
        const { width, height } = dims;

        // Фильтр по размерам
        if (height < config.filters.minHeight || width < config.filters.minWidth) {
          ui.logSkip(file.name, 'Size filter');
          ui.updateProgress(processedCount, ui.stats.errors);
          continue;
        }

        // Определение ориентации
        let orientation = '';
        if (width > height) orientation = 'horizontal';
        else if (height > width) orientation = 'vertical';
        else orientation = 'square';

        // Логика сохранения
        if (orientation === 'square' && config.options.squaresToBoth) {
          // Сохраняем в обе папки
          
          // 1. Горизонтальная версия
          const nameH = naming.generateName('horizontal');
          const outPathH = path.join(pathH, nameH);
          await processor.transform(file.fullPath, outPathH, config.resize.horizontal.width, config.resize.horizontal.height);
          ui.stats.horizontal++;
          ui.stats.processed++;

          // 2. Вертикальная версия
          const nameV = naming.generateName('vertical');
          const outPathV = path.join(pathV, nameV);
          await processor.transform(file.fullPath, outPathV, config.resize.vertical.width, config.resize.vertical.height);
          ui.stats.vertical++;
          ui.stats.processed++;

        } else {
          // Обычная логика (квадраты как вертикальные, если не включено both)
          const targetOrientation = orientation === 'square' ? 'vertical' : orientation;
          const targetResize = targetOrientation === 'horizontal' ? config.resize.horizontal : config.resize.vertical;
          const targetPath = targetOrientation === 'horizontal' ? pathH : pathV;

          const fileName = naming.generateName(targetOrientation);
          const outputPath = path.join(targetPath, fileName);

          await processor.transform(file.fullPath, outputPath, targetResize.width, targetResize.height);
          
          ui.stats.processed++;
          if (targetOrientation === 'horizontal') ui.stats.horizontal++;
          else ui.stats.vertical++;
        }

      } catch (err) {
        ui.logError(file.fullPath, err.message);
      }

      ui.updateProgress(processedCount, ui.stats.errors);
    }

    ui.stopProgress();
    
    const duration = Date.now() - startTime;
    ui.showFinalReport(duration, config.sourcePath);

  } catch (err) {
    console.error(chalk.red.bold('\n💥 Critical Error:'));
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}

// Запуск приложения
main();