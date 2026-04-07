class TemplateSwitch extends HTMLElement {
  constructor() {
    super();
    this.routes = [];
    this._initialContent = "";
    this._notFoundEl = null;
  }

  connectedCallback() {
    this._initialContent = this.innerHTML;
    this.init();
    
    window.addEventListener("popstate", () => this.updateVisibility());
    
    this.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link && link.href) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          if (window.location.pathname !== url.pathname) {
            history.pushState(null, "", url.pathname);
            this.updateVisibility();
          }
        }
      }
    });

    this.updateVisibility();
  }

  init() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this._initialContent, 'text/html');
    
    const layoutTmpl = doc.querySelector('template#ts-layout');
    let layoutHtml = layoutTmpl ? layoutTmpl.innerHTML : "{{ content }}";
    layoutHtml = layoutHtml.replace('{{ title }}', '<span id="ts-title"></span>');
    this.innerHTML = layoutHtml;

    const routesTmpl = doc.querySelector('template#ts-routes');
    if (routesTmpl) {
      const routeTemplates = routesTmpl.content.querySelectorAll('template[path]');
      const container = document.createElement('div');
      container.id = "ts-view-stack";

      this.routes = Array.from(routeTemplates).map(tmpl => {
        const path = tmpl.getAttribute('path');
        const section = document.createElement('section');
        section.setAttribute('data-path', path);
        section.style.display = 'none';
        
        const content = tmpl.content.cloneNode(true);
        section.appendChild(content);
        container.appendChild(section);

        return {
          path,
          element: section,
          title: tmpl.getAttribute('title') || 'Page',
          regex: this.pathToRegex(path),
          raw: tmpl.innerHTML.includes('{{') ? tmpl.innerHTML : null 
        };
      });

      // Create a hidden 404 section automatically
      this._notFoundEl = document.createElement('section');
      this._notFoundEl.style.display = 'none';
      this._notFoundEl.innerHTML = `<article><h1>404</h1><p>Page not found.</p><a href="/">Return Home</a></article>`;
      container.appendChild(this._notFoundEl);

      const main = this.querySelector('main') || this;
      main.innerHTML = ""; 
      main.appendChild(container);

      this.executeScripts(container);
    }
  }

  executeScripts(container) {
    container.querySelectorAll("script").forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  pathToRegex(path) {
    const pattern = path.replace(/:(\w+)/g, '(?<$1>[^/]+)');
    return new RegExp(`^${pattern}$`);
  }

  interpolate(str, params) {
    return str.replace(/{{\s*(\w+)\s*}}/g, (original, key) => {
      return Object.hasOwn(params, key) ? params[key] : original;
    });
  }

  updateVisibility() {
    const path = window.location.pathname;
    let matchedRoute = null;

    // Hide everything first, including the 404
    if (this._notFoundEl) this._notFoundEl.style.display = 'none';

    this.routes.forEach(route => {
      const match = path.match(route.regex);
      const isMatch = !!match;
      const el = route.element;
      
      if (isMatch) {
        matchedRoute = route;
        el.style.display = 'block';
        
        if (route.raw) {
          const groups = match.groups || {};
          el.innerHTML = this.interpolate(route.raw, groups);
        }
      } else {
        el.style.display = 'none';
      }
    });

    const titleSpan = this.querySelector('#ts-title');

    if (matchedRoute) {
      document.title = matchedRoute.title;
      if (titleSpan) titleSpan.textContent = matchedRoute.title;
    } else {
      // SHOW 404
      document.title = "404 - Not Found";
      if (titleSpan) titleSpan.textContent = "Error";
      if (this._notFoundEl) this._notFoundEl.style.display = 'block';
    }
  }
}

customElements.define("template-switch", TemplateSwitch);
