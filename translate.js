(function() {
  const LANGUAGES = {
    en: { name: 'English', native: 'English' },
    es: { name: 'Spanish', native: 'EspaÃ±ol' },
    fr: { name: 'French', native: 'FranÃ§ais' },
    de: { name: 'German', native: 'Deutsch' },
    it: { name: 'Italian', native: 'Italiano' },
    pt: { name: 'Portuguese', native: 'PortuguÃªs' },
    ru: { name: 'Russian', native: 'Ð ÑƒÑÑÐºÐ¸Ð¹' },
    zh: { name: 'Chinese', native: 'ä¸­æ–‡' },
    ja: { name: 'Japanese', native: 'æ—¥æœ¬èªž' },
    ko: { name: 'Korean', native: 'í•œêµ­ì–´' },
    ar: { name: 'Arabic', native: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' }
  };

  class WebsiteTranslator {
    constructor(websiteId) {
      this.websiteId = websiteId;
      this.translations = {};
      this.currentLanguage = localStorage.getItem('translator_language') || 'en';
      this.init();
    }

    async init() {
      try {
        // In WebContainer environment, we'll use a mock API response
        this.translations = {
          es: {
            'Hello': 'Â¡Hola!',
            'Welcome': 'Â¡Bienvenido!',
          },
          fr: {
            'Hello': 'Bonjour!',
            'Welcome': 'Bienvenue!',
          }
        };
        
        this.injectStyles();
        this.setupLanguageSelector();
        this.translatePage();
      } catch (error) {
        console.error('Failed to initialize translator:', error);
      }
    }

    injectStyles() {
      const styles = `
        .translator-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .translator-button {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #1a202c;
          transition: all 0.2s;
        }
        .translator-button:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .translator-dropdown {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          width: 200px;
          max-height: 300px;
          overflow-y: auto;
        }
        .translator-search {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .translator-search input {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 14px;
        }
        .translator-languages {
          padding: 4px 0;
        }
        .translator-language {
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
        }
        .translator-language:hover {
          background: #f7fafc;
        }
        .translator-language.active {
          background: #ebf8ff;
          color: #2b6cb0;
        }
        .translator-language-code {
          color: #718096;
          font-size: 12px;
        }
      `;

      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    setupLanguageSelector() {
      const container = document.createElement('div');
      container.className = 'translator-container';
      
      const button = document.createElement('button');
      button.className = 'translator-button';
      button.innerHTML = `
        <span>ðŸŒ</span>
        <span>${LANGUAGES[this.currentLanguage].native}</span>
      `;
      
      const dropdown = document.createElement('div');
      dropdown.className = 'translator-dropdown';
      dropdown.style.display = 'none';
      
      const searchContainer = document.createElement('div');
      searchContainer.className = 'translator-search';
      searchContainer.innerHTML = `
        <input type="text" placeholder="Search languages..." />
      `;
      
      const languagesList = document.createElement('div');
      languagesList.className = 'translator-languages';
      
      // Populate languages
      this.updateLanguagesList(languagesList);
      
      dropdown.appendChild(searchContainer);
      dropdown.appendChild(languagesList);
      
      // Event listeners
      button.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });
      
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
      
      const searchInput = searchContainer.querySelector('input');
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        this.updateLanguagesList(languagesList, query);
      });
      
      container.appendChild(button);
      container.appendChild(dropdown);
      document.body.appendChild(container);
    }

    updateLanguagesList(container, searchQuery = '') {
      container.innerHTML = '';
      Object.entries(LANGUAGES)
        .filter(([code, lang]) => {
          const searchString = `${lang.name} ${lang.native} ${code}`.toLowerCase();
          return searchString.includes(searchQuery);
        })
        .forEach(([code, lang]) => {
          const langElement = document.createElement('div');
          langElement.className = `translator-language ${code === this.currentLanguage ? 'active' : ''}`;
          langElement.innerHTML = `
            <span>${lang.native}</span>
            <span class="translator-language-code">${code.toUpperCase()}</span>
          `;
          
          langElement.addEventListener('click', () => {
            this.setLanguage(code);
          });
          
          container.appendChild(langElement);
        });
    }

    translate(text) {
      if (this.currentLanguage === 'en') return text;
      return this.translations[this.currentLanguage]?.[text] || text;
    }

    setLanguage(lang) {
      this.currentLanguage = lang;
      localStorage.setItem('translator_language', lang);
      this.translatePage();
      
      // Update button text
      const button = document.querySelector('.translator-button');
      if (button) {
        button.innerHTML = `
          <span>ðŸŒ</span>
          <span>${LANGUAGES[this.currentLanguage].native}</span>
        `;
      }
      
      // Update active state in dropdown
      const languages = document.querySelectorAll('.translator-language');
      languages.forEach(el => {
        el.classList.toggle('active', el.querySelector('.translator-language-code').textContent.toLowerCase() === lang.toUpperCase());
      });
      
      // Hide dropdown
      const dropdown = document.querySelector('.translator-dropdown');
      if (dropdown) {
        dropdown.style.display = 'none';
      }
    }

    translatePage() {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip script and style contents
            if (node.parentElement?.tagName === 'SCRIPT' || 
                node.parentElement?.tagName === 'STYLE') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text) {
          node.textContent = this.translate(text);
        }
      }
    }
  }

  // Initialize the translator
  const script = document.currentScript;
  const websiteId = script.dataset.websiteId;
  window.translator = new WebsiteTranslator(websiteId);
})();
