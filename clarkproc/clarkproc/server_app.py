"""Entry file for python server."""
import logging
import os
import sys

from appdirs import user_data_dir
from flask import request
import werkzeug

from clarkproc import state
from clarkproc.server_setup import app


APPDIR = user_data_dir('clark', appauthor=False, roaming=True)
if not os.path.exists(APPDIR):
    os.makedirs(APPDIR)
logging.basicConfig(
    filename=os.path.join(APPDIR, 'clark-server.log'),
    format="[%(asctime)s: %(levelname)s/%(name)s(%(processName)s)]: %(message)s",
    level=logging.DEBUG,
)

LOGGER = logging.getLogger(__name__)


@app.route('/ping')
def startup_ping():
    """Tells the UI that the server is running."""
    return 'PONG', 200


@app.route('/reset')
def reset():
    """Reset state held in server."""
    try:
        state.reset()
        return {"reset": True}, 200
    except:
        return 'Failed to reset.', 500


def shutdown_server():
    """Shut down the server after handling current requests."""
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running the server')
    func()

@app.route('/shutdown')
def shutdown():
    """Allow frontend to shut down server."""
    shutdown_server()
    return 'Server is shutting down...'


@app.errorhandler(Exception)
def handle_error(ex):
    """Handle all server errors."""
    if isinstance(ex, werkzeug.exceptions.HTTPException):
        return ex
    LOGGER.exception(ex)
    return "Internal server error. See the logs for details.", 500


if __name__ == '__main__':
    config = sys.argv[1:]

    server_host = config[1]
    server_port = int(config[2])

    app.run(
        host=server_host,
        port=server_port,
        debug=False,
        use_reloader=False,
    )
