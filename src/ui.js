const cliProgress = require('cli-progress');
const chalk = require('chalk');
const figlet = require('figlet');
const fs = require('fs-extra');
const path = require('path');

class UI {
  constructor() {
    this.progressBar = new cliProgress.SingleBar({
      format: `${chalk.cyan('{bar}')} | {percentage}% | {value}/{total} | ${chalk.green('OK:')} {processed} | ${chalk.red('Err:')} {errors}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    }, {
      processed: 0,
      errors: 0
    });
    
    this.errors = [];
    this.stats = {
      total: 0,
      processed: 0,
      horizontal: 0,
      vertical: 0,
      skipped: 0,
      errors: 0
    };
  }

  showBanner() {
    console.clear();
    try {
      const banner = figlet.textSync('Image Processor', {
        font: 'Standard',
        horizontalLayout: 'default'
      });
      console.log(chalk.cyan.bold(banner));
    } catch (e) {
      console.log(chalk.cyan.bold('IMAGE PROCESSOR CLI'));
    }
    console.log(chalk.gray('Node.js Utility for Image Processing\n'));
  }

  startProgress(total) {
    this.stats.total = total;
    this.progressBar.start(total, 0, { processed: 0, errors: 0 });
  }

  updateProgress(processedCount, errorCount) {
    this.progressBar.update(processedCount, { 
      processed: processedCount - errorCount, 
      errors: errorCount 
    });
  }

  stopProgress() {
    this.progressBar.stop();
    console.log('\n');
  }

  logError(file, message) {
    this.errors.push({ file, message });
    this.stats.errors++;
    // Вывод ошибки сразу в консоль
    console.log(`\n${chalk.red('✖ ERROR:')} ${path.basename(file)}`);
    console.log(`  ${chalk.gray(message)}`);
  }

  logSkip(file, reason) {
    this.stats.skipped++;
  }

  showFinalReport(duration, outputPath) {
    console.log(chalk.bold('\n📊 Final Report:\n'));
    
    const tableData = [
      { metric: 'Total Scanned', value: this.stats.total },
      { metric: 'Successfully Processed', value: chalk.green(this.stats.processed) },
      { metric: 'Horizontal (H)', value: chalk.blue(this.stats.horizontal) },
      { metric: 'Vertical (V)', value: chalk.magenta(this.stats.vertical) },
      { metric: 'Skipped (Size)', value: chalk.yellow(this.stats.skipped) },
      { metric: 'Errors', value: this.stats.errors > 0 ? chalk.red(this.stats.errors) : 0 },
      { metric: 'Time Elapsed', value: `${(duration / 1000).toFixed(2)}s` }
    ];

    console.table(tableData);

    if (this.errors.length > 0) {
      console.log(chalk.red.bold('\n⚠ Errors Log:\n'));
      const errorLogPath = path.join(outputPath, 'error_log.txt');
      let logContent = 'ERROR LOG\n===========\n\n';
      
      this.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${chalk.red(err.file)}`);
        console.log(`   ${chalk.gray(err.message)}\n`);
        logContent += `${i + 1}. ${err.file}\n   ${err.message}\n\n`;
      });

      try {
        fs.writeFileSync(errorLogPath, logContent);
        console.log(chalk.gray(`Full error log saved to: ${errorLogPath}\n`));
      } catch (e) {
        console.log(chalk.gray('Could not save error log file.\n'));
      }
    } else {
      console.log(chalk.green('✅ All files processed successfully!\n'));
    }
  }
}

module.exports = UI;