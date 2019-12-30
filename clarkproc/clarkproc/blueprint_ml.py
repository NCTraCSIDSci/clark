"""Blueprint for machine learning endpoints."""
from collections import defaultdict
import datetime
import logging
import re
from flask import Blueprint, jsonify, request
import numpy as np
import pandas as pd
import sklearn

import clarkproc.engine as engine
import clarkproc.state as state

logger = logging.getLogger(__name__)

bp_ml = Blueprint('ml', __name__)

age_bins = (0, 18, 30, 40, 50, 60, 200)

@bp_ml.route('/classifiers')
def get_classifiers():
    """
    List Available Machine Learning Classifiers
    ---
    tags: ["Machine Learning"]
    responses:
        200:
            description: "Array of objects specifying available classifers is returned"
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: object
    """

    classifiers = engine.classification.get_classifiers()
    return jsonify(classifiers)


def default_lab():
    """Generate default lab features.

    Used in case a patient has a missing lab.
    """
    return {
        'min': None,
        'max': None,
        'newest': None,
        'oldest': None,
    }


def default_medication():
    """Generate default medication features.

    Used in case a patient has a missing medication.
    """
    return {
        'count': 0,
        'boolean': False,
    }


def num_matches(pattern, string):
    """Find the number of (overlapping) occurrences of the pattern in the string."""
    result = re.search(pattern, string)
    if result:
        return 1 + num_matches(pattern, string[result.start() + 1:])
    else:
        return 0


def notes_to_features(notes, plan):
    """Extract regex features from note."""
    occurrences = {
        feature['regex']: 0
        for feature in plan['features']
    }
    for note in notes:
        breaks = [match.span() for match in re.finditer(plan['sections']['section_break'], note)]
        if breaks:
            header = note[:breaks[0][0]]
            sections = {
                note[breaks[i][0]:breaks[i][1]]: note[breaks[i][0]:breaks[i + 1][0]]
                for i in range(len(breaks) - 1)
            }
        else:
            header = note
            sections = dict()
        # tag sections
        sections = {
            tuple(
                tag['ignore']
                for tag in plan['sections']['tags']
                if re.match(tag['regex'], key)
            ): value
            for key, value in sections.items()
        }
        # filter sections
        sections = [
            value
            for key, value in sections.items()
            if not any(key) and (key or not plan['sections']['ignore_untagged'])
        ]
        if not plan['sections']['ignore_header']:
            sections.append(header)
        for section in sections:
            for feature in plan['features']:
                occurrences[feature['regex']] += len(re.findall(feature['regex'], section))
    return occurrences


def fhir_to_dataframe(patients, plan):
    """Convert FHIR data to Pandas DataFrame according to features specified."""
    patient_plan = plan['structured_data'].get('patient', {})
    requested_labs = plan['structured_data'].get('labs', [])
    requested_meds = plan['structured_data'].get('meds', [])

    # prepare reference date for age calculation
    if 'age' in patient_plan:
        reference_date_string = patient_plan['age']['reference_date']
        reference_date = datetime.date.fromisoformat(reference_date_string.split('T')[0])

    features = []
    for patient_id in patients:
        patient = patients.get(patient_id)
        patient_features = {
            'id': patient.id,
            'label': patient.label,
        }

        # "notes" features
        notes = [note.data for note_id, note in patient.notes.items()]
        new_features = notes_to_features(notes, plan['unstructured_data'])
        patient_features.update(new_features)

        # "patient" features
        if 'numeric' in patient_plan.get('age', {}).get('features', []):
            patient_features['age_in_days'] = patient.get_age_in_days(reference_date)
        if 'binned' in patient_plan.get('age', {}).get('features', []):
            age_in_years = patient.get_age_in_years(reference_date)
            patient_features['age_bin'] = next(
                f'{age_bins[i]}-{age_bins[i + 1]}'
                for i in range(len(age_bins) - 1)
                if age_in_years < age_bins[i + 1]
            )
        if 'one-hot' in patient_plan.get('marital_status', {}).get('features', []):
            patient_features['marital_status'] = patient.maritalStatus.code
        if 'one-hot' in patient_plan.get('gender', {}).get('features', []):
            patient_features['gender'] = patient.gender

        # "labs" features
        patient_labs = defaultdict(default_lab)
        patient_labs.update({
            f'({k.system}, {k.code})': v.to_dict()
            for k, v in patient.labs
        })
        patient_features.update({
            f'{requested_lab_id} {key}': patient_labs[requested_lab_id][key]
            for requested_lab_id, requested_lab in requested_labs.items()
            for key in requested_lab['features']
        })

        # "meds" features
        patient_meds = defaultdict(default_medication)
        patient_meds.update({
            f'({k.system}, {k.code})': v.to_dict()
            for k, v in patient.medications
        })
        patient_features.update({
            f'{requested_med_id} {key}': patient_meds[requested_med_id][key]
            for requested_med_id, requested_med in requested_meds.items()
            for key in requested_med['features']
        })

        features.append(patient_features)
    # logger.error(features)
    df = pd.DataFrame(features)
    df = df.set_index('id')
    return df


