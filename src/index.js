const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Config = require('./config');
const Scanner = require('./scanner');
const Processor = require('./processor');
const Naming = require('./naming');
const UI = require('./ui');

async function processDirectory(sourcePath, config, configLoader, processor, ui) {
  console.log(chalk.cyan.bold(`\n📁 Processing: ${sourcePath}`));

  const pathH = configLoader.getOutputPath(sourcePath, 'horizontal');
  const pathV = configLoader.getOutputPath(sourcePath, 'vertical');

  console.log(chalk.gray(`Output H: ${pathH}`));
  console.log(chalk.gray(`Output V: ${pathV}\n`));

  if (config.options.clearOutputFolders) {
    if (fs.existsSync(pathH)) await fs.emptyDir(pathH);
    if (fs.existsSync(pathV)) await fs.emptyDir(pathV);
  }
  await fs.ensureDir(pathH);
  await fs.ensureDir(pathV);

  const scanner = new Scanner(sourcePath);
  const files = await scanner.scan();

  const filteredFiles = files.filter(f => {
    const parent = path.dirname(f.fullPath);
    return parent !== pathH && parent !== pathV;
  });

  console.log(chalk.green(`✔ Found ${filteredFiles.length} images\n`));

  if (filteredFiles.length === 0) {
    console.log(chalk.yellow('No images to process in this directory.'));
    return;
  }

  const naming = new Naming(sourcePath);

  ui.startProgress(filteredFiles.length);

  for (let i = 0; i < filteredFiles.length; i++) {
    const file = filteredFiles[i];
    const processedCount = i + 1;

    try {
      const dims = await processor.getVisualDimensions(file.fullPath);
      const { width, height } = dims;

      if (height < config.filters.minHeight || width < config.filters.minWidth) {
        ui.logSkip(file.name, 'Size filter');
        ui.updateProgress(processedCount, ui.stats.errors);
        continue;
      }

      let orientation = '';
      if (width > height) orientation = 'horizontal';
      else if (height > width) orientation = 'vertical';
      else orientation = 'square';

      if (orientation === 'square' && config.options.squaresToBoth) {
        const nameH = naming.generateName('horizontal');
        const outPathH = path.join(pathH, nameH);
        await processor.transform(file.fullPath, outPathH, config.resize.horizontal.width, config.resize.horizontal.height);
        ui.stats.horizontal++;
        ui.stats.processed++;

        const nameV = naming.generateName('vertical');
        const outPathV = path.join(pathV, nameV);
        await processor.transform(file.fullPath, outPathV, config.resize.vertical.width, config.resize.vertical.height);
        ui.stats.vertical++;
        ui.stats.processed++;
      } else {
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
}

async function main() {
  const startTime = Date.now();
  const ui = new UI();

  try {
    ui.showBanner();
    console.log(chalk.gray('Loading configuration...'));

    const configLoader = new Config();
    const config = configLoader.load();
    console.log(chalk.green('✔ Configuration loaded successfully'));
    console.log(chalk.gray(`Directories to process: ${config.sourcePaths.length}\n`));

    const processor = new Processor(config);

    for (const sourcePath of config.sourcePaths) {
      await processDirectory(sourcePath, config, configLoader, processor, ui);
    }

    const duration = Date.now() - startTime;
    ui.showFinalReport(duration, config.sourcePaths[0]);

  } catch (err) {
    console.error(chalk.red.bold('\n💥 Critical Error:'));
    console.error(chalk.red(err.message));
    process.exit(1);
  }
}

main();
