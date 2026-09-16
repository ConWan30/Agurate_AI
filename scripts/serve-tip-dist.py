#!/usr/bin/env python3
"""Serve dist/ with SPA fallback for tip publish verification."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "dist"
PORT = 4173


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        rel = self.path.lstrip("/").split("?", 1)[0]
        path = ROOT / rel
        if self.path in ("/", "") or (
            not path.exists()
            and not rel.startswith("assets/")
            and "." not in Path(rel).name
        ):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        print(f"[tip-static] {self.address_string()} - {fmt % args}", flush=True)


if __name__ == "__main__":
    if not ROOT.exists():
        raise SystemExit(f"missing dist at {ROOT}")
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"[tip-static] serving {ROOT} on http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()
