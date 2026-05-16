# HVSorter

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Sharp](https://img.shields.io/badge/Sharp-99CC00?style=for-the-badge&logo=sharp&logoColor=white)
![WebP](https://img.shields.io/badge/WebP-4285F4?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=for-the-badge)

**CLI-утилита для автоматической сортировки изображений по ориентации (H/V) с resize и конвертацией в WebP.**

</div>

---

## ✨ Возможности

- 📂 **Множественные источники** — обрабатывает несколько каталогов за один запуск
- 🔍 **Рекурсивное сканирование** — находит изображения во вложенных папках
- 📐 **Определение ориентации** — корректно учитывает EXIF-поворот (теги 5–8)
- ✂️ **Smart resize** — `cover + center` через [sharp](https://sharp.pixelplumbing.com/)
- 🌐 **Конвертация в WebP** — настраиваемое качество
- 🔲 **Квадраты** — опция отправки в обе папки (H и V)
- 🚫 **Фильтр по размеру** — минимальные ширина и высота
- 📊 **Красивый отчёт** — таблица с цветами прямо в терминале
- 🧹 **Авто-очистка** — опциональная очистка выходных папок перед запуском

---

## 📦 Зависимости

| Пакет | Версия | Назначение |
|---|---|---|
| [sharp](https://github.com/lovell/sharp) | ^0.32.6 | Обработка изображений (resize, rotate, webp) |
| [chalk](https://github.com/chalk/chalk) | ^4.1.2 | Цвета в терминале |
| [cli-progress](https://github.com/npkgjs/cli-progress) | ^3.12.0 | Прогресс-бар |
| [figlet](https://github.com/patorjk/figlet.js) | ^1.6.0 | ASCII-баннер при запуске |
| [fs-extra](https://github.com/jprichardson/node-fs-extra) | ^11.1.1 | Расширенные операции с файловой системой |

---

## 🚀 Установка и запуск

```bash
# Клонировать репозиторий
git clone https://github.com/AlexanderKuzikov/HVSorter.git
cd HVSorter

# Установить зависимости
npm install

# Настроить config.json (см. ниже)

# Запустить
npm start
```

---

## ⚙️ Конфигурация

Файл `config.json` в корне проекта:

```json
{
  "sourcePaths": [
    "E:/Images/Set1",
    "E:/Images/Set2"
  ],
  "output": {
    "format": "webp",
    "quality": 75,
    "folders": {
      "horizontal": "H",
      "vertical": "V"
    }
  },
  "filters": {
    "minHeight": 1080,
    "minWidth": 1200
  },
  "resize": {
    "horizontal": {
      "width": 1920,
      "height": 1200
    },
    "vertical": {
      "width": 1200,
      "height": 1920
    }
  },
  "options": {
    "clearOutputFolders": true,
    "squaresToBoth": true
  }
}
```

### Параметры

| Ключ | Тип | Описание |
|---|---|---|
| `sourcePaths` | `string[]` | Массив путей к исходным каталогам |
| `output.quality` | `number` | Качество WebP (1–100) |
| `output.folders.horizontal` | `string` | Имя папки для горизонтальных (по умолчанию `H`) |
| `output.folders.vertical` | `string` | Имя папки для вертикальных (по умолчанию `V`) |
| `filters.minWidth` | `number` | Минимальная ширина изображения в пикселях |
| `filters.minHeight` | `number` | Минимальная высота изображения в пикселях |
| `resize.horizontal` | `object` | Целевые размеры для горизонтальных (`width`, `height`) |
| `resize.vertical` | `object` | Целевые размеры для вертикальных (`width`, `height`) |
| `options.clearOutputFolders` | `boolean` | Очищать H/V папки перед запуском |
| `options.squaresToBoth` | `boolean` | Квадратные изображения отправлять в обе папки |

> **Обратная совместимость:** если в конфиге указан старый ключ `sourcePath` (строка), он автоматически конвертируется в `sourcePaths` с одним элементом.

---

## 📁 Структура проекта

```
HVSorter/
├── src/
│   ├── index.js       # Точка входа, главный цикл
│   ├── config.js      # Загрузка и валидация конфига
│   ├── scanner.js     # Рекурсивный обход файловой системы
│   ├── processor.js   # Resize / rotate / WebP через sharp
│   ├── naming.js      # Генерация имён выходных файлов
│   └── ui.js          # Прогресс-бар, баннер, финальный отчёт
├── config.json        # Конфигурация
├── package.json
└── README.md
```

---

## 🖼️ Поддерживаемые форматы

| Формат | Расширения |
|---|---|
| JPEG | `.jpg`, `.jpeg` |
| PNG | `.png` |
| WebP | `.webp` |
| TIFF | `.tiff`, `.tif` |

Все форматы конвертируются на выходе в **WebP**.

---

## 📊 Пример вывода

```
✔ Configuration loaded successfully
Directories to process: 2

📁 Processing: E:/Images/Set1
✔ Found 1240 images

████████████████████████████████████████ | 100% | 1240/1240 | OK: 1204 | Err: 0

📁 Processing: E:/Images/Set2
✔ Found 1389 images

████████████████████████████████████████ | 100% | 1389/1389 | OK: 1389 | Err: 0

📊 Final Report:

┌──────────────────────────┬───────────────┐
│ Metric                   │ Value         │
├──────────────────────────┼───────────────┤
│ Total Scanned            │ 2629          │
├──────────────────────────┼───────────────┤
│ Successfully Processed   │ 2593          │
├──────────────────────────┼───────────────┤
│ Horizontal (H)           │ 880           │
├──────────────────────────┼───────────────┤
│ Vertical (V)             │ 1713          │
├──────────────────────────┼───────────────┤
│ Skipped (Size)           │ 36            │
├──────────────────────────┼───────────────┤
│ Errors                   │ 0             │
├──────────────────────────┼───────────────┤
│ Time Elapsed             │ 669.82s       │
└──────────────────────────┴───────────────┘

✅ All files processed successfully!
```

---

## 📄 Лицензия

[GPL-3.0](./LICENSE)
