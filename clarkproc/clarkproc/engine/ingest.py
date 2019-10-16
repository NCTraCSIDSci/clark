import json
import re
from glob import glob

from fhir.resources.STU3.fhirelementfactory import FHIRElementFactory

from ..fhir.containers import CodedResourceLUT
from ..fhir.errors import FHIRError
from ..fhir.models import (DocumentReference,
                           Lab,
                           Patient,
                           MedicationRequest,
                           Resource,
                           VitalSigns)


def ingest_fhir(paths):
    fhir_files = []
    messages = {
        'general': [],
        'files': {},
        'linking': []
    }

    # Iterate over provided paths and glob to expand wildcards.
    for p in paths:
        files = glob(p)

        if not files:
            messages['general'].append(f'ERROR: No files found in path "{p}".')
        else:
            fhir_files += files

    if len(fhir_files) < 1:
        messages['general'].append(
            'ERROR: No files found in specified path(s).')
        return messages, None, None, None, None

    patients = {}

    lab_list = []
    vital_list = []
    medication_list = []
    note_list = []

    file_messages = {}

    # Iterate over list of all FHIR files to ingest.
    for f_json in fhir_files:
        msg_list = []
        file_messages[f_json] = msg_list

        # Try to load JSON data from file.
        try:
            with open(f_json, 'r', encoding='utf-8') as jsonfile:
                json_results = json.load(jsonfile)
        except Exception as e:
            msg_list.append(f'ERROR: JSON decoding failed ({e}).')
            continue

        if 'resourceType' not in json_results:
            msg_list.append('ERROR: resourceType missing in JSON data.')
            continue

        # Try to reconstitute JSON data into FHIR resources.
        try:
            element = FHIRElementFactory.instantiate(
                json_results['resourceType'], json_results)
        except Exception as e:
            msg_list.append(f'ERROR: FHIR parsing failed ({e}).')
            continue

        if element.resource_type != 'Bundle':
            msg_list.append(
                'ERROR: Found resourceType "{}" but only "Bundle" is '
                'supported.'.format(element.resource_type))
            continue

        # Iterate through all resources in the bundle, collecting like resources
        # so that they can be linked together later.
        for idx, bundleEntry in enumerate(element.entry):
            resource = bundleEntry.resource

            # Try to convert the FHIR resource into one of our defined models.
            try:
                r = Resource.factory(resource, msg_list)
            except FHIRError as e:
                msg_list.append(f'ERROR: {e}')
                continue

            if r is None:
                # Skip over unsupported resource type.
                continue

            if isinstance(r, Patient):
                if r.id in patients:
                    msg_list.append(
                        f'ERROR: Skipping patient with duplicate id {r.id}.')
                else:
                    patients[r.id] = r
            elif isinstance(r, Lab):
                lab_list.append(r)
            elif isinstance(r, VitalSigns):
                vital_list.append(r)
            elif isinstance(r, MedicationRequest):
                medication_list.append(r)
            elif isinstance(r, DocumentReference):
                note_list.append(r)

    messages['files'] = file_messages

    if len(patients) < 1:
        messages['general'].append(
            'ERROR: No patients loaded.  At least one patient is required.')
        return messages, None, None, None, None

    msg_list = []

    labs = CodedResourceLUT(check_units=True)
    vitals = CodedResourceLUT(check_units=True)
    medications = CodedResourceLUT(check_units=False)

    def get_patient_id(resource):
        patient_id = re.split('[/:]', resource.ref)[-1]

        if patient_id not in patients:
            msg_list.append('WARN: Discarding {} due to no patient with '
                            'id {}.'.format(resource.id_str, patient_id))
            return None
        else:
            return patient_id

    # Iterate through labs, adding them to the associated patient and storing in
    # the lab LUT.
    for lab in lab_list:
        patient_id = get_patient_id(lab)

        if patient_id is not None:
            patients[patient_id].labs.add(lab)
            msg_list += labs.add(lab.code, patient_id, lab.unit)

    # Iterate through vitals, adding them to the associated patient and storing
    # in the vital LUT.
    for vital in vital_list:
        patient_id = get_patient_id(vital)

        if patient_id is not None:
            patients[patient_id].vitals.add(vital)
            msg_list += vitals.add(vital.code, patient_id, vital.unit)

    # Iterate through medications, adding them to the associated patient and
    # storing in the medication LUT.
    for medication in medication_list:
        patient_id = get_patient_id(medication)

        if patient_id is not None:
            patients[patient_id].medications.add(medication)
            msg_list += medications.add(medication.code, patient_id)

    # Iterate through notes, adding them to the associated patient.
    for note in note_list:
        patient_id = get_patient_id(note)

        if patient_id is not None:
            patients[patient_id].notes[note.id] = note

    if msg_list:
        messages['linking'] = msg_list

    return messages, patients, labs, vitals, medications
