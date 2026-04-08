class TemplateSwitch extends HTMLElement {
  constructor() {
    super();
    this.routeTemplates = [];
    this.instances = {};
    this._stack = null;
  }

  connectedCallback() {
    const layoutTmpl = this.querySelector('template#ts-layout');
    const routesTmpl = this.querySelector('template#ts-routes');
    if (!layoutTmpl || !routesTmpl) return;

    this._injectStyles();

    // 1. Updated Layout substitution to use %{ }%
    this.innerHTML = layoutTmpl.innerHTML
      .replace(/%{\s*title\s*}%/g, '<span id="ts-title"></span>')
      .replace(/%{\s*content\s*}%/g, '<div id="ts-view-stack"></div>');
    
    this._stack = this.querySelector('#ts-view-stack');

    const tmpls = routesTmpl.content.querySelectorAll('template[path]');
    this.routeTemplates = Array.from(tmpls).map(t => ({
      path: t.getAttribute('path'),
      title: t.getAttribute('title'),
      regex: this.pathToRegex(t.getAttribute('path')),
      raw: t.innerHTML
    }));

    window.addEventListener("popstate", () => this.updateVisibility());
    this.onclick = (e) => this.handleLink(e);
    this.updateVisibility();
  }

  _injectStyles() {
    const styleId = "ts-core-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #ts-view-stack > section {
        animation: tsFadeIn 0.35s ease-out;
      }
      @keyframes tsFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #ts-view-stack {
        display: grid;
        grid-template-areas: "stack";
      }
      #ts-view-stack > section {
        grid-area: stack;
      }
    `;
    document.head.appendChild(style);
  }

  handleLink(e) {
    const link = e.target.closest("a");
    if (link && link.href && new URL(link.href).origin === window.location.origin) {
      e.preventDefault();
      if (window.location.pathname !== new URL(link.href).pathname) {
        history.pushState(null, "", new URL(link.href).pathname);
        this.updateVisibility();
      }
    }
  }

  pathToRegex(path) {
    return new RegExp(`^${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`);
  }

  // 2. Updated Regex to match %{ variable }%
  interpolate(str, params) {
    return str.replace(/%{\s*(\w+)\s*}%/g, (_, key) => params[key] || "");
  }

  updateVisibility() {
    const path = window.location.pathname;
    const titleSpan = this.querySelector('#ts-title');
    
    Object.values(this.instances).forEach(el => el.style.display = 'none');

    if (this.instances[path]) {
      this.instances[path].style.display = 'block';
      document.title = this.instances[path].dataset.title;
      if (titleSpan) titleSpan.textContent = document.title;
      return;
    }

    let route = this.routeTemplates.find(r => path.match(r.regex));
    let is404 = false;

    if (!route) {
      route = this.routeTemplates.find(r => r.path === '404');
      is404 = true;
    }

    if (route) {
      const match = !is404 ? path.match(route.regex) : { groups: {} };
      const section = document.createElement('section');
      
      section.innerHTML = this.interpolate(route.raw, match.groups || {});
      section.dataset.title = route.title || (is404 ? "Not Found" : "Page");
      
      this._stack.appendChild(section);
      this.instances[path] = section;

      section.querySelectorAll("script").forEach(oldScript => {
        const newScript = document.createElement("script");
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      this.updateVisibility();
    } else {
      document.title = "404 - Not Found";
      if (titleSpan) titleSpan.textContent = "Error";
      this._stack.innerHTML += `<section><h1>404</h1><p>Page not found.</p><a href="/">Return Home</a></section>`;
    }
  }
}
customElements.define("template-switch", TemplateSwitch);
