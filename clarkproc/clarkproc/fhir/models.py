from abc import ABC, abstractmethod
from base64 import b64decode
import datetime

from clarkproc.fhir.containers import ObservationContainer, MedicationContainer
from clarkproc.fhir.errors import *


class CodeValue:
    """
    Data structure for holding key components of FHIR Coding resource.
    Reference: http://hl7.org/fhir/STU3/datatypes.html#Coding
    """

    def __init__(self, code=None, system=None, display=None, **kwargs):
        if code is None:
            raise FHIRMissingField('Missing Coding code.')

        if system is None:
            raise FHIRMissingField('Missing Coding system.')

        self.code = code
        self.system = system
        self._display = display

    @property
    def display(self):
        return self._display or f'({self.system}, {self.code})'

    @property
    def __key(self):
        """
        :return: Key for use in hashing and equality testing.  Key excludes
            display as the system/code pair is the real uniquely identifying
            data.
        :rtype: tuple(str)
        """
        return self.system, self.code

    def __hash__(self):
        return hash(self.__key)

    def __eq__(self, other):
        if isinstance(other, CodeValue):
            return self.__key == other.__key
        return NotImplemented

    def __repr__(self):
        return str(self.__key)


_resource_registry = {}


class Resource(ABC):
    RESOURCE_TYPE = None

    def __init_subclass__(cls, bypass_resource_registration=False, **kwargs):
        super().__init_subclass__(**kwargs)

        if cls.RESOURCE_TYPE is None:
            raise NotImplementedError

        if not bypass_resource_registration:
            if cls.RESOURCE_TYPE not in _resource_registry:
                _resource_registry[cls.RESOURCE_TYPE] = cls

    @abstractmethod
    def __init__(self, fhir_resource, **kwargs):
        if fhir_resource.resource_type != self.RESOURCE_TYPE:
            raise FHIRError(
                'Incorrect resource type. Expected "{}", found "{}".'.format(
                    self.RESOURCE_TYPE, fhir_resource.resource_type))

        self.id = fhir_resource.id

    @classmethod
    def factory(cls, fhir_resource, msg_list=None):
        if fhir_resource.resource_type is None:
            return None

        resource_subcls = _resource_registry.get(fhir_resource.resource_type,
                                                 None)

        if resource_subcls is not None:
            return resource_subcls._create(fhir_resource, msg_list=None)

        return None

    @classmethod
    def _create(cls, fhir_data, msg_list=None):
        return cls(fhir_data, msg_list=msg_list)

    @property
    def id_str(self):
        s = self.RESOURCE_TYPE
        if self.id is not None:
            s += f' id "{self.id}"'

        return s

    def to_dict(self):
        return {'id': self.id}


class Patient(Resource):
    RESOURCE_TYPE = 'Patient'

    def __init__(self, fhir_patient, msg_list=None):
        super().__init__(fhir_patient)

        self.label = None

        # id isn't required in the FHIR spec, but we are going to require it for
        # our purposes.
        if not isinstance(fhir_patient.id, str):
            raise FHIRMissingField(
                f'{self.id_str} is required to have an "id" value defined.')

        try:
            if fhir_patient.animal is not None:
                raise FHIRUnsupportedFormat(
                    '{} indicates the patient is known to be an animal.  Non-human '
                    'patients are not supported.'.format(self.id_str))
        except AttributeError:
            pass

        self.labs = ObservationContainer()
        self.vitals = ObservationContainer()
        self.medications = MedicationContainer()
        self.notes = {}

        self.gender = fhir_patient.gender

        try:
            self.birthDate = fhir_patient.birthDate.date
        except AttributeError:
            self.birthDate = None

        try:
            self.maritalStatus = CodeValue(
                **fhir_patient.maritalStatus.coding[0].as_json())
        except Exception as e:
            # We don't require marital status, so set it to None.
            self.maritalStatus = None

            if not isinstance(e, AttributeError):
                if isinstance(msg_list, list):
                    msg_list.append(
                        f'{self.id_str} failed to parse marital status ({e}).')

        # TODO Implement this
        self.race = None
        self.ethnicity = None

        if isinstance(msg_list, list):
            if fhir_patient.link is not None:
                msg_list.append('{} includes a link, but patient linking is '
                                'not supported.'.format(self.id_str))

    def to_dict(self):
        # TODO Consider memoizing this.
        d = super().to_dict()
        d.update({
            'gender': self.gender,
            'birthDate': self.birthDate.isoformat(),
            'maritalStatus': self.maritalStatus.display if self.maritalStatus is not None else 'unspecified',
            'labs': self.labs.to_dict(),
            'vitals': self.vitals.to_dict(),
            'medications': self.medications.to_dict(),
            'note_ids': list(self.notes.keys()),
            'label': self.label,
        })

        return d

    def to_dict_summary(self):
        # TODO Consider memoizing this.
        d = super().to_dict()
        d.update({
            'gender': self.gender,
            'birthDate': self.birthDate.isoformat(),
            'maritalStatus': self.maritalStatus.display if self.maritalStatus is not None else 'unspecified',
            'num_labs': self.labs.unique_count,
            'num_vitals': self.vitals.unique_count,
            'num_medications': self.medications.unique_count,
            'num_notes': len(self.notes)
        })

        return d

    def get_age_in_days(self, reference_date=None):
        """Get patient age relative to a reference date (now)."""
        if reference_date is None:
            reference_date = datetime.datetime.now()
        return (reference_date - self.birthDate).total_seconds() / 60 / 60 / 24

    def get_age_in_years(self, reference_date=None):
        """Get patient age relative to a reference date (now)."""
        if reference_date is None:
            reference_date = datetime.datetime.now()
        return reference_date.year - self.birthDate.year - (
            (reference_date.month, reference_date.day) < (self.birthDate.month, self.birthDate.day)
        )


