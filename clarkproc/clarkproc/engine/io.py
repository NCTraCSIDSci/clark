import datetime
import jsonpickle
import gzip
import pickle

#needed to move things around during save
import tempfile
import shutil
import os

import jsonpickle.ext.numpy as jsonpickle_numpy
jsonpickle_numpy.register_handlers()

def save(file, proc, corpus, test_corpus, classifier, last_result, finished, config):
    dump = {"proc":proc, "corpus":corpus, "test_corpus": test_corpus, "last_result": last_result, "finished": finished, "config": config}
    json_dump = jsonpickle.encode(dump, keys=True)
    success = False
    tmp = os.path.join(tempfile.gettempdir(), '.{}'.format(hash(os.times())))
    os.makedirs(tmp)

    json_tmp = os.path.join(tmp, 'json.txt')
    with open(json_tmp, 'wt') as json_out: 
        json_out.write(json_dump)

    classifier_tmp = os.path.join(tmp, 'classifier.pkl')
    #classifier_out = tempfile.NamedTemporaryFile(dir=tmp, prefix='classifier')
    with open(classifier_tmp, 'wb') as classifier_out:
        classifier_out.write(pickle.dumps(classifier))

    #now write our zip file by zipping the tmp directory
    shutil.make_archive(file, 'zip', tmp)

    shutil.rmtree(tmp, ignore_errors=True)
    success = True
    return success


def load(filename):
    tmp = os.path.join(tempfile.gettempdir(), '.{}'.format(hash(os.times())))
    shutil.unpack_archive(filename, tmp, "zip")

    json_tmp = os.path.join(tmp, 'json.txt')
    data = None
    with open(json_tmp, 'rt') as json_in: 
        contents = json_in.read()
        data = jsonpickle.decode(contents, keys=True)

    classifier_tmp = os.path.join(tmp, 'classifier.pkl')
    with open(classifier_tmp, 'rb') as classifier_in:
        data["classifier"] = pickle.load(classifier_in)

    shutil.rmtree(tmp, ignore_errors=True)

    return data
  
def results_dict_to_array(last_result):
    labels = last_result["labels"]
    confs = last_result["confs"]
    obs_info = last_result["obs_info"]
    max_labels = last_result["max_label"]
    max_confs = last_result["max_conf"]
    true_labels = None
    true_confs = None
    if "true_label" in last_result:
        true_labels = last_result["true_label"]
        true_confs = last_result["true_conf"]
    return results_to_array(labels, confs, obs_info, max_labels, max_confs, true_labels, true_confs)

def results_to_array(labels, confs, obs_info, max_labels, max_confs, true_labels=None, true_confs=None):
    #csv is obs_info.id, max_label, max_conf, conf(for each label), true_label, true_conf
    values = []
    header = ["id", "label", "conf"]
    header.extend(labels)
    if (true_confs):
        header.extend(["true_label", "true_conf"])
    values.append(header)
    for index, conf_values in enumerate(confs):
        curr = []
        curr.append(index)
        curr.append(max_labels[index])
        curr.append(max_confs[index])
        curr.extend(conf_values)
        if (true_confs):
            curr.append(true_labels[index])
            curr.append(true_confs[index])
        values.append(curr)
    return values

  
"""
These are deprecated save/load functions that put the classifier in the same file as 
the other data - but it didn't work for all classifiers as some classifiers
cannot be jsonpickled (saved purely as text/json).

def save(file, proc, corpus, test_corpus, classifier, last_result, finished, config):
    # Save a classifier, proc and corpus by saving the entirety of the objects.
    # This reduces reusability but saves time/space with gzip.
    # time = datetime.datetime.now().strftime("%d%m%y-%I:%M:%S%p")

    dump = {"proc":proc, "corpus":corpus, "test_corpus": test_corpus, "classifier":classifier, "last_result": last_result, "finished": finished, "config": config}
    json_dump = jsonpickle.encode(dump, keys=True)

    success = False;
    with gzip.open(file, 'wt') as out:
        out.write(json_dump)
        out.close()
        success = True;

    return success

def load(filename):
    with gzip.open(filename, 'rt') as file_in:
        contents = file_in.read()
        data = jsonpickle.decode(contents, keys=True)
        return data
    return None
"""
