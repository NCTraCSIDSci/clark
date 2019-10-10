from flask import Flask
from flasgger import Swagger
# from flask_cors import CORS

from blueprint_corpus import bp_corpus
from blueprint_regex_setup import bp_regex_setup
from blueprint_ml import bp_ml
from blueprint_session import bp_session

app = Flask("clark_server")
app.register_blueprint(bp_session, url_prefix='/')
app.register_blueprint(bp_corpus, url_prefix='/')
app.register_blueprint(bp_regex_setup, url_prefix='/')
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
            "name": "Session",
            "description": "Methods for loading, saving and fetching application state"
        },
        {
            "name": "Corpus",
            "description": "Methods for loading and fetching data from the training and test corpora"
        },
        {
            "name": "Features",
            "description": "Methods for loading, saving and manipulating the feature regular expressions"
        },
        {
            "name": "Keywords",
            "description": "Methods for loading, saving and manipulating the keyword regular expressions"
        },
        {
            "name": "Sections",
            "description": "Methods for loading, saving and manipulating the section defintion regular expressions"
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
