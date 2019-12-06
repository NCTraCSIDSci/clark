import Ajv from 'ajv';

const commonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
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
    required: ['name', 'regex'],
    additionalProperties: false,
  },
};

const sectionSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    section_break: {
      type: 'string',
    },
    ignore_header: {
      type: 'boolean',
    },
    ignore_unnamed_sections: {
      type: 'boolean',
    },
    named_sections: {
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
        required: ['name', 'regex', 'ignore'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'section_break',
    'ignore_header',
    'ignore_unnamed_sections',
    'named_sections',
  ],
  additionalProperties: false,
};

function validateRegExpFile(tab, data) {
  const validator = new Ajv();
  let valid = false;
  if (tab === 'sections') {
    valid = validator.validate(sectionSchema, data);
  } else {
    valid = validator.validate(commonSchema, data);
  }
  return valid;
}

export default validateRegExpFile;