_observation_registry = {}


class Observation(Resource):
    RESOURCE_TYPE = 'Observation'
    OBSERVATION_CATEGORY = None

    def __init_subclass__(cls, **kwargs):
        # Bypass registration for subclasses since we only need the Observation
        # base class to be registered.
        super().__init_subclass__(bypass_resource_registration=True, **kwargs)

        if cls.OBSERVATION_CATEGORY is None:
            raise NotImplementedError

        if cls.OBSERVATION_CATEGORY not in _observation_registry:
            _observation_registry[cls.OBSERVATION_CATEGORY] = cls

    @abstractmethod
    def __init__(self, fhir_observation, msg_list):
        super().__init__(fhir_observation)

        # subject isn't required in the FHIR spec, but we are going to require
        # it for our purposes.
        if fhir_observation.subject is None:
            raise FHIRMissingField('{} is required to have a "subject" '
                                   'defined.'.format(self.id_str))
        else:
            self.ref = fhir_observation.subject.reference

        self.status = fhir_observation.status

        if self.status != 'final':
            raise FHIRUnsupportedFormat(
                '{} has "{}" status.  Only "final" items are supported.'.format(
                    self.id_str, self.status))

        try:
            self.effectiveDateTime = fhir_observation.effectiveDateTime.date
        except AttributeError:
            raise FHIRMissingField(
                f'{self.id_str} is missing "effectiveDateTime".')

        try:
            self.code = CodeValue(**fhir_observation.code.coding[0].as_json())
        except Exception as e:
            if isinstance(e, AttributeError):
                raise FHIRUnsupportedFormat(f'{self.id_str} is missing "code".')
            else:
                raise FHIRError(f'{self.id_str} failed to parse "code" ({e}).')

        if fhir_observation.component is not None:
            raise FHIRUnsupportedFormat(
                '{} contains component results.  This is not supported.'.format(
                    self.id_str))

        if fhir_observation.valueQuantity is None:
            raise FHIRMissingField(
                '{} does not include "valueQuantity".  No other value types '
                'are supported.'.format(self.id_str))

        quant = fhir_observation.valueQuantity

        if quant.value is None:
            raise FHIRMissingField(
                f'{self.id_str} does not include quantity value.')

        if quant.comparator is not None:
            raise FHIRUnsupportedFormat(
                f'{self.id_str} includes a comparator.  This is not supported.')

        if quant.unit is None and isinstance(msg_list, list):
            msg_list.append(f'{self.id_str} does not define a unit.')

        self.value = quant.value
        self.unit = quant.unit

    @classmethod
    def factory(cls, fhir_observation, msg_list=None):
        if fhir_observation.category is None:
            return None

        supported_systems = {
            'http://hl7.org/fhir/observation-category',  # STU3
            #'http://terminology.hl7.org/CodeSystem/observation-category',  # R4
        }

        for cat in fhir_observation.category:
            for c in getattr(cat, 'coding', []) or []:
                if c.system in supported_systems:
                    obs_subcls = _observation_registry.get(c.code, None)

                    if obs_subcls is not None:
                        return obs_subcls(fhir_observation, msg_list=msg_list)
                else:
                    raise FHIRUnsupportedFormat(
                        'Observation contains unsupported system "{}" for '
                        'observation category.'.format(c.system))

        return None

    @classmethod
    def _create(cls, fhir_data, msg_list=None):
        return cls.factory(fhir_data, msg_list=msg_list)

    def to_dict(self):
        # TODO Consider memoizing this.
        d = super().to_dict()
        d.update({
            'effectiveDateTime': self.effectiveDateTime.isoformat(),
            'value': self.value,
            'unit': self.unit,
        })

        return d


