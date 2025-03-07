class AutoTranslator {
  constructor(apiKey, targetSelector = 'body') {
    this.apiKey = apiKey;
    this.targetSelector = targetSelector;
    this.originalContent = {};
    this.currentLanguage = 'en';
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
    `;

    let selectHTML = `
      <select id="language-select">
        <option value="original">Original</option>
    `;
    
    for (const [code, name] of Object.entries(this.supportedLanguages)) {
      selectHTML += `<option value="${code}">${name}</option>`;
    }
    
    selectHTML += `</select>`;
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
    const elements = [];
    
    // Select elements that typically contain translatable text
    const selectors = [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'a', 'button', 'li', 'span', 'div:not(:has(*))',
      'label', 'td', 'th'
    ];
    
    selectors.forEach(selector => {
      const selectedElements = container.querySelectorAll(selector);
      selectedElements.forEach(el => {
        // Check if the element has text and isn't just whitespace
        if (el.innerText && el.innerText.trim() !== '' && !elements.includes(el)) {
          // Skip elements that only contain other translated elements
          if (el.children.length === 0 || el.innerText !== Array.from(el.children).map(c => c.innerText).join('')) {
            elements.push(el);
          }
        }
      });
    });
    
    return elements;
  }

  addEventListeners() {
    document.getElementById('language-select').addEventListener('change', async (e) => {
      const langCode = e.target.value;
      
      if (langCode === 'original') {
        this.restoreOriginalContent();
        return;
      }
      
      if (langCode === this.currentLanguage) return;
      
      this.currentLanguage = langCode;
      await this.translatePage(langCode);
    });
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
    
    // Group text in batches to minimize API calls
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    for (const batch of batches) {
      const textsToTranslate = batch.map((el, i) => {
        const index = elements.indexOf(el);
        return this.originalContent[index] || el.innerText;
      });
      
      try {
        const translatedTexts = await this.translateTexts(textsToTranslate, targetLanguage);
        
        batch.forEach((element, i) => {
          if (translatedTexts[i]) {
            element.innerText = translatedTexts[i];
          }
        });
      } catch (error) {
        console.error('Translation error:', error);
      }
    }
  }

 async translateTexts(texts, targetLanguage) {
  if (texts.length === 0) return [];
  
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        texts,
        targetLanguage: this.supportedLanguages[targetLanguage]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || `Server error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translatedTexts;
  } catch (error) {
    console.error('Translation API error:', error);
    throw error;
  }
}

}

// Usage:
document.addEventListener('DOMContentLoaded', () => {
  // Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI API key
  const translator = new AutoTranslator('sk-proj-OUmqCzaUiYeq4ZAcRKvaT3BlbkFJf8hSzUTCZq8kxe286woN');
  translator.init();
});
