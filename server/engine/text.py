# -*- coding: utf-8 -*-
"""
Created on Thu Dec  1 13:01:10 2016

@author: miles
"""
import re
import json
import copy
import numpy as np
from collections import defaultdict
from collections import OrderedDict

import engine.classification


class Corpus():
    """ In-memory class for managing and accessing corpus data.
        We expect the json to have the following fields:

        [{ptId:int, name: str, label: str, notes: [],...}]

        With a note having the following fields:

        {noteId: int, noteText: str, noteDate: str}

        Both patient id and note id should be globally unique amongst
        patients/notes respectively.

        v2 format:
        Json file is a list of notes, with patient info embedded into each note.
    """

    def __init__(self, *argv):
        """
        Construct a new Corpus object from a JSON file.

        :param corpusPath: The path to the corpus file.
        """
        if len(argv)==0:
            return

        corpusPath = argv[0]
        self.corpusPath = corpusPath
        with open(corpusPath, 'r') as corpusFile:
            self.raw = json.load(corpusFile)
            self.patient_dict, self.notes_dict = self._load_data(self.raw)

    def _load_data(self, raw_file):
        """
        Loads data from the raw JSON file and constructs two dictionaries:
        one maps patient id to patient object, the other maps note id to note object.
        """

        patient_dict = {}
        notes_dict = {}
        for row in self.raw:
            try:
                row['noteId'] = row['noteID']
            except:
                temp = 0

            mrn = row['MRN']
            note = Note(**row)
            if not mrn in patient_dict:
                patient = Patient(MRN=mrn, label=row['label'])
                patient_dict[mrn] = patient
            else:
                patient = patient_dict[mrn]

            patient.notes.append(note)
            notes_dict[note.id] = note

        """
        v1 method of loading things.
        patient_dict = {}
        notes_dict = {}
        for row in self.raw:
            # row stored as dict, so convert to keyword args with **
            patient = Patient(**row)
            patient_dict[patient.id] = patient

            #assuming a note id is globally unique now
            for n in patient.notes:
                notes_dict[n.id] = n
        """
        return patient_dict, notes_dict

    def get_patient_by_id(self, index):
        """
        Gets a patient by unique identifier.
        :param index: patient identifier
        """
        return self.patient_dict[index]

    def get_note_by_id(self, nId):
        """
        Gets a note by unique identifier.
        :param nId: note identifier
        """
        return self.notes_dict[nId]

    def get_patients(self):
        """
        Gets all patients as a list.
        """
        return self.patient_dict.values()

    def get_patient_tree(self):
        """
        Gets the patient tree, effectivelly a retransformation of the JSON file but used by the ag grid interface element.
        """
        patients = []
        for patient in self.get_patients():
            state = {"expanded":False}
            node = {"ptId":patient.id, "text":patient.name, "tags":[str(len(patient.notes))], "state":state}
            nodes = []
            for n in patient.notes:
                note = {"text":n.date, "nodes": [], "noteId":n.id, "patientId":patient.id, "state":state}
                nodes.append(note)
                node["nodes"] = nodes
            patients.append(node)
        return patients

    def serialize(self):
        return self.raw

class Patient():
    '''Class for keeping track of patient data.'''
    def __init__(self, MRN, label, name=None):
        self.id = MRN
        if not name:
            self.name = MRN
        self.label = label
        self.notes = []

    def serialize(self, notes=False):
        ser = {"id":self.id, "name":self.name, "label":self.label}
        if notes:
            n = []
            for note in self.notes:
                n.append(note.serialize())
            ser["notes"] = n
        return ser

    def summarize(self):
        '''Get summary of patient data without note text.'''
        note_summary = {'noteId':[],'noteDate':[]}
        for note in self.notes:
            note_summary['noteId'] += [note.noteId]
            note_summary['noteDate'] += [note.noteDate]
        return note_summary

class Note():
    '''Class for keeping track of patient notes.'''
    def __init__(self, **kwargs):

        self.id = kwargs['noteId']
        self.date = kwargs['noteDate']
        #exclude the id, noteDate, and note from kwargs
        self.metadata = kwargs.copy()
        self.metadata.pop('noteId', None)
        self.metadata.pop('noteDate', None)
        self.metadata.pop('note', None)

        text = kwargs['note']
        if isinstance(text,str):
            text = [text]

        self.text = text

        if 'tags' not in kwargs.keys():
            self.tags = [{}]
        else:
            self.tags = kwargs['tags']

    def get_text(self):
        '''Loop through text and combine, joining newlines at break points.'''
        text = [t + '\n' for t in self.text]
        text = ''.join(text)
        return text[:-1]

    def serialize(self, text=True):
        ser = {"id":self.id, "date":self.date}
        if text:
            ser["text"] = self.text
        ser["metadata"] = self.metadata
        return ser

