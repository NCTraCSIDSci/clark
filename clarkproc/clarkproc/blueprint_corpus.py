"""Blueprint for corpus endpoints."""
import copy
from flask import Blueprint, jsonify, request

from . import engine
from . import state

bp_corpus = Blueprint('corpus', __name__)


def require_corpus(function):
    """Helper decorator to enforce a loaded corpus."""
    def func():
        if not state.corpus:
            return 'No corpus loaded.', 428
        function()
    return func


@bp_corpus.route('/corpus/load', methods=['POST'])
def load_corpus():
    """
    Load a corpus into application state given a path to the corpus.

    ---
    tags: ["Corpus"]
    requestBody:
        description: "Path to the file to load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/corpus"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Corpus loaded, corpus summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        428:
            description: "Unable to load the requested path"
            content:
                text/plain:
                    schema:
                        type: string
    """
    path = request.json.get('path')

    try:
        state.corpus = engine.text.Corpus(path)
        return jsonify(state.corpus.get_patient_tree())
    except FileNotFoundError as e:
        return "File not found: {0}".format(path), 428


@require_corpus
@bp_corpus.route('/patient/tree', methods=['GET'])
def get_patient_tree():
    """
    Return a corpus from application state.

    ---
    tags: ["Corpus"]
    responses:
        200:
            description: "Corpus summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        428:
            description: "No corpus currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    return jsonify(state.corpus.get_patient_tree())


@require_corpus
@bp_corpus.route('/note', methods=['GET'])
def get_note():
    """
    Get a note from a noteId.

    ---
    tags: ["Corpus"]
    parameters:
      - in: query
        name: noteId
        description: "Note identifier"
        schema:
            type: string
        required: true
    responses:
        200:
            description: "Note returned"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            text:
                                type: string
                            date:
                                type: string
        400:
            description: "Invalid noteId"
            content:
                text/plain:
                    schema:
                        type: string
        428:
            description: "No corpus currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    noteId = request.args.get('noteId')
    try:
        note = state.corpus.get_note_by_id(noteId)
        return jsonify({"text": note.text, "date": note.date})
    except:
        return "Invalid noteId", 400


@require_corpus
@bp_corpus.route('/patient/note', methods=['POST'])
def get_note_and_patient():
    """
    Get a note with optional markup from a patientId and noteId.

    ---
    tags: ["Corpus"]
    requestBody:
        description: "Specification of which note and how to return the results"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        patientId:
                            description: "Patient identifier"
                            type: string
                        noteId:
                            description: "Note identifier"
                            type: string
                        markupStyle:
                            description: "Markup Style"
                            type: string
                        corpusType:
                            description: "Corpus Type"
                            type: string
                    required: ["patientId", "noteId", "markupStyle", "corpusType"]
    responses:
        200:
            description: "Note returned"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            text:
                                type: string
                            date:
                                type: string
        400:
            description: "Invalid noteId"
            content:
                text/plain:
                    schema:
                        type: string
        428:
            description: "No corpus currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    patientId = request.json.get('patientId')
    noteId = request.json.get('noteId')
    markupStyle = request.json.get('markupStyle')
    corpusType = request.json.get('corpusType')

    if corpusType == "testing":
        if state.test_corpus:
            return 'No test corpus loaded.', 428
        selected_corpus = state.test_corpus
    elif corpusType == "results":
        if not state.last_result:
            return 'No results corpus.', 428

        if state.last_result['method'] == "test":
            if state.test_corpus:
                return 'No test corpus loaded.', 428
            selected_corpus = state.test_corpus
        else:
            if not state.corpus:
                return 'No corpus loaded.', 428
            selected_corpus = state.corpus
    else:
        selected_corpus = state.corpus

    note = selected_corpus.get_note_by_id(noteId)
    patient = selected_corpus.get_patient_by_id(patientId)
    colors = engine.regtext.get_colors(state.proc.feature_extractor.expressions)
    colors_json = {}
    for c in colors:
        if isinstance(c, str):
            continue
        colors_json[c.pattern] = colors[c]

    if markupStyle == 'Features':
        noteCopy = copy.deepcopy(note)
        state.proc.section_splitter.run(noteCopy)
        state.proc.sentence_splitter.run(noteCopy)

        marker = engine.regtext.MultiRegexText(noteCopy.text, state.proc.feature_extractor.get_expressions_valid(), names=state.proc.feature_extractor.get_names_valid())
        # markup = marker.run()
        # ''.join(markup)
        markup = ''
        for cur_text in noteCopy.text:
            marker = engine.regtext.MultiRegexText([cur_text], state.proc.feature_extractor.get_expressions_valid(), names=state.proc.feature_extractor.get_names_valid())
            cur_markup = marker.run()
            markup = markup + cur_markup[0]
            # markup = markup + '\n'

        markup = ''.join(markup)
        markup = markup.strip()
        markup = [markup]
        note = engine.text.Note(noteId=note.id, noteDate=note.date, note=markup, **note.metadata)
    elif markupStyle == 'Sectioning':
        section_exprs = state.proc.feature_combiner.expressions
        sections_used = state.proc.feature_combiner.expressions_used
        sections_named = state.proc.feature_combiner.names
        section_break = state.proc.section_splitter.expression
        marker = engine.regtext.SectionRegexText(note.text, section_break, section_exprs, sections_used, sections_named)
        markup = marker.run()
        note = engine.text.Note(noteId=note.id, noteDate=note.date, note=markup, **note.metadata)
    return jsonify({"note": note.serialize(), "patient": patient.serialize(notes=False), "color_map": colors_json})


@bp_corpus.route('/test_corpus/load', methods=['POST'])
def load_test_corpus():
    """
    Load a test corpus into application state given a path to the corpus.

    ---
    tags: ["Corpus"]
    requestBody:
        description: "Path to the file to load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/corpus"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Test corpus loaded, corpus summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        428:
            description: "Unable to load the requested path"
            content:
                text/plain:
                    schema:
                        type: string
    """
    path = request.json.get('path')
    try:
        state.test_corpus = engine.text.Corpus(path)
        return jsonify(state.test_corpus.get_patient_tree())
    except:
        return "File not found: {0}".format(path), 428
