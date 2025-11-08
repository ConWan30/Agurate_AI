# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:react-swc] x await isn't allowed in non-async function ,-[C:/Users/Contr/AguarateAI.Lovable/agurateai-a2947a8c/src/pages/Upload.tsx:101:1] 98 | // Compress image before setting (for images only) 99 | if (!isVideo && file.type.startsWith('image/')) { 100 | try { 101 | const { compressImage, validateImageFile } = await import('@/lib/image-optimization'); : ^^^^^ 102 | const validation = validateImageFile(file); 103 | if (!validation.valid) { 103 | toast({ `---- x await isn't allowed in non-async function ,-[C:/Users/Contr/AguarateAI.Lovable/agurateai-a2947a8c/src/pages/Upload.tsx:111:1] 108 | }); 109 | return; 110 | } 111 | const compressed = await compressImage(file); : ^^^^^ 112 | setSelectedFile(compressed); 113 | setPreviewUrl(URL.createObjectURL(compressed)); 113 | } catch (error) { `---- Caused by: Syntax Error"
  - generic [ref=e5]: C:/Users/Contr/AguarateAI.Lovable/agurateai-a2947a8c/src/pages/Upload.tsx
  - generic [ref=e6]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e7]: server.hmr.overlay
    - text: to
    - code [ref=e8]: "false"
    - text: in
    - code [ref=e9]: vite.config.ts
    - text: .
```