class Lab(Observation):
    OBSERVATION_CATEGORY = 'laboratory'

    def __init__(self, fhir_observation, msg_list=None):
        super().__init__(fhir_observation, msg_list)


class VitalSigns(Observation):
    OBSERVATION_CATEGORY = 'vital-signs'

    def __init__(self, fhir_observation, msg_list=None):
        super().__init__(fhir_observation, msg_list)


class MedicationRequest(Resource):
    RESOURCE_TYPE = 'MedicationRequest'

    def __init__(self, fhir_medreq, msg_list=None):
        super().__init__(fhir_medreq)

        # subject isn't required in the FHIR spec, but we are going to require
        # it for our purposes.
        if fhir_medreq.subject is None:
            raise FHIRMissingField('{} is required to have a "subject" '
                                   'defined.'.format(self.id_str))
        else:
            self.ref = fhir_medreq.subject.reference

        # TODO Do we need these?
        self.status = fhir_medreq.status
        self.intent = fhir_medreq.intent

        try:
            self.authoredOn = fhir_medreq.authoredOn.date
        except AttributeError:
            # TODO Does this need to be required?
            self.authoredOn = None

            if isinstance(msg_list, list):
                msg_list.append(f'{self.id_str} is missing "authoredOn" date.')

        try:
            self.code = CodeValue(
                **fhir_medreq.medicationCodeableConcept.coding[0].as_json())
        except Exception as e:
            if isinstance(e, AttributeError):
                raise FHIRMissingField(
                    f'{self.id_str} is missing "medicationCodeableConcept".')
            else:
                raise FHIRError(
                    '{} failed to parse "medicationCodeableConcept" '
                    '({}).'.format(self.id_str, e))

    def to_dict(self):
        # TODO Consider memoizing this.
        d = super().to_dict()
        d.update({
            'authoredOn': self.authoredOn.isoformat() if self.authoredOn is not None else self.authoredOn,
            'status': self.status,
            'intent': self.intent,
        })

        return d


class DocumentReference(Resource):
    RESOURCE_TYPE = 'DocumentReference'

    def __init__(self, fhir_docref, msg_list=None):
        super().__init__(fhir_docref)

        # subject isn't required in the FHIR spec, but we are going to require
        # it for our purposes.
        if fhir_docref.subject is None:
            raise FHIRMissingField('{} is required to have a "subject" '
                                   'defined.'.format(self.id_str))
        else:
            self.ref = fhir_docref.subject.reference

        self.status = fhir_docref.status

        try:
            self.indexed = fhir_docref.indexed.date
        except AttributeError:
            self.indexed = None
            if isinstance(msg_list, list):
                msg_list.append(f'{self.id_str} is missing "indexed" date.')

        try:
            self.type = CodeValue(**fhir_docref.type.coding[0].as_json())
        except AttributeError:
            # TODO revisit this
            self.type = None
            if isinstance(msg_list, list):
                msg_list.append(f'{self.id_str} is missing "type".')

        try:
            attachment = fhir_docref.content[0].attachment
        except AttributeError:
            raise FHIRMissingField(
                f'{self.id_str} is missing attachment content')

        if attachment.contentType != 'text/plain':
            raise FHIRUnsupportedFormat(
                '{} has "{}" format, but "text/plain" is the only supported '
                'format.'.format(self.id_str, attachment.contentType))

        try:
            self.data = b64decode(attachment.data).decode()
        except Exception as e:
            raise FHIRError(
                '{} contains attachment data that could not be '
                'decoded ({}).'.format(self.id_str, e))

    def to_dict(self):
        # TODO Consider memoizing this.
        d = super().to_dict()
        d.update({
            'status': self.status,
            'indexed': self.indexed.isoformat() if self.indexed is not None else self.indexed,
            'data': self.data
        })

        return d
