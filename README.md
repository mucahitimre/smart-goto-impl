# Smart Go to Implementation

VS Code extension for C#. Single implementation opens directly in editor; multiple implementations populate VS Code's built-in **References View** panel (Bottom Panel) — no Peek popup.

---

## 🇹🇷 Türkçe

### Ne yapar?

C# interface metodunda `Ctrl+Shift+G` (`Cmd+Shift+G` mac):

- **Tek implementasyon** → editor'da direkt açılır
- **Birden fazla** → References View paneline yazılır (kalıcı bottom panel)
- **Hiç yok** → bilgi mesajı: "İmplementasyon bulunamadı."

VS Code default `editor.action.goToImplementation` davranışı Peek popup'ı açar; bu eklenti kalıcı panel UX'i sağlar.

### Kurulum

```bash
code --install-extension smart-goto-impl-0.0.1.vsix
```

### Tek Seferlik Setup — References View'ı Bottom Panel'e Taşı

İlk çoklu-impl çağrısında References View Side Bar'da açılır. Drag-drop ile **Bottom Panel'e taşı** (panelin başlığını tutup aşağı sürükle). VS Code bu konumu hatırlar; sonraki çağrılar Bottom Panel'de açılır.

### Keybinding Notu

`Ctrl+Shift+G` default'ta Source Control panel'i açar. Bu eklenti override eder. Kendi binding'ini istersen `keybindings.json`'da değiştir:

```json
{
  "key": "ctrl+alt+g",
  "command": "smart-goto-impl.goToImplementation",
  "when": "editorTextFocus && editorLangId == 'csharp'"
}
```

### Bilinen Kısıtlar

- **C# Dev Kit** veya **OmniSharp (C#)** extension'ı yüklü olmalı (implementation provider için)
- Sadece C# (`onLanguage:csharp`) — başka dil desteklenmiyor
- LSP henüz ayağa kalkmamışsa 1.5s timeout sonra "C# dil servisi hazır değil" mesajı

### Demo

> _(GIF placeholder — tek-impl ve çoklu-impl flow gösterir)_

---

## 🇬🇧 English

### What it does

On a C# interface method, press `Ctrl+Shift+G` (`Cmd+Shift+G` on Mac):

- **Single implementation** → opens directly in editor
- **Multiple** → fills built-in References View (Bottom Panel)
- **None** → info message

VS Code's default `editor.action.goToImplementation` opens a Peek popup. This extension uses the persistent panel UX instead.

### Install

```bash
code --install-extension smart-goto-impl-0.0.1.vsix
```

### One-time Setup — Move References View to Bottom Panel

First multi-impl invocation opens References View in Side Bar. Drag its title to the **Bottom Panel**. VS Code remembers the position.

### Keybinding Note

`Ctrl+Shift+G` defaults to Source Control. This extension overrides it. Change in `keybindings.json` if you want a different binding.

### Known Limitations

- Requires **C# Dev Kit** or **OmniSharp** for the implementation provider
- C# only
- 1.5s timeout if language server not ready

---

## Development

```bash
npm install
npm run compile        # esbuild bundle
npm run watch          # rebuild on change
npm run lint
npm test
npm run vsce:package   # produces .vsix
```

Press `F5` in VS Code to launch Extension Development Host.

### Files

- [src/extension.ts](src/extension.ts) — activate / command registration
- [src/implFinder.ts](src/implFinder.ts) — implementation lookup + navigation logic
- [src/test/suite/extension.test.ts](src/test/suite/extension.test.ts) — test suite
