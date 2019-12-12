from abc import ABC
from collections import defaultdict
from datetime import datetime, timezone
from operator import itemgetter


class ResourceAggregator(ABC):
    """
    Data structure for holding a collection of like resources and keeping track
    of aggregate statistics for those resources.
    """

    def __init__(self):
        self.data = []

    def add(self, val):
        self.data.append(val)

    @property
    def count(self):
        return len(self.data)

    def to_dict(self):
        """
        :return:
        :rtype: dict
        """
        return {'count': self.count}


class MedicationAggregator(ResourceAggregator):
    """
    Data structure for holding a collection of like medications and keeping
    track of aggregate statistics for those medications.
    """
    pass


class ObservationAggregator(ResourceAggregator):
    """
    Data structure for holding a collection of like observations and keeping
    track of min, max, recent, and oldest values in the collection.
    """

    def __init__(self):
        super().__init__()

        self.minVal = float('inf')
        self.maxVal = -float('inf')
        self.recent = (datetime.min.replace(tzinfo=timezone.utc), None)
        self.oldest = (datetime.max.replace(tzinfo=timezone.utc), None)

    def add(self, obs):
        super().add(obs)

        val = obs.value
        date = obs.effectiveDateTime

        self.minVal = min(self.minVal, val)
        self.maxVal = max(self.maxVal, val)

        if date > self.recent[0]:
            self.recent = (date, val)

        if date < self.oldest[0]:
            self.oldest = (date, val)

    def to_dict(self):
        d = super().to_dict()
        d.update({
            'min': self.minVal,
            'max': self.maxVal,
            'recent': self.recent[1],
            'oldest': self.oldest[1],
        })

        return d


class ResourceContainer(ABC):
    aggregator_cls = None

    def __init__(self):
        self.data = defaultdict(self.aggregator_cls)
        self.total_count = 0

    def add(self, resource):
        self.data[resource.code].add(resource)
        self.total_count += 1

    @property
    def unique_count(self):
        return len(self.data.keys())

    def to_dict(self):
        entries = []

        d = {'total_count': self.total_count,
             'unique_count': self.unique_count,
             'data': entries}

        for k, v in self.data.items():
            entry_d = {
                'system': k.system,
                'code': k.code,
                'display': k.display
            }

            entry_d.update(v.to_dict())
            entries.append(entry_d)

        entries.sort(key=itemgetter('count'), reverse=True)

        return d


class MedicationContainer(ResourceContainer):
    aggregator_cls = MedicationAggregator


class ObservationContainer(ResourceContainer):
    aggregator_cls = ObservationAggregator


class CodedResourceItem:
    def __init__(self, display, id_val, units=None):
        self.display = display
        self._ids = [id_val]
        self.units = units

    @property
    def display(self):
        return self._display

    @display.setter
    def display(self, d):
        self._display = d
        self._displays_set = {d} if d is not None else set()

    @property
    def units(self):
        return self._units

    @units.setter
    def units(self, u):
        self._units = u
        self._units_set = {u} if u is not None else set()

    def add_id(self, id_val):
        self._ids.append(id_val)

    def check_display(self, display_val):
        """
        Test if display value has been previously encountered.  If it has not
        then value is added to :attr:`_displays_set`.

        :param str display_val: Display value to test.
        :return: ``True`` if value has been encountered.  ``False`` otherwise.
        :rtype: bool
        """

        if display_val in self._displays_set:
            return True
        else:
            self._displays_set.add(display_val)
            return False

    def check_units(self, unit_val):
        """
        Test if units value has been previously encountered.  If it has not
        then value is added to :attr:`_units_set`.

        :param str unit_val: Units value to test.
        :return: ``True`` if value has been encountered.  ``False`` otherwise.
        :rtype: bool
        """

        if unit_val in self._units_set:
            return True
        else:
            self._units_set.add(unit_val)
            return False

    def num_ids(self):
        return len(self._ids)

    def num_unique_ids(self):
        return len(set(self._ids))


class CodedResourceLUT:
    def __init__(self, check_units):
        self.check_units = check_units
        self.data = {}
        self.total_count = 0

    def __len__(self):
        return len(self.data.keys())

    def add(self, code, id_val, units=None):
        msg = []
        entry = self.data.get(code)

        if entry is None:
            self.data[code] = CodedResourceItem(
                code.display, id_val, units if self.check_units else None)
        else:
            if code.display is not None:
                existing_display = entry.display

                if existing_display is None:
                    # Update stored display to reflect an actual value.
                    entry.display = code.display
                elif not entry.check_display(code.display):
                    msg.append(
                        'WARN: Mismatch in system/code pair display.  ({}, {}) '
                        'defined with display "{}", but additional record '
                        'encountered with display "{}".'.format(
                            code.system, code.code, existing_display,
                            code.display))

            if self.check_units and units is not None:
                existing_units = entry.units

                if existing_units is None:
                    # Update stored units to reflect an actual value.
                    entry.units = units
                elif not entry.check_units(units):
                    msg.append(
                        'WARN: Mismatch in system/code pair units.  ({}, {}) '
                        'defined with units "{}", but additional record '
                        'encountered with units "{}".'.format(
                            code.system, code.code, existing_units, code.units))

            entry.add_id(id_val)

        self.total_count += 1

        return msg

    def to_dict(self):
        entries = []
        d = {'total_count': self.total_count,
             'unique_count': len(self),
             'data': entries}

        for k, v in self.data.items():
            entry_d = {
                'system': k.system,
                'code': k.code,
                'display': v.display or f'({k.system}, {k.code})',
                'total_count': v.num_ids(),
                'unique_count': v.num_unique_ids(),
            }

            entries.append(entry_d)

        entries.sort(key=itemgetter('unique_count', 'total_count'),
                     reverse=True)

        return d
