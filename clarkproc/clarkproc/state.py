"""
Clark Session Variables
    
Clark is a single user (session) webserver for use as a desktop (electron)
application.  These session variables hold application state across the REST
interfaces
"""

from . import engine

corpus = None
test_corpus = None
last_result = None
proc = engine.text.ProcessingBlock()
classifier = None
patients = None
labs = None
vitals = None
medications = None


def reset():
    global corpus, test_corpus, last_result, proc, classifier, patients, labs, \
        vitals, medications

    corpus = None
    test_corpus = None
    last_result = None
    proc = engine.text.ProcessingBlock()
    classifier = None
    patients = None
    labs = None
    vitals = None
    medications = None


def summary():
    return {
        'has_corpus': corpus is not None,
        'has_test_corpus': test_corpus is not None,
        'has_results': last_result is not None,
        'has_classifier': classifier is not None,
        'num_patients': len(patients) if patients is not None else 0,
        'num_labs': len(labs) if labs is not None else 0,
        'num_vitals': len(vitals)  if vitals is not None else 0,
        'num_medications': len(medications) if medications is not None else 0,
    }