class ProcessingBlock():
    '''A processing block holds the four parts of the algorithm processing
    chain, and its purpose is to keep track of the big picture view of the
    processing chain, as well as all parameters used for feature generation.
    '''

    def __init__(self, **kwargs):
        default_args = {'section_splitter':{}, 'sentence_splitter':{},
                        'feature_extractor':{}, 'feature_combiner':{}}
        default_args.update(kwargs)

        self.section_splitter = SectionSplitter(**default_args['section_splitter'])
        self.sentence_splitter = SentenceSplitter(**default_args['sentence_splitter'])
        self.feature_extractor = FeatureExtractor(**default_args['feature_extractor'])
        self.feature_combiner = FeatureCombiner(**default_args['feature_combiner'])

    def run(self, corpus):
        '''Process data from a corpus into a DataSet for classification.'''

        ds = engine.classification.DataSet()
        for patient in corpus.get_patients():
            print('Processing pt: {}'.format(patient.id))
            patient_ds = engine.classification.DataSet()

            patient = copy.deepcopy(patient)
            num_notes = len(patient.notes)
            for note in patient.notes:
                self.section_splitter.run(note)
                self.sentence_splitter.run(note)
                note_ds = self.feature_extractor.run(note)
                patient_ds = patient_ds.cat_obs(note_ds)

            patient_ds = self.feature_combiner.run(patient_ds)
            patient_ds.data = patient_ds.data/num_notes

            obs = [{'pt_id':patient.id, 'name':patient.name}]
            patient_ds.targets = [patient.label]
            patient_ds.obs_info = obs
            ds = ds.cat_obs(patient_ds)

        return ds

    def load_feature_expressions(self, file):
        self.feature_extractor.load_expressions(file)

    def load_feature_keywords(self, file):
        self.feature_extractor.load_keywords(file)

    @classmethod
    def loads(cls, load_str):
        load_json = json.loads(load_str)
        return cls(**load_json)

    def dumps(self):
        return json.dumps(self, default=dumper, indent=2)

    def load_sectioning_file(self, section_file):
        with open(section_file, 'r') as fid:
            in_data = json.load(fid)
        split_expr = in_data['split_expr']
        [valid, cur_expr] = self.section_splitter.set_expression(split_expr)

        sec_data = in_data['sec_data']
        self.feature_combiner.set_expression_data(sec_data)

        return (valid, cur_expr)

    def save_sectioning_file(self, section_file):
        split_expr = self.section_splitter.get_expression()
        sec_data = self.feature_combiner.get_expression_data()
        out_data = {'split_expr':split_expr,'sec_data':sec_data}
        with open(section_file, 'w+') as outfile:
            json.dump(out_data, outfile, indent=4)

def dumper(obj):
    if isinstance(obj, type(re.compile(''))):
        return obj.pattern
    try:
        return obj.toJSON()
    except:
        return obj.__dict__

class SectionSplitter():
    def __init__(self, **kwargs):
        # default searches for markup sections
        # not allowed to have an invalid section regex
        self.expression = re.compile('\n#+ [^\n]*\n')

        # anything before the first section match gets this section tag
        self.header_section_name = 'header'

        # set properties with input args
        for key in kwargs:
            setattr(self, key, kwargs[key])

    def set_expression(self, new_expr):
        valid = True
        try:
            current_expr = re.compile(new_expr)
            self.expression = current_expr
        except:
            valid = False

        return (valid, self.expression.pattern)

    def get_expression(self):
        return self.expression.pattern

    def run(self, note):
        text = []
        tags = []

        for (txt, tag) in zip(note.text, note.tags):

            (sec_text, sec_tags) = self.split_sections(txt)

            text += sec_text
            tags += sec_tags

        note.text = text
        note.tags = tags

    def split_sections(self, text):
        # test corpus needs newline character at beginning
        text = '\n' + text

        sec_text = []
        # anything before the first section match goes in the header
        sec_tags = [{'section':self.header_section_name}]

        # loop through the text, and each match corresponds to a section break
        # the text contained in the match is the string associated with that section
        pos = 0
        for iIteration in range(len(text)):
            match = self.expression.search(text, pos)
            if match is None:
                break # no more matches left

            span = match.span()
            if span[1]==span[0]:
                # empty match. move position to the right and do not add a section
                pos = span[1] + 1
                continue

            cur_sec_tag = text[span[0]:span[1]]
            prev_sec_text = text[pos:span[0]]
            pos = span[1]

            sec_tags.append({'section':cur_sec_tag})
            sec_text.append(prev_sec_text)

        # anything after the last section match is part of the last section
        sec_text.append(text[pos:])
        return (sec_text, sec_tags)

