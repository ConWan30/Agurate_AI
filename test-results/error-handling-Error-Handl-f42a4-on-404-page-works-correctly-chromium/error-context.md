# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e5]:
    - heading "404" [level=1] [ref=e6]
    - paragraph [ref=e7]: Oops! Page not found
    - link "Return to Home" [ref=e8] [cursor=pointer]:
      - /url: /
```