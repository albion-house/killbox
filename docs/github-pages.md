# GitHub Pages Publishing

This repository publishes the playable game to GitHub Pages from GitHub Actions on every push.

The canonical hosted URL is <https://albion-house.github.io/killbox/>.

Repository settings must allow GitHub Pages deployment from GitHub Actions:

1. Open Settings > Pages.
2. Set Source to GitHub Actions.

The workflow publishes the static site from `src/`, with `src/index.html` forwarding visitors to `src/killbox.html`.

After repository transfers or Pages setting changes, run the `Publish GitHub Pages` workflow manually from the Actions tab if a new push is not otherwise needed.
