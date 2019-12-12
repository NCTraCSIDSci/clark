import Ajv from 'ajv';

const sessionSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    fhir_directory: {
      type: 'string',
    },
    structured_data: {
      type: 'object',
      properties: {
        patient: {
          type: 'object',
          properties: {
            age: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['numeric', 'binned'],
                  },
                },
                reference_date: {
                  type: 'string',
                },
              },
              required: ['features', 'reference_date'],
              additionalProperties: false,
            },
            gender: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['one-hot'],
                  },
                },
              },
              additionalProperties: false,
            },
            race: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['one-hot'],
                  },
                },
              },
              additionalProperties: false,
            },
            ethnicity: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['one-hot'],
                  },
                },
              },
              additionalProperties: false,
            },
            marital_status: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['one-hot'],
                  },
                },
              },
              additionalProperties: false,
            },
          },
        },
        labs: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              features: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['max', 'min', 'newest', 'oldest'],
                },
              },
            },
            additionalProperties: false,
          },
        },
        meds: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              features: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['count', 'boolean'],
                },
              },
            },
            additionalProperties: false,
          },
        },
        vitals: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              features: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['max', 'min', 'newest', 'oldest'],
                },
              },
            },
            additionalProperties: false,
          },
        },
      },
      required: ['patient', 'labs', 'meds', 'vitals'],
      additionalProperties: false,
    },
    unstructured_data: {
      type: 'object',
      properties: {
        regex_library: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              regex: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
        },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              regex: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
        },
        sections: {
          type: 'object',
          properties: {
            section_break: {
              type: 'string',
            },
            ignore_header: {
              type: 'boolean',
            },
            ignore_untagged: {
              type: 'boolean',
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  regex: {
                    type: 'string',
                  },
                  ignore: {
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
              },
            },
          },
          required: [
            'section_break', 'ignore_header',
            'ignore_untagged', 'tags',
          ],
          additionalProperties: false,
        },
      },
      required: [
        'regex_library', 'features', 'sections',
      ],
      additionalProperties: false,
    },
    algo: {
      type: 'object',
      properties: {
        algo_type: {
          type: 'string',
        },
        eval_method: {
          oneOf: [
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  const: 'Cross-Validation',
                },
                crossval_method: {
                  type: 'string',
                },
                num_folds: {
                  type: 'number',
                },
              },
              required: [
                'type', 'crossval_method',
                'num_folds',
              ],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  const: 'Evaluation Corpus',
                },
                test_data_directory: {
                  type: 'string',
                },
              },
              required: [
                'type', 'test_data_directory',
              ],
              additionalProperties: false,
            },
          ],
        },
      },
      required: [
        'algo_type', 'eval_method',
      ],
      additionalProperties: false,
    },
    steps: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: [
    'fhir_directory',
    'structured_data',
    'unstructured_data',
    'algo',
    'steps',
  ],
  additionalProperties: false,
};

function validateSessionFile(data) {
  const validator = new Ajv();
  const valid = validator.validate(sessionSchema, data);
  if (!valid) {
    console.log(validator.errorsText());
    return false;
  }
  return true;
}

export default validateSessionFile;
