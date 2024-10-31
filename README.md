# Audio Markup Tool

## Overview

A React-based web application for audio file annotation. This tool enables users to load audio files from a selected directory, visualize waveforms, and add annotation regions. Users can manipulate (move/delete) these regions and export annotations in both JSON and CSV formats.

## Features

- 🎵 Audio file navigation and waveform visualization
- ✏️ Region-based annotation system
- 📁 Local directory selection and file browsing
- 📊 Export annotations to JSON or CSV
- 📈 Real-time statistics dashboard
- ⌨️ Convenient keyboard shortcuts

## Installation Options

### Option 1: Use the Live Version
Visit our GitHub Pages deployment: [https://drhspfn.github.io/audio-markup-tool](https://drhspfn.github.io/audio-markup-tool)

### Option 2: Download Pre-built Version
1. Download the latest release from the [Releases page](https://github.com/drhspfn/audio-markup-tool/releases)
2. Extract the archive
3. Install `serve` globally (if not already installed):
   ```bash
   npm install -g serve
   ```
4. Run the application:
   ```bash
   serve -s build
   ```
5. Open `http://localhost:3000` in your browser

### Option 3: Build from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/drhspfn/audio-markup-tool.git
   ```
2. Install dependencies:
   ```bash
   cd audio-markup-tool
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Export Formats

### JSON Example
```json
[
  {
    "name": "/1.mp3",
    "regions": [
      [
        0,
        30.1
      ],
      [
        45.4,
        80
      ]
    ]
  }
]
```

### CSV Format Example
```csv
path,start_1,end_1,start_2,end_2,start_3,end_3
1.mp3,0,5,1,4,,
10.mp3,0,5,,,,
```

The CSV export format dynamically adjusts its columns based on the maximum number of labels present across all files. For example:
- If a file has one label: Uses columns `start_1` and `end_1`
- If a file has two labels: Uses columns up to `start_2` and `end_2`
- If a file has three labels: Uses columns up to `start_3` and `end_3`

The number of columns will always be twice the maximum number of labels found in any file (one column for start and one for end of each label).

## Keyboard Shortcuts

| Shortcut       | Action                                              |
|---------------|-----------------------------------------------------|
| F1            | Show help                                           |
| ←/→           | Navigate between tracks                             |
| ↑/↓           | Adjust playback volume                              |
| N             | Create new region                                   |
| D or Delete   | Remove selected region                              |
| Ctrl + S      | Export annotations                                  |
| Space         | Play/Pause audio                                    |

## Statistics Dashboard

During dataset export, the tool displays real-time statistics, including:
- Total number of files in the directory
- Number of annotated files
- Number of files awaiting annotation


## TODO
- Text labels for regions
- __maybe something else...__

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


