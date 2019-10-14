"""Blueprint for session loading and saving endpoints."""
from flask import Blueprint, jsonify, request

import engine
import state

bp_session = Blueprint('session', __name__)

@bp_session.route('/session/state', methods=['GET'])
def session_state():
    """
    Give a brief summary of application state
    ---
    tags: ["Session"]
    responses:
        200:
            description: "Summary object specifying the contents of application state"
            content:
                application/json:
                    schema:
                        type: object
    """

    return state.summary()

@bp_session.route('/session/save', methods=['POST'])
def save_session():
    """
    Save the current application state as a session file
    ---
    tags: ["Session"]
    requestBody:
        description: "Specification of session save"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/session/to/save"
                            type: string
                        finished:
                            description: "flags indicated status of application steps"
                            type: object
                        config:
                            description: "current application machine learning configuration"
                            type: object
                    required: ["path","finished","config"]
    responses:
        200:
            description: "Session successfully saved"
            content:
                application/json:
                    schema:
                        type: object
                        schema:
                            saved: boolean
        428:
            description: "Unable to save the session at the requested path"
            content:
                text/plain:
                    schema:
                        type: string
    """

    filename = request.json.get("path")
    finished = request.json.get("finished")
    config = request.json.get("config")

    success = engine.io.save(filename, state.proc, state.corpus, state.test_corpus, state.classifier, state.last_result, finished, config)

    if success:
        return jsonify({"saved":True})
    else:
        return 'Could not save session file.', 428

@bp_session.route('/session/load', methods=['POST'])
def load_session():
    """
    Load application state from a session file
    ---
    tags: ["Session"]
    requestBody:
        description: "Specification of session load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/session/to/load"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Session loaded, session summary returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "Unable to load the session from the requested path"
            content:
                text/plain:
                    schema:
                        type: string
    """

    # try:
    filename = request.json.get('path')

    # try:
    data_dict = engine.io.load(filename)

    # Load everything into python memory
    state.proc = data_dict["proc"]
    state.corpus = data_dict["corpus"]
    corpus_tree = None
    if state.corpus:
        corpus_tree = state.corpus.get_patient_tree()

    state.classifier = data_dict["classifier"]
    state.last_result = data_dict["last_result"]

    state.test_corpus = data_dict["test_corpus"]
    finished = data_dict["finished"]
    config = data_dict["config"]

    test_corpus_tree = None
    if state.test_corpus:
        test_corpus_tree = state.test_corpus.get_patient_tree()

    sectionBreakData = state.proc.section_splitter.get_expression()
    sectionNameData = state.proc.feature_combiner.get_all_expressions_as_dict_with_valid()

    keywords = state.proc.feature_extractor.get_keyword_expressions()
    expressions = state.proc.feature_extractor.get_feature_expressions()

    # Package everything to feed back to the app.jsx
    out = {"keywords": keywords, "expressions": expressions, "finished": finished, "config": config, "corpus": corpus_tree, "lastResult": state.last_result, "testCorpus": test_corpus_tree, "sectionBreakData": sectionBreakData, "sectionNameData": sectionNameData}

    return jsonify(out)
    # except:
    #     return "Could not load session", 428
