import os
import json
from flask import request

from clarkproc import state
from clarkproc.server_setup import app


@app.route('/ping')
def startup_ping():
    return 'PONG', 200


@app.route('/reset')
def reset():
    try:
        state.reset()
        return {"reset": True}, 200
    except:
        return 'Failed to reset.', 500


@app.route('/shutdownoverride')
def shutdown():
    """Shut down the server after handling current requests."""
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running the server')
    func()
    return 'Server is shutting down...'


if __name__ == '__main__':
    current_dir = os.getcwd()
    this_file_path = os.path.dirname(os.path.abspath(__file__))
    config_file = 'config.json'

    config_full_file = os.path.join(current_dir, config_file)
    if os.path.isfile(config_full_file):
        with open(config_full_file) as f:
            config = json.load(f)
    else:
        config_full_file = os.path.join(this_file_path, config_file)
        if os.path.isfile(config_full_file):
            with open(config_full_file) as f:
                config = json.load(f)
        else:
            raise Exception("Couldn't find config.json")

    server_host = config['host']
    server_port = int(config['port'])

    app.run(
        host=server_host,
        port=server_port,
        debug=False,
        use_reloader=False,
    )
