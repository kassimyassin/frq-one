"""Preview the site on this computer, never from a stale browser cache. Local only, standard library only.

    python website/serve.py            # http://localhost:4173
    python website/serve.py 8080       # another port

Serves website/public exactly as a host would, but tells the browser not to keep copies, so an edited
file shows on the next reload. Only this computer can reach it.
"""
import functools
import http.server
import sys
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent / 'public'


class Fresh(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Fresh, directory=str(PUBLIC)))
    print(f'Serving {PUBLIC} at http://localhost:{port}', flush=True)
    server.serve_forever()
