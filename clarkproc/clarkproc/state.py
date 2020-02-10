"""
Clark Session Variables
    
Clark is a single user (session) webserver for use as a desktop (electron)
application.  These session variables hold application state across the REST
interfaces
"""

from clarkproc import engine


# Reference: https://stackoverflow.com/a/5021467
class AttributeDict(dict):
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


corpus = None
test_corpus = None
last_result = None
classifier = None

train = AttributeDict(patients=None, labs=None, vitals=None, medications=None)
test = AttributeDict(patients=None, labs=None, vitals=None, medications=None)


def reset():
    global corpus, test_corpus, last_result, classifier, train, test

    corpus = None
    test_corpus = None
    last_result = None
    classifier = None

    train.patients = None
    train.labs = None
    train.vitals = None
    train.medications = None

    test.patients = None
    test.labs = None
    test.vitals = None
    test.medications = None


def summary():
    return {
        'has_corpus': corpus is not None,
        'has_test_corpus': test_corpus is not None,
        'has_results': last_result is not None,
        'has_classifier': classifier is not None,
        'train': {
            'num_patients': len(train.patients or []),
            'num_labs': len(train.labs or []),
            'num_vitals': len(train.vitals or []),
            'num_medications': len(train.medications or []),
        },
        'test': {
            'num_patients': len(test.patients or []),
            'num_labs': len(test.labs or []),
            'num_vitals': len(test.vitals or []),
            'num_medications': len(test.medications or []),
        }
    }