@bp_ml.route('/coverage', methods=['POST'])
def compute_coverage():
    """
    Apply regular expressions on the loaded training data and return the results.
    ---
    tags: ["Machine Learning"]
    requestBody:
        description: "Experiment Setup"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        sections:
                            type: object
                            properties:
                                tags:
                                    type: array
                                    items:
                                        type: object
                                        properties:
                                            regex:
                                                type: string
                                            ignore:
                                                type: boolean
                                section_break:
                                    type: string
                                ignore_header:
                                    type: boolean
                                ignore_untagged:
                                    type: boolean
                        features:
                            type: array
                            items:
                                type: object
                                properties:
                                    regex:
                                        type: string
    responses:
        200:
            description: "Feature extraction successful, results returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "No corpus loaded"
            content:
                text/plain:
                    schema:
                        type: string
    """
    if not state.train.patients:
        return 'No data loaded.', 428

    occurrences = defaultdict(int)
    for patient_id in state.train.patients:
        patient = state.train.patients.get(patient_id)

        # "notes" features
        notes = [note.data for note_id, note in patient.notes.items()]
        new_features = notes_to_features(notes, request.json)
        for feature in request.json['features']:
            occurrences[feature['regex']] += 1 if new_features[feature['regex']] else 0
    return occurrences


