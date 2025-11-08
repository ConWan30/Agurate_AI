# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Skip to main content" [ref=e3] [cursor=pointer]:
      - /url: "#main-content"
    - region "Notifications (F8)":
      - list
    - region "Notifications alt+T"
    - generic [ref=e5]:
      - status "Loading" [ref=e6]
      - paragraph [ref=e7]: Loading...
  - generic [ref=e10]:
    - generic [ref=e11]: "[plugin:vite:react-swc] x await isn't allowed in non-async function ,-[C:/Users/Contr/AguarateAI.Lovable/agurateai-a2947a8c/src/pages/Upload.tsx:101:1] 98 | // Compress image before setting (for images only) 99 | if (!isVideo && file.type.startsWith('image/')) { 100 | try { 101 | const { compressImage, validateImageFile } = await import('@/lib/image-optimization'); : ^^^^^ 102 | const validation = validateImageFile(file); 103 | if (!validation.valid) { 103 | toast({ `---- x await isn't allowed in non-async function ,-[C:/Users/Contr/AguarateAI.Lovable/agurateai-a2947a8c/src/pages/Upload.tsx:111:1] 108 | }); 109 | return; 110 | } 111 | const compressed = await compressImage(file); : ^^^^^ 112 | setSelectedFile(compressed); 113 | setPreviewUrl(URL.createObjectURL(compressed)); 113 | } catch (error) { `---- Caused by: Syntax Error"
    - generic [ref=e12]: C:/Users/Contr/AguarateAI.Lovable/agurateai-a2947a8c/src/pages/Upload.tsx
    - generic [ref=e13]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e14]: server.hmr.overlay
      - text: to
      - code [ref=e15]: "false"
      - text: in
      - code [ref=e16]: vite.config.ts
      - text: .
```