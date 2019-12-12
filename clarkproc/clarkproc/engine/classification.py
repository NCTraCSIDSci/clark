# -*- coding: utf-8 -*-
"""
Created on Tue Nov 29 16:27:08 2016

@author: miles
"""
import numpy as np
import sklearn.svm
import sklearn.tree
import sklearn.ensemble
import sklearn.naive_bayes
import importlib
import copy

class DataSet():
    '''Object for keeping track of data with labels, information about its
    observations (obs), and information about its features (feats).
    '''

    def __init__(self, *args, **kwargs):
        # initialize the empty dataSet
        self.data = np.zeros((0,0))
        self.obs_info = []
        self.feat_info = []
        self.targets = []

        if len(args) > 0:
            self.data = args[0]
        if len(args) > 1:
            self.targets = args[1]

        for key in kwargs:
            setattr(self, key, kwargs[key])

    @property
    def data(self):
        return self._data

    @data.setter
    def data(self, value):
        assert isinstance(value, np.ndarray), 'Data must be numpy array.'
        assert value.ndim == 2, 'Data must be 2d array.'
        self._data = value

    @property
    def targets(self):
        return self._targets

    @targets.setter
    def targets(self, value):
        assert isinstance(value, list), 'targets must be a list.'
        assert len(value) == self.n_obs, 'targets must be length nObservations.'
        self._targets = value

    @property
    def n_feats(self):
        return self._data.shape[1]

    @property
    def n_obs(self):
        return self._data.shape[0]

    @property
    def class_names(self):
        c = list(set(self.targets))
        c.sort()
        return c

    @property
    def n_classes(self):
        return len(set(self.targets))

    @property
    def y(self):
        cn = self.class_names
        return [cn.index(j) for i, j in enumerate(self.targets)]

    def isempty(self):
        return self.n_feats == 0 and self.n_obs == 0

    def cat_obs(self, ds):
        if self.isempty():
            self = ds
            return self
        if ds.isempty():
            return self

        assert isinstance(ds, DataSet), 'Concatenation is only allowed with other dataSets.'
        assert self.n_feats == ds.n_feats, 'Number of features must match.'
        self.data = np.concatenate((self.data, ds.data),0)
        self.targets += ds.targets
        self.obs_info += ds.obs_info
        return self
        
    def cat_feats(self, ds):
        if self.isempty():
            self = ds
            return self
        if ds.isempty():
            return self

        assert isinstance(ds, DataSet), 'Concatenation is only allowed with other dataSets.'
        assert self.n_obs == ds.n_obs, 'Number of observations must match.'
        self.data = np.concatenate((self.data, ds.data),1)
        self.feat_info += ds.feat_info
        return self

    def get_obs(self, keep):
        assert isinstance(keep,list), 'expecting input of type list.'
        if len(self.targets)==0:
            self.targets = [[]]*self.n_obs

        if len(self.obs_info)==0:
            self.obs_info = [{}]*self.n_obs

        kept = [(x, y, z) for x, y, z in
                zip(keep, self.targets, self.obs_info) if x]

        if len(kept)==0:
            ds = DataSet()
            return ds

        k, tgs, obs = zip(*kept)

        ds = DataSet(self.data[np.array(keep),:].copy(),
                               list(tgs).copy(), obs_info=list(obs).copy(),
                                feat_info=copy.deepcopy(self.feat_info))
        return ds

class Classifier():
    def __init__(self):
        self.trained = False

    def train(self, data_train):
        self._train(data_train)
        self.class_names = data_train.class_names;
        self.trained = True

    def test(self, data_test):
        assert self.trained, 'Classifier must be trained!'
        return self._test(data_test)

    def reset(self):
        self._reset
        self.trained = False

    def _train(self, data_train):
        return

    def _test(self, data_test):
        return

    def _reset(self):
        return

    def cross_validate(self, ds, keys):
        uKeys = list(set(keys))

        confs = np.zeros((ds.n_obs, ds.n_classes))

        for key in uKeys:
            self.reset()


            test = [k == key for k in keys]
            ds_test = ds.get_obs(test)

            train = [not b for b in test]
            ds_train = ds.get_obs(train)

            self.train(ds_train)

            tested = self.test(ds_test)
            confs[np.array(test),:] = tested

        return confs

class DecisionTree(Classifier):
    def __init__(self):
        super().__init__()
        self.parameters = {}
        self.classifier = []

    def _train(self, data_train):
        clf = sklearn.tree.DecisionTreeClassifier(**self.parameters)
        clf.fit(data_train.data, data_train.y)
        self.classifier = clf
        return

    def _test(self, data_test):
        confs = self.classifier.predict_proba(data_test.data)
        return confs

    def _reset(self):
        self.classifier = []

class RandomForest(Classifier):
    def __init__(self):
        super().__init__()
        self.parameters = {}
        self.classifier = []

    def _train(self, data_train):
        clf = sklearn.ensemble.RandomForestClassifier(**self.parameters)
        clf.fit(data_train.data, data_train.y)
        self.classifier = clf
        return

    def _test(self, data_test):
        confs = self.classifier.predict_proba(data_test.data)
        return confs

    def _reset(self):
        self.classifier = []

class GaussianNB(Classifier):
    def __init__(self):
        super().__init__()
        self.parameters = {}
        self.classifier = []

    def _train(self, data_train):
        clf = sklearn.naive_bayes.GaussianNB(**self.parameters)
        clf.fit(data_train.data, data_train.y)
        self.classifier = clf
        return

    def _test(self, data_test):
        confs = self.classifier.predict_proba(data_test.data)
        return confs

    def _reset(self):
        self.classifier = []

class LinearSVM(Classifier):
    def __init__(self):
        super().__init__()
        self.parameters = {'probability':True, 'kernel':'linear'}
        self.classifier = []

    def _train(self, data_train):
        clf = sklearn.svm.SVC(**self.parameters)
        clf.fit(data_train.data, data_train.y)
        self.classifier = clf
        return

    def _test(self, data_test):
        confs = self.classifier.predict_proba(data_test.data)
        return confs

    def _reset(self):
        self.classifier = []

def get_classifiers():
    classifiers = [{"name":"Linear SVM", "id":"LinearSVM"},
                   {"name":"Gaussian Naive Bayes", "id":"GaussianNB"},
                   {"name":"Decision Tree", "id":"DecisionTree"},
                   {"name":"Random Forest", "id":"RandomForest"}]
    return classifiers


classifier_map = {
    "Linear SVM": "LinearSVM",
    "Gaussian Naive Bayes": "GaussianNB",
    "Decision Tree": "DecisionTree",
    "Random Forest": "RandomForest"
}


def build_classifier(name):
    module = importlib.import_module("engine.classification")
    clazz = getattr(module, classifier_map[name])
    instance = clazz()
    return instance