@bp_ml.route('/go', methods=['POST'])
def apply_ml():
    """
    Apply a machine learning algorithm on the loaded training [and testing] data and return the results.
    ---
    tags: ["Machine Learning"]
    requestBody:
        description: "Experiment Setup"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        structured_data:
                            type: object
                            properties:
                                patient:
                                    type: object
                                    properties:
                                        age:
                                            type: object
                                            properties:
                                                features:
                                                    type: array
                                                    items:
                                                        type: string
                                                        enum:
                                                          - numeric
                                                          - binned
                                                reference_date:
                                                    type: string
                                            required:
                                              - reference_data
                                              - features
                                        gender:
                                            type: object
                                            properties:
                                                features:
                                                    type: array
                                                    items:
                                                        type: string
                                                        enum:
                                                          - "one-hot"
                                            required:
                                              - features
                                        race:
                                            type: object
                                            properties:
                                                features:
                                                    type: array
                                                    items:
                                                        type: string
                                                        enum:
                                                          - "one-hot"
                                            required:
                                              - features
                                        ethnicity:
                                            type: object
                                            properties:
                                                features:
                                                    type: array
                                                    items:
                                                        type: string
                                                        enum:
                                                          - "one-hot"
                                            required:
                                              - features
                                            required:
                                              - features
                                        marital_status:
                                            type: object
                                            properties:
                                                features:
                                                    type: array
                                                    items:
                                                        type: string
                                                        enum:
                                                          - "one-hot"
                                            required:
                                              - features
                                labs:
                                    type: object
                                    additionalProperties:
                                        type: object
                                        properties:
                                            features:
                                                type: array
                                                items:
                                                    type: string
                                                    enum:
                                                      - min
                                                      - max
                                                      - newest
                                                      - oldest
                                meds:
                                    type: object
                                    additionalProperties:
                                        type: object
                                        properties:
                                            features:
                                                type: array
                                                items:
                                                    type: string
                                                    enum:
                                                      - count
                                                      - boolean
                                vitals:
                                    type: object
                                    additionalProperties:
                                        type: object
                                        properties:
                                            features:
                                                type: array
                                                items:
                                                    type: string
                                                    enum:
                                                      - min
                                                      - max
                                                      - newest
                                                      - oldest
                        unstructured_data:
                            type: object
                            properties:
                                sections:
                                    type: object
                                    properties:
                                        tags:
                                            type: array
                                            items:
                                                type: object
                                                properties:
                                                    regex:
                                                        type: string
                                                    ignore:
                                                        type: boolean
                                        section_break:
                                            type: string
                                        ignore_header:
                                            type: boolean
                                        ignore_untagged:
                                            type: boolean
                                features:
                                    type: array
                                    items:
                                        type: object
                                        properties:
                                            regex:
                                                type: string
                        algo:
                            type: object
                            properties:
                                algo_type:
                                    type: string
                                eval_method:
                                    oneOf:
                                      - type: object
                                        properties:
                                            type:
                                                type: string
                                                const: "Cross-Validation"
                                            crossval_method:
                                                type: string
                                                enum:
                                                  - "Stratified"
                                                  - "Random"
                                            num_folds:
                                                type: number
                                        required:
                                          - type
                                          - crossval_method
                                          - num_folds
                                      - type: object
                                        properties:
                                            type:
                                                type: string
                                                const: "Evaluation Corpus"
                                            test_data_directory:
                                                type: string
                                        required:
                                          - type
                                          - test_data_directory
                            required:
                              - algo_type
                              - eval_method
                    required:
                      - structured_data
                      - unstructured_data
                      - algo
    responses:
        200:
            description: "Cross-validation successful, results returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "No corpus loaded"
            content:
                text/plain:
                    schema:
                        type: string
    """
    if not state.train.patients:
        return 'No data loaded.', 428

    classifier_name = request.json['algo']['algo_type']

    # set_feature_expressions()
    clf = engine.classification.build_classifier(classifier_name)

    df_train = fhir_to_dataframe(state.train.patients, request.json)

    y_train = df_train['label']

    df_train = df_train.drop(columns='label')

    if request.json['algo']['eval_method']['type'] == 'Cross-Validation':
        crossvalidation_name = request.json['algo']['eval_method']['crossval_method']
        n_folds = int(request.json['algo']['eval_method']['num_folds'])

        df_train = engine.onehot.FhirOneHotEncoder().train(df_train).apply(df_train)
        ds = engine.classification.DataSet(df_train.to_numpy().astype(float), list(y_train))

        # retain only observations from classes with >= n_folds instances
        target_counts = [[t, ds.targets.count(t)] for t in set(ds.targets)]
        keep_targets = [t for [t, c] in target_counts if c >= n_folds]
        keep_obs = [t in keep_targets for t in ds.targets]

        ds = ds.get_obs(keep_obs)

        if crossvalidation_name == 'Stratified':
            fold_strategy = sklearn.model_selection.StratifiedKFold(n_splits=n_folds)
        elif crossvalidation_name == 'Random':
            fold_strategy = sklearn.model_selection.KFold(n_splits=n_folds, shuffle=True, random_state=0)

        keys = np.zeros(len(ds.y))
        iFold = 0
        for (_, test_index) in fold_strategy.split(ds.data, np.array(ds.y)):
            keys[test_index] = iFold * np.ones(len(test_index))
            iFold = iFold + 1

        confs = clf.cross_validate(ds, keys)

        state.classifier = clf

        confs = np.round(confs, 4)

        scores = sklearn.model_selection.cross_val_score(clf.classifier, ds.data, ds.y, cv=fold_strategy)

        true_conf = [row[label] for row, label in zip(confs, ds.y)]

        class_names = ds.class_names
        result = [(class_names[row.argmax()], row.max()) for row in confs]

        [max_label, max_conf] = zip(*result)

        output = {
            'resourceType': 'Bundle',
            'type': 'collection',
            'entry': [
                {
                    'resourceType': 'ClarkDecision',
                    'subject': {
                        'reference': f'Patient/{patient_id}',
                    },
                    'decision': {
                        'confidences': {
                            class_names[i]: pair[i]
                            for i in range(len(class_names))
                        },
                    },
                }
                for patient_id, pair in zip(state.train.patients, confs.tolist())
            ],
        }

    elif request.json['algo']['eval_method']['type'] == 'Evaluation Corpus':
        if not state.test.patients:
            return 'No testing data loaded.', 428
        encoder = engine.onehot.FhirOneHotEncoder().train(df_train)
        df_train = encoder.apply(df_train)
        ds_train = engine.classification.DataSet(df_train.to_numpy().astype(float), list(y_train))

        df_test = fhir_to_dataframe(state.test.patients, request.json)
        y_test = df_test['label']
        df_test = df_test.drop(columns='label')
        df_test = encoder.apply(df_test)
        ds_test = engine.classification.DataSet(df_test.to_numpy().astype(float), list(y_test))

        # train
        clf.train(ds_train)
        state.classifier = clf

        # test
        confs = state.classifier.test(ds_test)
        confs = np.round(confs, 4)

        class_names = state.classifier.class_names
        result = [(class_names[row.argmax()], row.max()) for row in confs]

        [max_label, max_conf] = zip(*result)

        output = {
            'resourceType': 'Bundle',
            'type': 'collection',
            'entry': [
                {
                    'resourceType': 'ClarkDecision',
                    'subject': {
                        'reference': f'Patient/{patient_id}',
                    },
                    'decision': {
                        'confidences': {
                            class_names[i]: pair[i]
                            for i in range(len(class_names))
                        },
                    },
                }
                for patient_id, pair in zip(state.test.patients, confs.tolist())
            ],
        }

    state.last_result = output
    return jsonify(output)
