from flask import Flask
from flasgger import Swagger
# from flask_cors import CORS

from clarkproc.blueprint_fhir import TEST_DATA_INDICATOR, bp_fhir
from clarkproc.blueprint_ml import bp_ml

app = Flask("clark_server")
app.register_blueprint(bp_fhir, url_prefix='/fhir')
app.register_blueprint(bp_fhir, url_prefix='/test',
                       url_defaults={TEST_DATA_INDICATOR: True})
app.register_blueprint(bp_ml, url_prefix='/')

swagger_template = {
    "openapi": "3.0.1",
    "info": {
        "title": "CLARK Desktop API",
        "description": "Backend server for the CLARK desktop application.",
        "contact": {
            "name": "UNC TRaCS",
            "email": "kenny@covar.com",
            "url": "https://github.com/NCTraCSIDSci",
        },
        "termsOfService": {
            "name": "mit"
        },
        "version": "1.0"
    },
    "schemes": [
        "http",
        "https"
    ],
    "tags": [
        {
            "name": "FHIR",
            "description": "Methods for loading and fetching data from the FHIR data"
        },
        {
            "name": "Machine Learning",
            "description": "Methods for evaluating and exporting the results of machine learning algorithms"
        }
    ]
}

swagger_config = {
    "headers": [
    ],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "swagger_ui": True,
    "specs_route": "/apidocs/",
    "openapi": "3.0.1",
    'swagger_ui_bundle_js': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui-bundle.js',
    'swagger_ui_standalone_preset_js': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui-standalone-preset.js',
    'swagger_ui_css': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui.css',
    'swagger_ui_js': 'https://rawcdn.githack.com/swagger-api/swagger-ui/v3.23.1/dist/swagger-ui.js'

}

app.config['SWAGGER'] = {
    'title': 'CLARK API',
    'uiversion': 3
}

swagger = Swagger(app, template=swagger_template, config=swagger_config)
