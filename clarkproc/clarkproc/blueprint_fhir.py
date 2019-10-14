"""Blueprint for FHIR endpoints."""
from collections import defaultdict
from functools import wraps

from flask import Blueprint, jsonify, request

from . import engine
from . import state

bp_fhir = Blueprint('fhir', __name__)


def require_fhir(f):
    """Helper decorator to enforce that FHIR data is loaded."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if state.patients is None or len(state.patients) < 1:
            return 'No FHIR data loaded.', 428, {'Content-Type': 'text/plain'}
        return f(*args, **kwargs)
    return decorated_function


@bp_fhir.route('/load', methods=['POST'])
def load_fhir():
    """
    Load FHIR data into application state given path(s) to FHIR file(s).

    ---
    tags: ["FHIR"]
    requestBody:
        description: "Path(s) for the file(s) to load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        paths:
                            description: "Paths to FHIR files"
                            type: array
                            items:
                                description: "/path/to/fhir/file"
                                type: string
                    required: ["paths"]
    responses:
        200:
            description: "FHIR data loaded"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "No patients loaded"
            content:
                application/json:
                    schema:
                        type: object
    """
    paths = request.json.get('paths')

    messages, state.patients, state.labs, state.vitals, state.medications = \
        engine.ingest.ingest_fhir(paths)

    if state.patients is None:
        patient_ids = []
        code = 428
    else:
        patient_ids = list(state.patients.keys())
        code = 200

    d = {
        'messages': messages,
        'patient_ids': patient_ids
    }

    return jsonify(d), code


@bp_fhir.route('/patients', methods=['GET'])
@require_fhir
def get_patients_summary():
    """
    Return a summary of patients.

    ---
    tags: ["FHIR"]
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
    count = len(state.patients)

    gender_hist = defaultdict(int)
    marital_hist = defaultdict(int)

    for p in state.patients.values():
        gender_hist[p.gender] += 1

        try:
            marital_hist[p.maritalStatus.display] += 1
        except AttributeError:
            pass

    gender_hist.pop(None, None)

    d = {
        'count': count,
        'properties': {
            'gender': {
                'display': 'Gender',
                'type': 'categorical',
                'percentDefined': sum(gender_hist.values()) / count * 100.0,
                'num_categories': len(gender_hist),
                'histogram': gender_hist
            },
            'marital_status': {
                'display': 'Marital Status',
                'type': 'categorical',
                'percentDefined': sum(marital_hist.values()) / count * 100.0,
                'num_categories': len(marital_hist),
                'histogram': marital_hist
            }
        }
    }

    return jsonify(d)


@bp_fhir.route('/patient/<string:identifier>', methods=['GET'])
@require_fhir
def get_patient_summary(identifier):
    """
    Return a summary for an individual patient.

    ---
    tags: ["FHIR"]
    parameters:
        - name: identifier
          in: path
          description: ID of the patient to load
          required: true
          schema:
            type: string
    responses:
        200:
            description: "Individual patient summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        404:
            description: "No patient exists with identifier"
            content:
                text/plain:
                    schema:
                        type: string
        428:
            description: "No FHIR data currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    p = state.patients.get(identifier)

    if p is None:
        return (
            f'No patient exists with identifier "{identifier}".',
            404,
            {'Content-Type': 'text/plain'}
        )

    return jsonify(p.to_dict())


@bp_fhir.route('/labs', methods=['GET'])
@require_fhir
def get_labs_summary():
    """
    Return a summary of labs.

    ---
    tags: ["FHIR"]
    responses:
        200:
            description: "Lab summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        428:
            description: "No FHIR data currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    return jsonify(state.labs.to_dict())


@bp_fhir.route('/vitals', methods=['GET'])
@require_fhir
def get_vitals_summary():
    """
    Return a summary of vitals.

    ---
    tags: ["FHIR"]
    responses:
        200:
            description: "Vitals summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        428:
            description: "No FHIR data currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    return jsonify(state.vitals.to_dict())


@bp_fhir.route('/medications', methods=['GET'])
@require_fhir
def get_medications_summary():
    """
    Return a summary of medications.

    ---
    tags: ["FHIR"]
    responses:
        200:
            description: "Medications summary returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        428:
            description: "No FHIR data currently in application state"
            content:
                text/plain:
                    schema:
                        type: string
    """
    return jsonify(state.medications.to_dict())
