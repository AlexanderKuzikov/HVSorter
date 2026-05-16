const cliProgress = require('cli-progress');
const chalk = require('chalk');
const figlet = require('figlet');
const fs = require('fs-extra');
const path = require('path');

const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*m/g, '');

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
    this.stats.total += total;
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
    console.log('');
  }

  logError(file, message) {
    this.errors.push({ file, message });
    this.stats.errors++;
    console.log(`\n${chalk.red('✖ ERROR:')} ${path.basename(file)}`);
    console.log(`  ${chalk.gray(message)}`);
  }

  logSkip(file, reason) {
    this.stats.skipped++;
  }

  showFinalReport(duration, outputPath) {
    console.log(chalk.bold('\n📊 Final Report:\n'));

    const rows = [
      ['Total Scanned',          String(this.stats.total)],
      ['Successfully Processed', chalk.green(String(this.stats.processed))],
      ['Horizontal (H)',         chalk.blue(String(this.stats.horizontal))],
      ['Vertical (V)',           chalk.magenta(String(this.stats.vertical))],
      ['Skipped (Size)',         chalk.yellow(String(this.stats.skipped))],
      ['Errors',                 this.stats.errors > 0 ? chalk.red(String(this.stats.errors)) : '0'],
      ['Time Elapsed',           `${(duration / 1000).toFixed(2)}s`],
    ];

    const col1Width = Math.max(...rows.map(r => r[0].length));
    const col2Width = Math.max(...rows.map(r => stripAnsi(r[1]).length));

    const hr  = (l, m, r, fill) => `${l}${fill.repeat(col1Width + 2)}${m}${fill.repeat(col2Width + 2)}${r}`;
    const row = (label, value) => {
      const padded = value + ' '.repeat(col2Width - stripAnsi(value).length);
      return `│ ${label.padEnd(col1Width)} │ ${padded} │`;
    };

    console.log(hr('┌', '┬', '┐', '─'));
    console.log(row(chalk.bold('Metric'), chalk.bold('Value')));
    rows.forEach(r => {
      console.log(hr('├', '┼', '┤', '─'));
      console.log(row(r[0], r[1]));
    });
    console.log(hr('└', '┴', '┘', '─'));

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
      console.log(chalk.green('\n✅ All files processed successfully!\n'));
    }
  }
}

module.exports = UI;