class SentenceSplitter():
    def __init__(self):
        return

    def run(self, note):

        text = []
        tags = []

        for (txt, tag) in zip(note.text, note.tags):

            sen_text = split_sentences(txt)

            # note: these tags are not copied on purpose for now - changing
            # tag values for one sentence in a particular section will change
            # tags for all sentences in that section.
            sen_tags = [tag] * len(sen_text)

            text += sen_text
            tags += sen_tags

        note.text = text
        note.tags = tags

def split_sentences(text):
    """
    Created on Thu Nov 17 15:13:46 2016
    @author: miles
    mostly copied from "http://stackoverflow.com/questions/4576077/python-split-text-on-sentences"
    Added digit fix suggested in comments
    Added necessary ' ' after .?!
    """

    caps = "([A-Z])"
    prefixes = "(Mr|St|Mrs|Ms|Dr)[.]"
    suffixes = "(Inc|Ltd|Jr|Sr|Co)"
    starters = "(Mr|Mrs|Ms|Dr|He\s|She\s|It\s|They\s|Their\s|Our\s|We\s|But\s|However\s|That\s|This\s|Wherever)"
    acronyms = "([A-Z][.][A-Z][.](?:[A-Z][.])?)"
    websites = "[.](com|net|org|io|gov|edu|med)"
    digits = "([0-9])"

    text = " " + text + "  "
    text = text.replace("\n"," ")
    text = re.sub(prefixes,"\\1<prd>",text)
    text = re.sub(websites,"<prd>\\1",text)
    if "Ph.D" in text: text = text.replace("Ph.D.","Ph<prd>D<prd>")
    text = re.sub("\s" + caps + "[.] "," \\1<prd> ",text)
    text = re.sub(acronyms+" "+starters,"\\1<stop> \\2",text)
    text = re.sub(caps + "[.]" + caps + "[.]" + caps + "[.]","\\1<prd>\\2<prd>\\3<prd>",text)
    text = re.sub(caps + "[.]" + caps + "[.]","\\1<prd>\\2<prd>",text)
    text = re.sub(" "+suffixes+"[.] "+starters," \\1<stop> \\2",text)
    text = re.sub(" "+suffixes+"[.]"," \\1<prd>",text)
    text = re.sub(" " + caps + "[.]"," \\1<prd>",text)
    text = re.sub(digits + "[.]" + digits,"\\1<prd>\\2",text)
    if "”" in text: text = text.replace(".”","”.")
    if "\"" in text: text = text.replace(".\"","\".")
    if "!" in text: text = text.replace("!\"","\"!")
    if "?" in text: text = text.replace("?\"","\"?")
    text = text.replace(". ",".<stop>")
    text = text.replace("? ","?<stop>")
    text = text.replace("! ","!<stop>")
    text = text.replace("<prd>",".")
    sentences = text.split("<stop>")
    #sentences = sentences[:-1]
    #sentences = [s.strip() for s in sentences]

    return sentences

