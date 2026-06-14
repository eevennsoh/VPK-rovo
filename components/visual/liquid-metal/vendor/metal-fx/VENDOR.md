# metal-fx Vendor Metadata

- Source repository: `https://github.com/Jakubantalik/metal-fx`
- Source commit: `be1bf89c63056521a4e8224f368768314c9006f7`
- Upstream package: `metal-fx@1.0.4`
- License: `MIT`
- Archive SHA-256: `12a11d9129477083b86ca3ba52fe29de2dc92ce0364a2058b68c637497a32d0d`

## Vendored Files

- `src/**`
- `LICENSE`
- `README.md`

The upstream files above were copied from the commit archive, then patched locally for VPK integration:

- Preserve consumer `:focus-visible` border, outline, and ring styles while normalizing idle child chrome.
- Keep shader preset/theme state per `MetalFx` instance so mixed demo examples can render independent materials on one page.
