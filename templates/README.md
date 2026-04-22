# Templates

Each template lives in its own folder using its qualified name:

- `templates/default/`
- `templates/<your-template-name>/`

Each template folder must include a `template-config.json` file that declares:

- `html`: relative template html file path
- `styles`: relative css files
- `scripts`: relative js files (string or `{ "src": "...", "module": true }`)

Note:
- core component runtime scripts are injected by the build from `scripts/core/runtime/`
- template manifest scripts should remain template-specific

Global selection is in `portfolio-config.json`:

```json
{
  "templates": {
    "default": "default"
  }
}
```

Template naming:
- Use URL-safe names: lowercase letters, numbers, and `-` only.
- Recommended pattern: `^[a-z0-9-]+$`.

Per-page override remains declarative in page JSON:

```json
{
  "presentation": {
    "template": "research-grid"
  }
}
```
