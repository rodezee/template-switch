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

    // 1. Hardcode the animations into the document head
    this._injectStyles();

    // 2. Build Layout
    this.innerHTML = layoutTmpl.innerHTML
      .replace('{{ title }}', '<span id="ts-title"></span>')
      .replace('{{ content }}', '<div id="ts-view-stack"></div>');
    
    this._stack = this.querySelector('#ts-view-stack');

    // 3. Store blueprints
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

      /* Optional: ensure sections don't clash before they are hidden */
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

  interpolate(str, params) {
    return str.replace(/{{\s*(\w+)\s*}}/g, (_, key) => params[key] || "");
  }

  updateVisibility() {
    const path = window.location.pathname;
    
    Object.values(this.instances).forEach(el => el.style.display = 'none');

    if (this.instances[path]) {
      this.instances[path].style.display = 'block';
      document.title = this.instances[path].dataset.title;
      const titleSpan = this.querySelector('#ts-title');
      if (titleSpan) titleSpan.textContent = document.title;
      return;
    }

    const route = this.routeTemplates.find(r => path.match(r.regex));
    if (route) {
      const match = path.match(route.regex);
      const section = document.createElement('section');
      
      section.innerHTML = this.interpolate(route.raw, match.groups || {});
      section.dataset.title = route.title;
      
      this._stack.appendChild(section);
      this.instances[path] = section;

      section.querySelectorAll("script").forEach(oldScript => {
        const newScript = document.createElement("script");
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      this.updateVisibility();
    }
  }
}
customElements.define("template-switch", TemplateSwitch);
