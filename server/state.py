""" Clark Session Variables
    
    Clark is a single user (session) webserver for use as a desktop (electron) application.
    These session variables hold application state across the REST interfaces
"""

import engine

corpus = None
test_corpus = None
last_result = None
proc = engine.text.ProcessingBlock()
classifier = None

def reset():
    global corpus, test_corpus, last_result, proc, classifier

    corpus = None
    test_corpus = None
    last_result = None
    proc = engine.text.ProcessingBlock()
    classifier = None

def summary():
    global corpus, test_corpus, last_result, proc, classifier

    summary = {
        'has_corpus': bool(corpus),
        'has_test_corpus': bool(test_corpus),
        'has_results': bool(last_result),
        'has_classifier': bool(classifier,)
    }

    return summary