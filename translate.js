/**
 * Website Auto-Translator
 * Uses a server-side proxy to securely translate page content
 * 
 * Usage: 
 * <script src="https://your-github-repo.github.io/translate.js"></script>
 */
class AutoTranslator {
  constructor(apiEndpoint = '/api/translate') {
    this.apiEndpoint = apiEndpoint;
    this.targetSelector = 'body';
    this.originalContent = {};
    this.currentLanguage = 'en';
    this.translationInProgress = false;
    this.supportedLanguages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ru': 'Russian',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
  }

  init() {
    this.createLanguageSelector();
    this.storeOriginalContent();
    this.addEventListeners();
    console.log("AutoTranslator initialized with", Object.keys(this.originalContent).length, "translatable elements");
  }

  createLanguageSelector() {
    const selector = document.createElement('div');
    selector.className = 'language-selector';
    selector.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      padding: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    let selectHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <span style="margin-right: 8px;">🌐</span>
        <select id="language-select" style="padding: 5px; border-radius: 3px; border: 1px solid #ccc;">
          <option value="original">Original</option>
    `;
    
    for (const [code, name] of Object.entries(this.supportedLanguages)) {
      selectHTML += `<option value="${code}">${name}</option>`;
    }
    
    selectHTML += `</select></div>`;
    
    // Add a status indicator
    selectHTML += `<div id="translation-status" style="font-size: 12px; color: #666; margin-top: 5px;"></div>`;
    
    selector.innerHTML = selectHTML;
    document.body.appendChild(selector);
  }

  storeOriginalContent() {
    const elements = this.getTranslatableElements();
    elements.forEach((element, index) => {
      this.originalContent[index] = element.innerText.trim();
    });
  }

  getTranslatableElements() {
    const container = document.querySelector(this.targetSelector);
    if (!container) {
      console.error(`Target selector '${this.targetSelector}' not found`);
      return [];
    }
    
    const elements = [];
    
    // Improved selector for translatable content
    const selectors = [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'a:not([href^="#"])', 'button', 'li', 
      'label', 'td', 'th'
    ];
    
    selectors.forEach(selector => {
      const selectedElements = container.querySelectorAll(selector);
      selectedElements.forEach(el => {
        // Only include elements with direct text content
        const hasTextContent = Array.from(el.childNodes).some(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
        
        if (hasTextContent && !el.closest('.language-selector')) {
          // Skip elements with no text or already included
          if (el.innerText.trim() !== '' && !elements.includes(el)) {
            elements.push(el);
          }
        }
      });
    });
    
    // Add special handling for spans and divs with direct text
    const textContainers = container.querySelectorAll('span, div');
    textContainers.forEach(el => {
      // Check if it has direct text content not coming from child elements
      let directText = '';
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          directText += node.textContent;
        }
      }
      
      if (directText.trim() !== '' && !el.closest('.language-selector')) {
        // Skip elements with no text or already included
        if (!elements.includes(el)) {
          elements.push(el);
        }
      }
    });
    
    return elements;
  }

  addEventListeners() {
    const selectElement = document.getElementById('language-select');
    if (!selectElement) {
      console.error("Language select element not found");
      return;
    }
    
    selectElement.addEventListener('change', async (e) => {
      const langCode = e.target.value;
      
      if (this.translationInProgress) {
        this.updateStatus("Translation already in progress, please wait...");
        return;
      }
      
      if (langCode === 'original') {
        this.updateStatus("Restoring original content...");
        this.restoreOriginalContent();
        this.updateStatus("Original content restored");
        return;
      }
      
      if (langCode === this.currentLanguage) return;
      
      this.currentLanguage = langCode;
      this.translationInProgress = true;
      
      try {
        this.updateStatus(`Translating to ${this.supportedLanguages[langCode]}...`);
        await this.translatePage(langCode);
        this.updateStatus(`Page translated to ${this.supportedLanguages[langCode]}`);
      } catch (error) {
        console.error("Translation failed:", error);
        this.updateStatus("Translation failed. Please try again later.");
      } finally {
        this.translationInProgress = false;
      }
    });
  }

  updateStatus(message) {
    const statusElement = document.getElementById('translation-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  restoreOriginalContent() {
    const elements = this.getTranslatableElements();
    elements.forEach((element, index) => {
      if (this.originalContent[index]) {
        element.innerText = this.originalContent[index];
      }
    });
    
    this.currentLanguage = 'en';
  }

  async translatePage(targetLanguage) {
    const elements = this.getTranslatableElements();
    if (elements.length === 0) {
      console.error("No translatable elements found");
      return;
    }
    
    // Group text in smaller batches to avoid token limits
    const batchSize = 8;
    const batches = [];
    
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    let completedBatches = 0;
    for (const batch of batches) {
      const textsToTranslate = batch.map(el => {
        const index = elements.indexOf(el);
        return this.originalContent[index] || el.innerText.trim();
      }).filter(text => text.length > 0);
      
      if (textsToTranslate.length === 0) continue;
      
      try {
        const translatedTexts = await this.translateTexts(textsToTranslate, targetLanguage);
        
        let translationIndex = 0;
        batch.forEach((element) => {
          const elementText = element.innerText.trim();
          if (elementText && elementText.length > 0) {
            if (translatedTexts[translationIndex]) {
              element.innerText = translatedTexts[translationIndex];
              translationIndex++;
            }
          }
        });
        
        completedBatches++;
        this.updateStatus(`Translating... ${Math.round((completedBatches / batches.length) * 100)}%`);
      } catch (error) {
        console.error('Translation error:', error);
        throw error;
      }
      
      // Add a small delay between batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  async translateTexts(texts, targetLanguage) {
    if (texts.length === 0) return [];
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          texts,
          targetLanguage
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.translatedTexts) {
        throw new Error("Invalid server response");
      }
      
      return data.translatedTexts;
    } catch (error) {
      console.error('Translation API error:', error);
      throw error;
    }
  }
}

// Initialize the translator
document.addEventListener('DOMContentLoaded', () => {
  // Default endpoint is relative (/api/translate)
  // Can be overridden by setting window.TRANSLATE_API_ENDPOINT
  const apiEndpoint = 'http://localhost:3000/api/translate';
  
  // Initialize after a short delay to ensure all content is loaded
  setTimeout(() => {
    const translator = new AutoTranslator(apiEndpoint);
    translator.init();
  }, 1000);
});
