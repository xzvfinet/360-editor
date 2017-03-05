import SimpleHTTPServer
import SocketServer
import time

port = 8000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

while True:
    time.sleep(0.1)
    try:
        httpd = SocketServer.TCPServer(('', port), Handler)
        print 'Serving on port', port
        httpd.serve_forever()
    except SocketServer.socket.error as exc:
        if exc.args[0] != 48:
            raise
        print 'Port', port, 'already in use. Retrying...'
    else:
        break

