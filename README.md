
# ➤ Template Switch

A tiny, zero-dependency, **Single Page Application (SPA)** router for the modern web. Inspired by `template-router`, but built for **instantaneous transitions** by pre-loading all routes and toggling their visibility.

----------

## 🚀 Quick Start

The fastest way to use **Template Switch** is via the [esm.sh](https://esm.sh) CDN.

```html
<script type="module" src="https://esm.sh/gh/rodezee/template-switch"></script>

```

----------

## ✨ Key Features

-   **Zero Latency:** All routes are rendered once into the DOM. Switching "pages" is as fast as a CSS `display: block` change.
    
-   **State Persistence:** Because DOM nodes aren't destroyed, scroll positions, form inputs, and JS variables stay exactly where you left them.
    
-   **Zero Dependencies:** No React, no Vue, no Build Tools. Just standard Web Components and `<template>` tags.
    
-   **Auto-Layout:** Define a global wrapper once; inject content dynamically.
    
-   **URL Params:** Supports dynamic routing (e.g., `/user/:id`) with automatic interpolation.
    

----------

## 🛠️ Usage

Wrap your application in the `<template-switch>` tag. Define your layout and your routes using nested `<template>` tags.

### 1. Define the Layout

Use the `ts-layout` ID. Use `{{ title }}` for the page title and `{{ content }}` where the routes should appear.

### 2. Define the Routes

Use the `ts-routes` ID. Each child template needs a `path` and an optional `title`.

```html
<template-switch>
  <template id="ts-layout">
    <nav>
      <a href="/">Home</a>
      <a href="/counter">Counter</a>
    </nav>
    <main>
      <h1>Currently viewing: {{ title }}</h1>
      <hr>
      {{ content }}
    </main>
  </template>

  <template id="ts-routes">
    <template path="/" title="Welcome">
      <p>This is the home page, loaded instantly.</p>
    </template>

    <template path="/counter" title="Persistent Counter">
      <p>Count: <strong id="val">0</strong></p>
      <button id="inc">Increment</button>
      <script>
        // This runs once on load and stays active!
        let count = 0;
        const btn = document.getElementById('inc');
        const display = document.getElementById('val');
        btn.onclick = () => display.textContent = ++count;
      </script>
    </template>

    <template path="/hello/:name" title="Greeting">
      <p>Hello, {{ name }}! This param was pulled from the URL.</p>
    </template>
  </template>
</template-switch>

```

----------

## 🧠 How it Works

Unlike traditional routers that fetch new content or wipe the `innerHTML`, **Template Switch** performs a "Dom Stack" maneuver:

1.  **Initial Load:** It reads all your templates and creates hidden `<section>` tags for every route.
    
2.  **Navigation:** When the URL changes (via `popstate` or link clicks), it hides the current section and shows the one matching the new path.
    
3.  **Interpolation:** If a path contains a parameter (like `:name`), it replaces `{{ name }}` in that section's HTML before showing it.
    

----------

## 💡 Advanced Advice

### Scoped Scripting

Since all routes exist in the same document, global variables can clash. It is recommended to wrap your route scripts in an **IIFE**:

```html
<script>
  (() => {
    const privateVar = "I won't leak!";
    console.log(privateVar);
  })();
</script>

```

### 4.0.4 Handling

If a user visits a URL that doesn't match any defined `path`, the component automatically displays a built-in 404 message. You can customize this by adding a template with `path="404"` inside your `ts-routes`.

----------

## 📜 License

MIT © [rodezee](https://www.google.com/search?q=https://github.com/rodezee)

