# CV Genius - Professional CV Maker

🚀 **[CV Genius Website](https://michaldakowicz.github.io/cv-genius/)**

A beautiful, responsive CV maker with AI-powered suggestions that helps you create professional CVs effortlessly. Built with modern web technologies and powered by OpenAI's GPT for intelligent content enhancement.

## ✨ Features

### 🎨 **Beautiful Design**

-   Clean, modern, and professional CV layouts
-   Responsive design that works on all devices
-   Dark/light mode toggle for comfortable viewing
-   Elegant animations and smooth transitions

### 🤖 **AI-Powered Suggestions**

-   **OpenAI Integration**: Get intelligent suggestions to improve your CV content
-   **Multi-language Support**: AI suggestions in 10+ languages including English, Polish, Spanish, French, German, and more
-   **Personalized Content**: AI analyzes your existing content and provides tailored improvements
-   **Smart Enhancements**: Automatically improve job descriptions, skills, and personal summaries

### 📄 **CV Sections**

-   **Personal Information**: Name, contact details, professional summary
-   **Work Experience**: Job positions with detailed descriptions
-   **Education**: Academic background and qualifications
-   **Skills**: Technical and soft skills categorization
-   **Custom Sections**: Add your own sections for projects, publications, languages, etc.

### 💾 **Data Management**

-   **Auto-save**: Your work is automatically saved to local storage
-   **Import/Export**: Save and load your CV data as JSON files
-   **PDF Export**: Generate high-quality PDF versions of your CV
-   **Print Support**: Optimized printing with clean formatting

### 🔧 **User Experience**

-   **Intuitive Interface**: Easy-to-use form-based editing
-   **Real-time Preview**: See changes instantly as you type
-   **Drag & Drop**: Reorder sections and items (coming soon)
-   **Bulk Edit**: Edit multiple items at once (coming soon)
-   **Clear CV**: Reset and start fresh with one click

## 🚀 Getting Started

### Online Usage

Simply visit **[https://michaldakowicz.github.io/cv-genius/](https://michaldakowicz.github.io/cv-genius/)** to start creating your CV immediately. No installation required!

### Local Development

1. Clone the repository:

    ```bash
    git clone https://github.com/MichalDakowicz/cv-genius.git
    cd cv-genius
    ```

2. Open `index.html` in your web browser or serve it using a local web server:

    ```bash
    # Using Python
    python -m http.server 8000

    # Using Node.js
    npx http-server
    ```

3. Navigate to `http://localhost:8000` in your browser

## 🤖 AI Setup

To use AI-powered suggestions:

1. **Get an OpenAI API Key**:

    - Visit [OpenAI API](https://platform.openai.com/api-keys)
    - Create an account and generate an API key

2. **Configure in CV Genius**:

    - Click the "AI Suggestions" button in the app
    - Enter your OpenAI API key when prompted
    - Select your preferred language for suggestions

3. **Start Getting Suggestions**:
    - Fill out your CV sections
    - Click "Generate AI Suggestions" to get personalized improvements
    - Apply suggestions or use them as inspiration

## 📱 Usage Instructions

### Creating Your CV

1. **Personal Information**: Fill in your name, contact details, and professional summary
2. **Add Sections**: Click "Add Section" and choose from Experience, Education, Skills, or create custom sections
3. **Fill Content**: Add your work experience, education, skills, and other relevant information
4. **AI Enhancement**: Use AI suggestions to improve your content
5. **Export**: Download as PDF or save your data as JSON

### Keyboard Shortcuts

-   **Ctrl/Cmd + S**: Quick save to local storage
-   **Ctrl/Cmd + P**: Print/Export to PDF
-   **Ctrl/Cmd + D**: Toggle dark mode

### Tips for Best Results

-   **Be Specific**: Provide detailed information for better AI suggestions
-   **Use Keywords**: Include relevant industry keywords in your descriptions
-   **Regular Updates**: Keep your CV updated with latest experiences
-   **Multiple Versions**: Create different versions for different job applications

## 🛠️ Technical Details

### Built With

-   **HTML5**: Semantic structure and accessibility
-   **CSS3**: Modern styling with CSS Grid and Flexbox
-   **JavaScript (ES6+)**: Modern JavaScript features and APIs
-   **Bootstrap 5**: Responsive design framework
-   **Font Awesome**: Beautiful icons
-   **jsPDF**: PDF generation
-   **OpenAI API**: AI-powered content suggestions

### Browser Support

-   Chrome 70+
-   Firefox 65+
-   Safari 12+
-   Edge 79+

### File Structure

```
cv-genius/
├── index.html          # Main application file
├── style.css          # Application styles
├── favicon.svg        # App icon
├── js/
│   ├── core.js        # Main application logic
│   ├── ai.js          # AI integration and suggestions
│   ├── export.js      # PDF export and data management
│   ├── personal-info.js # Personal information handling
│   ├── sections.js    # CV sections management
│   ├── ui.js          # User interface interactions
│   └── utils.js       # Utility functions
└── README.md          # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

-   Dark mode button placement needs adjustment on mobile devices
-   Some emojis could be replaced with proper icons
-   Website section link selection needs improvement

See [TODOS.md](TODOS.md) for a complete list of planned improvements.

## 🎯 Roadmap

-   [ ] More section types (Projects, Publications, Languages)
-   [ ] Drag and drop reordering
-   [ ] Bulk editing capabilities
-   [ ] Custom CV templates
-   [ ] Export to multiple formats (Word, HTML)
-   [ ] Real-time collaboration
-   [ ] CV analytics and optimization tips

## 💡 Support

If you encounter any issues or have suggestions:

1. Check the [Issues](https://github.com/MichalDakowicz/cv-genius/issues) page
2. Create a new issue with detailed description
3. Contact the developer: [GitHub Profile](https://github.com/MichalDakowicz)

---

**Made with ❤️ by [Michał Dakowicz](https://github.com/MichalDakowicz)**

Create your perfect CV today at **[https://michaldakowicz.github.io/cv-genius/](https://michaldakowicz.github.io/cv-genius/)**
