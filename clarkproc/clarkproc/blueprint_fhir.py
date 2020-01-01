"""Blueprint for FHIR endpoints."""
from collections import defaultdict
from functools import wraps

from flask import Blueprint, jsonify, request

from clarkproc.engine import ingest
import clarkproc.state as s
from clarkproc.fhir.models import CodeValue

bp_fhir = Blueprint('fhir', __name__)

TEST_DATA_INDICATOR = 'is_test_data'


def require_fhir(f):
    """Helper decorator to enforce that FHIR data is loaded."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if kwargs.get(TEST_DATA_INDICATOR, False):
            state = s.test
        else:
            state = s.train

        if state.patients is None or len(state.patients) < 1:
            return 'No FHIR data loaded.', 428, {'Content-Type': 'text/plain'}
        return f(state, *args, **kwargs)
    return decorated_function


@bp_fhir.route('/load', methods=['POST'])
def load_fhir(**kwargs):
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
    if kwargs.get(TEST_DATA_INDICATOR, False):
        state = s.test
    else:
        state = s.train

    paths = request.json.get('paths')

    messages, state.patients, state.labs, state.vitals, state.medications = \
        ingest.ingest_fhir(paths)

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
def get_patients_summary(state, *args, **kwargs):
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


@bp_fhir.route('/patient_list', methods=['GET'])
@require_fhir
def get_patient_list(state, *args, **kwargs):
    """
    Return a list of all patients.

    ---
    tags: ["FHIR"]
    responses:
        200:
            description: "Patient list returned"
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

    return jsonify([state.patients.get(patient).to_dict_summary() for patient in state.patients])


@bp_fhir.route('/patient/<string:patient_id>', methods=['GET'])
@require_fhir
def get_patient_summary(state, patient_id, *args, **kwargs):
    """
    Return a summary for an individual patient.

    ---
    tags: ["FHIR"]
    parameters:
        - name: patient_id
          in: path
          description: ID of the patient of interest
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
    p = state.patients.get(patient_id)

    if p is None:
        return (
            f'No patient exists with identifier "{patient_id}".',
            404,
            {'Content-Type': 'text/plain'}
        )

    return jsonify(p.to_dict())


@bp_fhir.route('/patient/<string:patient_id>/details/<string:detail_type>',
               methods=['GET'])
@require_fhir
def get_patient_details(state, patient_id, detail_type, *args, **kwargs):
    """
    Return details for an individual patient for a particular class of data.

    ---
    tags: ["FHIR"]
    parameters:
        - name: patient_id
          in: path
          description: ID of the patient of interest
          required: true
          schema:
            type: string
        - name: detail_type
          in: path
          description: Class of details to return
          required: true
          schema:
            type: string
            enum: [lab, vital, medication]
        - name: system
          in: query
          description: System of interest
          required: true
          schema:
            type: string
        - name: code
          in: query
          description: Code of interest
          required: true
          schema:
            type: string
    responses:
        200:
            description: "Details returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        400:
            description: "Invalid request"
            content:
                text/plain:
                    schema:
                        type: string
        404:
            description: "No patient or system/code exists"
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
    p = state.patients.get(patient_id)

    if p is None:
        return (
            f'No patient exists with identifier "{patient_id}".',
            404,
            {'Content-Type': 'text/plain'}
        )

    code = request.args.get('code')
    system = request.args.get('system')

    if code is None:
        return (
            '"code" parameter is missing', 400, {'Content-Type': 'text/plain'}
        )

    if system is None:
        return (
            '"system" parameter is missing', 400, {'Content-Type': 'text/plain'}
        )

    lut = {
        'lab': p.labs,
        'vital': p.vitals,
        'medication': p.medications
    }

    try:
        data = lut[detail_type.lower()].data
    except KeyError:
        return (
            f'Unsupported detail type "{detail_type}".  '
            f'Allowed options are {list(lut.keys())}.',
            400,
            {'Content-Type': 'text/plain'}
        )

    try:
        entries = data.get(CodeValue(code, system)).data
    except AttributeError:
        return (
            f'No {detail_type} exists with system/code: ({system}, {code}).',
            404,
            {'Content-Type': 'text/plain'}
        )

    d = {'count': len(entries),
         'data': [e.to_dict() for e in entries]
     }

    return jsonify(d)


@bp_fhir.route('/patient/<string:patient_id>/note/<string:note_id>', methods=['GET'])
@require_fhir
def get_patient_note(state, patient_id, note_id, *args, **kwargs):
    """
    Return a note for a patient.

    ---
    tags: ["FHIR"]
    parameters:
        - name: patient_id
          in: path
          description: ID of the patient of interest
          required: true
          schema:
            type: string
        - name: note_id
          in: path
          description: ID of the note of interest
          required: true
          schema:
            type: string
    responses:
        200:
            description: "Note returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
        404:
            description: "No patient or note exists with identifier"
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
    p = state.patients.get(patient_id)

    if p is None:
        return (
            f'No patient exists with identifier "{patient_id}".',
            404,
            {'Content-Type': 'text/plain'}
        )

    n = p.notes.get(note_id)

    if n is None:
        return (
            f'No note exists with identifier "{note_id}".',
            404,
            {'Content-Type': 'text/plain'}
        )

    return jsonify(n.to_dict())


@bp_fhir.route('/labs', methods=['GET'])
@require_fhir
def get_labs_summary(state, *args, **kwargs):
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
def get_vitals_summary(state, *args, **kwargs):
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
def get_medications_summary(state, *args, **kwargs):
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
