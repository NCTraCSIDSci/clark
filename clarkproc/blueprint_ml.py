"""Blueprint for machine learning endpoints."""
from flask import Blueprint, jsonify, request

import csv
import numpy as np
import sklearn

import engine
import state

bp_ml = Blueprint('ml', __name__)

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

@bp_ml.route('/crossValidate', methods=['POST'])
def crossValidate_algorithm():
    """
    CrossValidate a machine learning algorithm on the loaded training corpus and return the results.
    ---
    tags: ["Machine Learning"]
    requestBody:
        description: "Cross Validation Options"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        classifierId:
                            description: "Identifier for the classification method"
                            type: string
                        crossvalidationMethod:
                            description: "Identifier for a cross-validation method. Currently supported options, 'Stratified', 'Random'"
                            type: string
                        nFolds:
                            description: "Identifier for a cross-validation method. Currently supported options, 'Stratified', 'Random'"
                            type: integer
                    required: ["classifierId", "crossvalidationMethod", "nFolds"]
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

    if not state.corpus:
        return 'No corpus loaded.', 428

    classifier_name = request.json.get("classifierId")
    crossvalidation_name = request.json.get("crossvalidationMethod")
    n_folds = int(request.json.get("nFolds"))

    # set_feature_expressions()
    clf = engine.classification.build_classifier(classifier_name)

    ds = state.proc.run(state.corpus)

    # retain only observations from classes with >= n_folds instances
    target_counts = [[t, ds.targets.count(t)] for t in set(ds.targets)]
    keep_targets = [t for [t,c] in target_counts if c >= n_folds]
    keep_obs = [True if t in keep_targets else False for t in ds.targets]

    ds = ds.get_obs(keep_obs)

    if crossvalidation_name == 'Stratified':
        fold_strategy = sklearn.model_selection.StratifiedKFold(n_splits=n_folds)
    elif crossvalidation_name == 'Random':
        fold_strategy = sklearn.model_selection.KFold(n_splits=n_folds, shuffle=True, random_state=0)

    keys = np.zeros(len(ds.y))
    iFold = 0
    for (_, test_index) in fold_strategy.split(ds.data, np.array(ds.y)):
        keys[test_index] = iFold*np.ones(len(test_index))
        iFold = iFold + 1

    confs = clf.cross_validate(ds, keys)
    
    state.classifier = clf

    confs = np.round(confs, 4)

    scores = sklearn.model_selection.cross_val_score(clf.classifier, ds.data, ds.y, cv=fold_strategy)

    true_conf = [row[label] for row, label in zip(confs, ds.y)]

    class_names = ds.class_names
    result = [(class_names[row.argmax()], row.max()) for row in confs]

    [max_label, max_conf] = zip(*result)

    output = {'labels':class_names, 'confs':confs.tolist(), 'true_label':ds.targets, 'true_conf':true_conf,
            'max_label':max_label, 'max_conf':max_conf, 'scores':scores.tolist(), 'mean':scores.mean(),
            'std':scores.std(), 'obs_info':ds.obs_info, 'method': "crossValidate"}

    state.last_result = output

    return jsonify(output)

@bp_ml.route('/train', methods=['POST'])
def train_algorithm():
    """
    Train a machine learning algorithm on the loaded training corpus
    ---
    tags: ["Machine Learning"]
    requestBody:
        description: "Classifier Options"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        classifierId:
                            description: "Identifier for the classification method"
                            type: string
                    required: ["classifierId"]
    responses:
        200:
            description: "Training successful"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            trained:
                                description: "indicates valid training"
                                type: boolean
        428:
            description: "No corpus loaded"
            content:
                text/plain:
                    schema:
                        type: string
    """

    if not state.corpus:
        return 'No corpus loaded.', 428

    classifier_name = request.json.get("classifierId")

    ds = state.proc.run(state.corpus)

    clf = engine.classification.build_classifier(classifier_name)
    clf.train(ds)
    state.classifier = clf
    return jsonify({"trained":True})

@bp_ml.route('/evaluate', methods=['POST'])
def evaluate_algorithm():
    """
    Evaluate a previously trained machine learning algorithm on the test corpus
    ---
    tags: ["Machine Learning"]
    responses:
        200:
            description: "Evaluation successful, results returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "No test corpus loaded"
            content:
                text/plain:
                    schema:
                        type: string
    """

    if not state.test_corpus:
        return 'No test corpus loaded.', 428

    ds = state.proc.run(state.test_corpus)
    confs = state.classifier.test(ds)
    confs = np.round(confs, 4)

    class_names = state.classifier.class_names
    result = [(class_names[row.argmax()], row.max()) for row in confs]

    [max_label, max_conf] = zip(*result)

    output = {'labels':class_names, 'confs':confs.tolist(), 'max_label':max_label, 'max_conf':max_conf, 'obs_info':ds.obs_info, 'method': "test"}

    state.last_result = output
    return jsonify(output)

@bp_ml.route('/results/export', methods=['POST'])
def export_data():
    """
    Export the results of most recent classifier evaluations
    ---
    tags: ["Machine Learning"]
    requestBody:
        description: "Path to the file to write"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/export"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Export successful"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            export:
                                description: "indiciation of successful export"
                                type: boolean
        400:
            description: "Unable to write to file"
            content:
                text/plain:
                    schema:
                        type: string
        428:
            description: "No recent results found"
            content:
                text/plain:
                    schema:
                        type: string
    """

    export_file = request.json.get('path')

    if not state.last_result:
        return "No recent results found", 428

    success = False
    with open(export_file, "w", newline='') as fid:
        data = engine.io.results_dict_to_array(state.last_result)
        cw = csv.writer(fid)
        cw.writerows(data)
        success = True

    if success:
        return jsonify({"export":True})
    else:
        return 'Failed to export results to this file.', 400