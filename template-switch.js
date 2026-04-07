class TemplateSwitch extends HTMLElement {
  constructor() {
    super();
    this.routes = [];
    this._notFoundEl = null;
  }

  connectedCallback() {
    // 1. Capture the templates before they are moved/cleared
    const layoutTmpl = this.querySelector('template#ts-layout');
    const routesTmpl = this.querySelector('template#ts-routes');

    if (!layoutTmpl || !routesTmpl) {
      console.error("TemplateSwitch: Missing ts-layout or ts-routes.");
      return;
    }

    this.init(layoutTmpl, routesTmpl);

    window.addEventListener("popstate", () => this.updateVisibility());
    this.addEventListener("click", (e) => this.handleLinkClick(e));

    this.updateVisibility();
  }

  init(layoutTmpl, routesTmpl) {
    // 1. Prepare Layout
    // We use innerHTML here to easily replace the {{ title }} and {{ content }} strings
    let layoutHtml = layoutTmpl.innerHTML;
    layoutHtml = layoutHtml.replace('{{ title }}', '<span id="ts-title"></span>');
    this.innerHTML = layoutHtml;

    // 2. Prepare Routes Stack
    const container = document.createElement('div');
    container.id = "ts-view-stack";

    // Grab all nested templates inside the routes template
    const routeTemplates = routesTmpl.content.querySelectorAll('template[path]');

    this.routes = Array.from(routeTemplates).map(tmpl => {
      const path = tmpl.getAttribute('path');
      const section = document.createElement('section');
      section.setAttribute('data-path', path);
      section.style.display = 'none';

      // Use the clean cloneNode method you suggested
      const content = tmpl.content.cloneNode(true);
      section.appendChild(content);
      container.appendChild(section);

      return {
        path,
        element: section,
        title: tmpl.getAttribute('title') || 'Page',
        regex: this.pathToRegex(path),
        // Keep raw HTML only for routes with placeholders
        raw: tmpl.innerHTML.includes('{{') ? tmpl.innerHTML : null
      };
    });

    // 3. Add Default 404
    this._notFoundEl = document.createElement('section');
    this._notFoundEl.style.display = 'none';
    this._notFoundEl.innerHTML = `<article><h1>404</h1><p>Page not found.</p><a href="/">Home</a></article>`;
    container.appendChild(this._notFoundEl);

    // 4. Inject into Layout
    const main = this.querySelector('main') || this;
    // If the user didn't use a <main> tag, find where {{ content }} was placed
    if (this.innerHTML.includes('{{ content }}')) {
       this.innerHTML = this.innerHTML.replace('{{ content }}', '<div id="ts-placeholder"></div>');
       this.querySelector('#ts-placeholder').replaceWith(container);
    } else {
       main.appendChild(container);
    }
  }

  handleLinkClick(e) {
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

    if (this._notFoundEl) this._notFoundEl.style.display = 'none';

    this.routes.forEach(route => {
      const match = path.match(route.regex);
      if (match) {
        matchedRoute = route;
        route.element.style.display = 'block';
        if (route.raw) {
          route.element.innerHTML = this.interpolate(route.raw, match.groups || {});
        }
      } else {
        route.element.style.display = 'none';
      }
    });

    const titleSpan = this.querySelector('#ts-title');
    if (matchedRoute) {
      document.title = matchedRoute.title;
      if (titleSpan) titleSpan.textContent = matchedRoute.title;
    } else {
      document.title = "404 - Not Found";
      if (titleSpan) titleSpan.textContent = "Error";
      if (this._notFoundEl) this._notFoundEl.style.display = 'block';
    }
  }
}

customElements.define("template-switch", TemplateSwitch);
