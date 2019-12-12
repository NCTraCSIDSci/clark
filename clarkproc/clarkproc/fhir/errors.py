class FHIRError(Exception):
    pass


class FHIRMissingField(FHIRError):
    pass


class FHIRUnsupportedFormat(FHIRError):
    pass