class FeatureExtractor():
    def __init__(self, **kwargs):
        self.names = []
        self.expressions = []
        self.expressions_valid = []
        # self.keywords = {} # this has become a dependent property
        self._keyword_data = []
        self._raw_expressions = []
        for key in kwargs:
            setattr(self, key, kwargs[key])

    @property
    def keywords(self):
        # get keywords from _keyword_data
        #   _keyword_data is a list of lists. ex:
        #   [['beak', true, '\\bbeak\\b', true], ...]
        d = {k[0]: k[2] for k in self._keyword_data if k[1] and k[3]}
        return d

    @keywords.setter
    def keywords(self, dict_in):
        # assert that dict_in is a dict

        keywords_list = []
        # a valid keyword must be able to be compiled by re
        for key, val in dict_in.items():
            item = self.keyword_key_val_to_keyword_list(key, val)

            keywords_list.append(item)

        # Check if each name in the keywords list is unique
        keywords_list = self.keyword_list_name_collision_check(keywords_list)

        self.set_keyword_data(keywords_list)

    @property
    def keywords_all(self):
        # get keywords from _keyword_data
        #   _keyword_data is a list of lists. ex:
        #   [['beak', true, '\\bbeak\\b', true], ...]
        d = {k[0]: [k[2], k[1]] for k in self._keyword_data}
        return d

    def get_all_keywords_as_dict(self):
        out = OrderedDict()
        for k in self._keyword_data:
            out[k[0]] = k[2]
        return out

    def get_all_expressions_as_dict(self):
        items = []
        for name, rawexpr in zip(self.names, self._raw_expressions):
            items.append({"expr":rawexpr, "name":name})
        return items

    def get_expressions_valid(self):
        items = []
        for exp in self.expressions:
            if exp:
                items.append(re.compile(exp.pattern))
        return items

    def get_names_valid(self):
        names = []
        for exp, name in zip(self.expressions, self.names):
            if exp:
                names.append(name)
        return names

    def keyword_key_val_to_keyword_list(self, key, val):
        item = [key, False, val, False]
        match = re.search(r'^\w+$',key)
        if match is not None:
            item[1] = True

        try:
            compiled_expr = re.compile(val)
            item[3] = True
        except:
            item[3] = False

        return item

    def keyword_list_name_collision_check(self, keywords_list):
        count_dict = defaultdict(int)
        for item in keywords_list:
            count_dict[item[0]] += 1

        for item in keywords_list:
            item[1] = count_dict[item[0]] == 1

        return keywords_list

    def set_keyword_data(self, key_data):
        self._keyword_data = key_data

    def run(self, note):

        ds = engine.classification.DataSet()
        expressions_valid = self.get_expressions_valid()
        # ds.featureInfo = expressions_valid
        # keep track of which patterns features come from for debugging
        expr_patterns = [{'pattern':expr.pattern} for expr in expressions_valid]
        ds.feat_info = expr_patterns
        ds.data = np.zeros((len(note.text), len(expressions_valid)))
        ds.obs_info = note.tags
        ds.targets = [[]]*len(note.text)

        for index in np.ndindex(ds.data.shape):
            text = note.text[index[0]]
            expr = expressions_valid[index[1]]
            match = re.search(expr, text)

            if match is not None:
                ds.data[index] += 1

        return ds

    def load_expressions(self, file):
        with open(file, 'r') as fid:
            expressions = json.load(fid, object_pairs_hook=OrderedDict)

        # compile incoming expressions for faster run time and ensuring
        # validity of the expressions prior to runtime
        self._raw_expressions = []
        self.names = []
        for expr in expressions:
            self._raw_expressions.append(expr['expr'])

            if len(expr['name']) is 0:
                expr['name'] = default_feature_name(expr['expr'])

            self.names.append(expr['name'])

        self.compile_expressions()

    def save_expressions(self, new_expr_file):
        items = self.get_all_expressions_as_dict()
        with open(new_expr_file, 'w+') as outfile:
            json.dump(items, outfile, indent=4)

    def remove_expression(self, index):
        self.names.pop(index)
        self._raw_expressions.pop(index)

        self.compile_expressions()

    def move_expression(self, index, new_index):

        if ((index < 0) or (index >= len(self.names))):
            raise Exception("Bad index")

        if (new_index < 0):
            new_index = 0

        if (new_index >= len(self.names)):
            new_index = len(self.names)-1

        self.names.insert(new_index, self.names.pop(index))
        self._raw_expressions.insert(new_index, self._raw_expressions.pop(index))

        self.compile_expressions()

    def new_expression(self, index):
        # Inserts at the index and shifts everything down
        new_name = r''
        new_expr = r'\b\b'

        if (index >= len(self.names)):
            self.names.append(new_name)
            self._raw_expressions.append(new_expr)
        else:
            self.names.insert(index, new_name)
            self._raw_expressions.insert(index, new_expr)

        self.compile_expressions()

    def edit_expression(self, index, new_name, new_regex):
        if ((index < 0) or (index >= len(self.names))):
            raise Exception("Bad index")

        if len(new_name) is 0:
            new_name = default_feature_name(new_regex)

        self.names[index] = new_name
        self._raw_expressions[index] = new_regex

        self.compile_expressions()

    def load_keywords(self, file):
        with open(file, 'r') as fid:
            self.keywords = json.load(fid, object_pairs_hook=OrderedDict)
        self.compile_expressions()

    def save_keywords(self, new_keyw_file):
        with open(new_keyw_file, 'w+') as outfile:
            json.dump(self.get_all_keywords_as_dict(), outfile, indent=4)

    def remove_keyword(self, index):
        self._keyword_data.pop(index)
        self.compile_expressions()

    def move_keyword(self, index, new_index):
        key_data = self._keyword_data

        if ((index < 0) or (index >= len(key_data))):
            raise Exception("Bad index")

        if (new_index < 0):
            new_index = 0

        if (new_index >= len(key_data)):
            new_index = len(key_data)-1

        key_data.insert(new_index, key_data.pop(index))
        self.compile_expressions()

    def new_keyword(self, index):
        # Inserts at the index and shifts everything down
        new_key_data = self.keyword_key_val_to_keyword_list("New", r'\b\b')

        key_data = self._keyword_data
        if (index >= len(key_data)):
            key_data.append(new_key_data)
        else:
            key_data.insert(index, new_key_data)

        key_data = self.keyword_list_name_collision_check(key_data)
        self.compile_expressions()

    def edit_keyword(self, index, new_name, new_regex):
        key_data = self._keyword_data

        key_data[index] = self.keyword_key_val_to_keyword_list(new_name, new_regex)
        key_data = self.keyword_list_name_collision_check(key_data)
        self.compile_expressions()

    def compile_expressions(self):
        '''Replace keywords and compile expressions with re'''

        self.expressions = []
        self.expressions_valid = []
        for expr in self._raw_expressions:
            failure, compiled_expr = self.test_compile_expression(expr)
            self.expressions_valid.append(not failure)
            if failure:
                self.expressions.append("")
            else:
                self.expressions.append(compiled_expr)

    def test_compile_expression(self, expr):
        # split on escaped backslash to prevent these from escaping '#'
        # four raw backslashes are required since regex needs each of two
        # backslashes escaped (\\)(\\)
        split_expr = re.split(r'\\\\', expr)
        keys = self.keywords_all

        new_expr = ''
        for expr_part in split_expr:
            pieces = re.split(r'(?<!\\)(#\w+)', expr_part)

            # replace each #keyword with its correponding keyword entry
            # cond checks if each piece is NOT a valid keyword
            cond = lambda p: len(p) == 0 or p[0] is not '#' or p[1:] not in keys.keys()
            # this line replaces pieces with their keyword expression if valid
            repl = [p if cond(p) else p if not keys[p[1:]][1] else keys[p[1:]][0] for p in pieces]

            new_expr += ''.join(repl)

        try:
            compiled_expr = re.compile(new_expr)
            return [False, compiled_expr]
        except:
            return [True, ""]

    def serialize(self):
        keyw_dict = self.get_all_keywords_as_dict()
        expr_dict = self.get_all_expressions_as_dict()
        return {"keywords":keyw_dict, "expressions":expr_dict}

    def get_feature_expressions(self):
        items = []
        for name, rawexpr, expr, valid in zip(self.names, self._raw_expressions, self.expressions, self.expressions_valid):
            try:
                expr_text = expr.pattern
            except:
                expr_text = ""

            items.append({"name":name, "rawRegex":rawexpr, "regex":expr_text, "isValid": valid})
        return items

    def get_keyword_expressions(self):
        items = []
        for item in self._keyword_data:
            items.append({"name": item[0], "nameIsValid": item[1], "regex": item[2], "regexIsValid": item[3]})

        return items

