const sharp = require('sharp');

class Processor {
  constructor(config) {
    this.config = config;
  }

  async getVisualDimensions(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      let width = metadata.width;
      let height = metadata.height;

      // Если есть ориентация 90/270 градусов, меняем местами ширину и высоту
      if (metadata.orientation && [5, 6, 7, 8].includes(metadata.orientation)) {
        width = metadata.height;
        height = metadata.width;
      }

      return { width, height, orientation: metadata.orientation };
    } catch (err) {
      throw new Error(`Failed to read metadata: ${err.message}`);
    }
  }

  async transform(inputPath, outputPath, targetWidth, targetHeight) {
    try {
      await sharp(inputPath)
        .rotate() // Применяем EXIF ориентацию
        .resize({
          width: targetWidth,
          height: targetHeight,
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: this.config.output.quality })
        .toFile(outputPath);
      
      return true;
    } catch (err) {
      throw new Error(`Transformation failed: ${err.message}`);
    }
  }
}

module.exports = Processor;