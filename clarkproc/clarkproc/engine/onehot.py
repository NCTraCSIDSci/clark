"""One-hot encoding tools."""
import logging
import pandas as pd
import sklearn

logger = logging.getLogger(__name__)


class FhirOneHotEncoder():
    """One-hot encoder for FHIR data."""

    def __init__(self):
        """Initialize."""
        self.feature_names = None
        self.encoders = None

    def train(self, df):
        """Train on pandas dataframe."""
        self.encoders = []
        self.feature_names = []
        for feature_name, column in df.iteritems():
            if column.dtype != object:
                continue
            self.feature_names.append(feature_name)
            column = column.to_numpy().reshape(-1, 1)
            ohe = sklearn.preprocessing.OneHotEncoder()
            ohe.fit(column)
            self.encoders.append(ohe)
        return self

    def apply(self, df):
        """Run on pandas dataframe."""
        encoded = []
        for feature_name, encoder in zip(self.feature_names, self.encoders):
            column = df[feature_name].to_numpy().reshape(-1, 1)
            encoded.append(pd.DataFrame(
                encoder.transform(column).todense(),
                index=df.index,
                columns=encoder.categories_[0]
            ))
        df = df.drop(columns=self.feature_names)
        df = pd.concat((df, *encoded), axis=1)
        return df