def default_feature_name(expr):
    '''Generate default feature name from an expression.'''
    name = re.sub(r'\\.', '', expr)
    name = re.sub(r'\W', '', name)
    return name

class FeatureCombiner():
    '''
    This object looks through section tags in a patient dataset and groups them
    based on the given expressions. Features with matching section groups are
    concatenated rather than added. Most of this code is copied and modified
    from the FeatureExtractor.
    '''

    def __init__(self, **kwargs):
        self.names = []
        self.expressions = []
        self._raw_expressions = []
        self.expressions_used = []
        self.expressions_valid = []
        for key in kwargs:
            setattr(self, key, kwargs[key])

    def run(self, ds):
        # ds.data = ds.data.sum(0).reshape(1,ds.n_feats)
        # ds.obs_info = [[]]
        expr_list = zip(self.expressions, self.expressions_used, self.names, self.expressions_valid)
        expr_list = [item for item in expr_list if item[3]]

        if len(ds.targets)==0:
            ds.targets = [[]]*ds.n_obs

        ds_out = engine.classification.DataSet()

        unused = [True]*ds.n_obs
        for (expr, use, name, valid) in expr_list:
            # keep observations corresponding to this expression
            keep = [False]*ds.n_obs
            for iObs in range(ds.n_obs):
                match = re.search(expr, ds.obs_info[iObs]['section'])
                if match is not None:
                    keep[iObs] = True

            # sum together observations within this ds that match same section
            ds_sec = ds.get_obs(keep)
            if ds_sec.isempty():
                ds_sec.data = np.zeros((1,ds.n_feats))
                ds_sec.feat_info = copy.deepcopy(ds.feat_info)
            else:
                ds_sec.data = ds_sec.data.sum(0).reshape(1,ds_sec.n_feats)

            ds_sec.obs_info = [[]]
            ds_sec.targets = [[]]

            # update the feature info to keep track of where the features come from
            for iFeat in range(ds_sec.n_feats):
                ds_sec.feat_info[iFeat].update({'section':name})

            if use:
                ds_out = ds_out.cat_feats(ds_sec)

            # unused entries are still unused, and were not kept this iteration
            unused = [u and not k for (u,k) in zip(unused, keep)]

        ds_sec = ds.get_obs(unused)
        if ds_sec.isempty():
            ds_sec.data = np.zeros((1,ds.n_feats))
            ds_sec.feat_info = copy.deepcopy(ds.feat_info)
        else:
            ds_sec.data = ds_sec.data.sum(0).reshape(1,ds_sec.n_feats)

        ds_sec.obs_info = [[]]
        for iFeat in range(ds_sec.n_feats):
            ds_sec.feat_info[iFeat].update({'section':'unused'})

        ds_out = ds_out.cat_feats(ds_sec)
        return ds_out

    def get_all_expressions_as_dict_with_valid(self):
        items = []
        for name, rawexpr, used, isValid in zip(self.names, self._raw_expressions, self.expressions_used, self.expressions_valid):
            items.append({"rawRegex":rawexpr, "name":name, "used":used, "isValid": isValid})
        return items

    def get_all_expressions_as_dict(self):
        items = []
        for name, rawexpr, used in zip(self.names, self._raw_expressions, self.expressions_used):
            items.append({"expr":rawexpr, "name":name, "used":used})
        return items

    def get_expression_data(self):
        # note: don't send the compiled expressions
        data = list(zip(self._raw_expressions, self.expressions_used, self.names))
        return data

    def set_expression_data(self, data):
        [raw, used, names] = zip(*data)
        self._raw_expressions = raw
        self.expressions_used = used
        self.names = names
        self.compile_expressions()

    def remove_expression(self, index):
        self.names.pop(index)
        self._raw_expressions.pop(index)
        self.expressions_used.pop(index)
        self.compile_expressions()

    def move_expression(self, index, new_index):

        if ((index < 0) or (index >= len(self.names))):
            raise Exception("Bad index")

        if (new_index < 0):
            new_index = 0

        if (new_index >= len(self.names)):
            new_index = len(self.names)-1

        self.names.insert(new_index, self.names.pop(index))
        self._raw_expressions.insert(new_index, self._raw_expressions.pop(index))
        self.expressions_used.insert(new_index, self.expressions_used.pop(index))

        self.compile_expressions()

    def new_expression(self, index):
        # Inserts at the index and shifts everything down
        new_name = r''
        new_expr = r'\b\b'
        new_use = True

        if (index >= len(self.names)):
            self.names.append(new_name)
            self._raw_expressions.append(new_expr)
            self.expressions_used.append(new_use)
        else:
            self.names.insert(index, new_name)
            self._raw_expressions.insert(index, new_expr)
            self.expressions_used.insert(index, new_use)

        self.compile_expressions()

    def edit_expression(self, index, new_name, new_regex, use_regex):
        if ((index < 0) or (index >= len(self.names))):
            raise Exception("Bad index")

        if len(new_name) is 0:
            new_name = default_feature_name(new_regex)

        self.names[index] = new_name
        self._raw_expressions[index] = new_regex
        self.expressions_used[index] = use_regex

        self.compile_expressions()

    def compile_expressions(self):
        self.expressions = []
        self.expressions_valid = []
        for expr in self._raw_expressions:
            failure, compiled_expr = self.test_compile_expression(expr)
            self.expressions_valid.append(not failure)
            if failure:
                self.expressions.append("")
            else:
                self.expressions.append(compiled_expr)

    def test_compile_expression(self, expr):
        # this method simpler than the feature extractor because no keywords
        try:
            compiled_expr = re.compile(expr);
            return [False, compiled_expr]
        except:
            return [True, ""]
