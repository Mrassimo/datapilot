# 🛩️ DataPilot

**Professional CSV analysis with beautiful web interface. Transform data into insights in seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#)
[![UI](https://img.shields.io/badge/UI-Beautiful%20React-blue.svg)](#)

## 🚀 One-Click Installation

```bash
npm install -g datapilot
datapilot ui
```

**Or try locally:**

```bash
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot && npm install && npm run ui
```

**✨ Opens automatically in your browser with beautiful React interface!**

## 🎯 What is DataPilot?

**DataPilot transforms CSV analysis from hours to seconds.** It's a professional-grade data analysis platform with a stunning React interface, powered by 5 specialized AI-ready analysis engines. Perfect for data scientists, analysts, and anyone who works with CSV data.

## ✨ Key Features

### 🎨 **Beautiful React Web Interface**
- **Glassmorphic Design**: Modern, professional UI with gradient themes
- **Drag & Drop**: Intuitive file upload with real-time feedback  
- **Color-Coded Analysis**: Each analysis type has its own visual identity
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Results**: Instant analysis with beautiful visualizations

### 📊 **Five Specialized Analysis Engines**

| Analysis | Purpose | Output | Best For |
|----------|---------|--------|----------|
| **📊 EDA** | Exploratory Data Analysis | Statistical insights, correlations, distributions | Understanding your data |
| **🔍 INT** | Data Integrity Check | Quality scores, missing values, duplicates | Data validation |
| **📈 VIS** | Visualization Recommendations | Chart suggestions, color palettes | Creating visualizations |
| **🏗️ ENG** | Data Engineering Archaeology | Schema discovery, relationships | Understanding data structure |
| **🤖 LLM** | AI Context Generation | Natural language summaries | AI assistant integration |

### 🚀 **Production-Ready Features**
- **Smart Sampling**: Handles files of any size efficiently
- **Auto-Detection**: Encoding, delimiters, data types
- **Australian Data Support**: Built-in recognition for AU formats
- **Memory System**: Learns and improves over time
- **Export Ready**: All outputs optimized for LLM consumption

📚 **[Deep Dive: Analysis Theory & Implementation →](docs/COMMAND_DEEP_DIVE.md)**

## 🎮 Usage Examples

### **Web Interface (Recommended)**
```bash
datapilot ui
# 🌐 Opens beautiful React interface at http://localhost:3000
# ✨ Drag & drop CSV files for instant analysis
```

### **Command Line Interface**
```bash
# 📊 Run all analyses
datapilot all sales_data.csv

# 🔍 Specific analysis types
datapilot eda customer_data.csv           # Exploratory analysis
datapilot int inventory.csv              # Data quality check
datapilot vis metrics.csv                # Visualization recommendations
datapilot eng schema.csv                 # Data engineering insights
datapilot llm insights.csv               # AI-ready summaries

# 💾 Save results
datapilot all data.csv --output report.txt

# 🚀 Large files (auto-sampling)
datapilot eda big_dataset.csv --comprehensive false
```

## 🏆 Performance

| File Size | Analysis Time | Memory Usage |
|-----------|---------------|--------------|
| **< 1MB** | Instant | ~5MB |
| **1-10MB** | 2-5 seconds | ~20MB |
| **> 10MB** | 5-15 seconds* | ~50MB |

*\*Uses intelligent sampling for large files*

## 🔧 Requirements

- **Node.js 18+** (Only dependency!)
- **Cross-platform**: Windows, macOS, Linux
- **Zero external deps**: No Python, R, or additional tools needed
- **Self-contained**: Everything included in one package

## 🌟 Why DataPilot?

### **For Data Scientists**
- Skip the boring setup → Jump straight to insights
- AI-ready outputs → Perfect for ChatGPT/Claude workflows  
- Professional reports → Impress stakeholders

### **For Business Analysts**
- No technical setup → Works out of the box
- Beautiful interface → Focus on data, not tools
- Instant insights → Make decisions faster

### **For Developers**
- Self-contained → No dependency hell
- Well-documented → Easy to integrate
- Extensible → Build on top of our analysis engines

## 🤝 Contributing

We welcome contributions! Areas where you can help:

- **🎨 UI Improvements**: Enhance the React interface
- **📊 Analysis Engines**: Add new analysis types
- **🐛 Bug Fixes**: Help us squash bugs
- **📚 Documentation**: Improve guides and examples

See our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React + Vite**: For the beautiful frontend framework
- **Tailwind CSS**: For the stunning UI components
- **Node.js Ecosystem**: For the powerful backend tools
- **Data Community**: For inspiration and feedback

---

**🚀 Transform your CSV analysis today with DataPilot!**

*Built with ❤️ for the data community*