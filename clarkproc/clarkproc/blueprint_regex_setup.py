from flask import Blueprint, jsonify, request

from . import engine
from . import state

bp_regex_setup = Blueprint('regex_setup', __name__)

@bp_regex_setup.route('/features/load', methods=['POST'])
def load_feature_expressions():
    """
    Load a set of feature expressions into application state and return them
    ---
    tags: ["Features"]
    requestBody:
        description: "Path to the file to load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/feature/expressions"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Features loaded and returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "Could not open features file"
            content:
                text/plain:
                    schema:
                        type: string
    """

    expr_file = request.json.get('path')

    try:
        state.proc.load_feature_expressions(expr_file)
        return jsonify(state.proc.feature_extractor.get_feature_expressions())
    except:
        return 'Could not open features file.', 428

@bp_regex_setup.route('/keywords/load', methods=['POST'])
def load_keyword_expressions():
    """
    Load a set of keyword expressions into application state and return them
    ---
    tags: ["Keywords"]
    requestBody:
        description: "Path to the file to load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/keyword/expressions"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Keywords loaded and returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "Could not open features file"
            content:
                text/plain:
                    schema:
                        type: string
    """

    keyw_file = request.json.get('path')

    try:
        state.proc.load_feature_keywords(keyw_file)
        return jsonify({"keywords": state.proc.feature_extractor.get_keyword_expressions(), "expressions": state.proc.feature_extractor.get_feature_expressions()})
    except:
        return 'Could not open keyword file.', 428

@bp_regex_setup.route('/features/save', methods=['POST'])
def save_feature_expressions():
    """
    Save a set of feature expressions
    ---
    tags: ["Features"]
    requestBody:
        description: "Path to the file to save"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "new/file/path/to/the/feature/expressions"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Features saved"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            saved:
                                description: "inidication that the file was saved"
                                type: boolean
        428:
            description: "Could not save the new file"
            content:
                text/plain:
                    schema:
                        type: string
    """

    new_expr_file = request.json.get('path')

    try:
        state.proc.feature_extractor.save_expressions(new_expr_file)
        return jsonify({"saved":True})
    except:
        return'Could not save features file.', 428

@bp_regex_setup.route('/keywords/save', methods=['POST'])
def save_keyword_expressions():
    """
    Save a set of keyword expressions
    ---
    tags: ["Keywords"]
    requestBody:
        description: "Path to the file to save"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "new/file/path/to/the/keyword/expressions"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Keywords saved"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            saved:
                                description: "inidication that the file was saved"
                                type: boolean
        428:
            description: "Could not save the new file"
            content:
                text/plain:
                    schema:
                        type: string
    """

    new_keyw_file = request.json.get('path')

    try:
        state.proc.feature_extractor.save_keywords(new_keyw_file)
        return jsonify({"saved":True})
    except:
        return 'Could not save keyword file.', 428

@bp_regex_setup.route('/features/edit', methods=['POST'])
def update_feature_expression():
    """
    Update a feature expression in application state
    ---
    tags: ["Features"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the regular expression to be updated"
        required: true
      - in: query
        name: name
        schema:
            type: string
        description: "updated name"
        required: true
      - in: query
        name: regex
        schema:
            type: string
        description: "updated regular expression"
        required: true
    responses:
        200:
            description: "Feature successfully edited"
            content:
                application/json:
                    schema:
                        description: "Updated feature expressions"
                        type: object
        500:
            description: "Failed to modify feature value"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.json.get("index"))
        name = request.json.get("name")
        regex = request.json.get("regex")

        state.proc.feature_extractor.edit_expression(index, name, regex)
        return jsonify(state.proc.feature_extractor.get_feature_expressions())

    except:
        return 'Could not edit expression', 500

@bp_regex_setup.route('/keywords/edit', methods=['POST'])
def update_keyword_expression():
    """
    Update a keyword expression in application state
    ---
    tags: ["Keywords"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the regular expression to be updated"
        required: true
      - in: query
        name: name
        schema:
            type: string
        description: "updated name"
        required: true
      - in: query
        name: regex
        schema:
            type: string
        description: "updated regular expression"
        required: true
    responses:
        200:
            description: "Keyword successfully edited"
            content:
                application/json:
                    schema:
                        description: "Updated keywords and feature expressions"
                        type: object
        500:
            description: "Failed to modify feature value"
            content:
                text/plain:
                    schema:
                        type: string
    """
    try:
        index = int(request.json.get("index"))
        name = request.json.get("name")
        regex = request.json.get("regex")

        state.proc.feature_extractor.edit_keyword(index, name, regex)
        return jsonify({"keywords": state.proc.feature_extractor.get_keyword_expressions(), "expressions": state.proc.feature_extractor.get_feature_expressions()})

    except:
        return 'Could not edit keyword.', 500

@bp_regex_setup.route('/features/new')
def new_feature_expression():
    """
    Insert a new, empty, feature expression into application state
    ---
    tags: ["Features"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of where to insert the new blank entry"
        required: true
    responses:
        200:
            description: "New (empty) feature successfully added"
            content:
                application/json:
                    schema:
                        description: "Updated feature expressions"
                        type: object
        500:
            description: "Failed to insert new feature"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))

        state.proc.feature_extractor.new_expression(index)
        return jsonify(state.proc.feature_extractor.get_feature_expressions())

    except:
        return 'Could not edit expressions.', 500

@bp_regex_setup.route('/keywords/new')
def new_keyword_expression():
    """
    Insert a new, empty, keyword expression into application state
    ---
    tags: ["Keywords"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of where to insert the new blank entry"
        required: true
    responses:
        200:
            description: "New (empty) keyword successfully added"
            content:
                application/json:
                    schema:
                        description: "Updated keywords"
                        type: object
        500:
            description: "Failed to insert new keyword"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))

        state.proc.feature_extractor.new_keyword(index)
        return jsonify(state.proc.feature_extractor.get_keyword_expressions())

    except:
        return 'Could not edit keyword file.', 500

@bp_regex_setup.route('/features/move')
def move_feature_expression():
    """
    Move a feature expression within the list in application state
    ---
    tags: ["Features"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the entry to move"
        required: true
      - in: query
        name: newIndex
        schema:
            type: integer
        description: "new index of where to move the entry"
        required: true
    responses:
        200:
            description: "Feature successfully moved within list"
            content:
                application/json:
                    schema:
                        description: "Updated features"
                        type: object
        500:
            description: "Failed to move feature expression"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))
        new_index = int(request.args.get('newIndex'))

        state.proc.feature_extractor.move_expression(index, new_index)
        return jsonify(state.proc.feature_extractor.get_feature_expressions())

    except:
        return 'Could not edit expressions.', 500

@bp_regex_setup.route('/keywords/move')
def move_keyword_expression():
    """
    Move a keyword expression within the list in application state
    ---
    tags: ["Keywords"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the entry to move"
        required: true
      - in: query
        name: newIndex
        schema:
            type: integer
        description: "new index of where to move the entry"
        required: true
    responses:
        200:
            description: "Keyword successfully moved"
            content:
                application/json:
                    schema:
                        description: "Updated keywords"
                        type: object
        500:
            description: "Failed to move keyword"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))
        new_index = int(request.args.get('newIndex'))

        state.proc.feature_extractor.move_keyword(index, new_index)
        return jsonify(state.proc.feature_extractor.get_keyword_expressions())

    except:
        return 'Could not edit keyword file.', 500

@bp_regex_setup.route('/features/remove')
def remove_feature_expression():
    """
    Remove a feature expression from the list in application state
    ---
    tags: ["Features"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the entry to remove"
        required: true
    responses:
        200:
            description: "Feature expression successfully removed"
            content:
                application/json:
                    schema:
                        description: "Updated feature expressions"
                        type: object
        500:
            description: "Failed to remove feature expression"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))

        state.proc.feature_extractor.remove_expression(index)
        return jsonify(state.proc.feature_extractor.get_feature_expressions())

    except:
        return 'Could not edit expressions file.', 500

@bp_regex_setup.route('/keywords/remove')
def remove_keyword_expression():
    """
    Remove a feature expression from the list in application state
    ---
    tags: ["Keywords"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the entry to remove"
        required: true
    responses:
        200:
            description: "Keyword successfully removed"
            content:
                application/json:
                    schema:
                        description: "Updated keywords"
                        type: object
        500:
            description: "Failed to remove keyword"
            content:
                text/plain:
                    schema:
                        type: string
    """
    try:
        index = int(request.args.get('index'))

        state.proc.feature_extractor.remove_keyword(index)
        return jsonify({"keywords": state.proc.feature_extractor.get_keyword_expressions(), "expressions": state.proc.feature_extractor.get_feature_expressions()})

    except:
        return 'Could not edit keyword file.', 500

@bp_regex_setup.route('/features/colors')
def get_features_color_map():
    """
    Returns a list of colors assigned to feature expressions
    ---
    tags: ["Features"]
    responses:
        200:
            description: "Color map definitions sucessfully returned"
            content:
                application/json:
                    schema:
                        description: "Color map"
                        type: object
                        properties:
                            color_map:
                                description: "dictionary of feature names and colors"
                                schema:
                                    type: object
    """

    colors = engine.regtext.get_colors(state.proc.feature_extractor.expressions)
    colors_json = {}
    for c in colors:
        colors_json[c.pattern] = colors[c]
    return jsonify({"color_map":colors_json})

@bp_regex_setup.route('/sections/get')
def get_sections():
    """
    Returns the current definition of section splitting definitions
    ---
    tags: ["Sections"]
    responses:
        200:
            description: "Section splitting definitions"
            content:
                application/json:
                    schema:
                        type: object
    """

    sectionBreakData = state.proc.section_splitter.get_expression()
    sectionNameData = state.proc.feature_combiner.get_all_expressions_as_dict_with_valid()

    return jsonify({"sectionBreakData": sectionBreakData, "sectionNameData": sectionNameData})

@bp_regex_setup.route('/sections/save', methods=['POST'])
def save_sections():
    """
    Save the current set of section definitions
    ---
    tags: ["Sections"]
    requestBody:
        description: "Path to the file to save"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "new/file/path/to/the/section/definitions"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Section definitions saved"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            saved:
                                description: "inidication that the file was saved"
                                type: boolean
        428:
            description: "Could not save the new file"
            content:
                text/plain:
                    schema:
                        type: string
    """
    try:
        new_file = request.json.get('path')

        state.proc.save_sectioning_file(new_file)
        return jsonify({"saved":True})
    except:
        return 'Could not save sections file.', 428

@bp_regex_setup.route('/sections/load', methods=['POST'])
def load_sections():
    """
    Load a set of section definitions into application state and return them
    ---
    tags: ["Sections"]
    requestBody:
        description: "Path to the file to load"
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        path:
                            description: "file/path/to/the/section/definitions"
                            type: string
                    required: ["path"]
    responses:
        200:
            description: "Section definitions loaded and returned"
            content:
                application/json:
                    schema:
                        type: object
        428:
            description: "Could not open file"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        sections_file = request.json.get('path')

        output = state.proc.load_sectioning_file(sections_file)
        if not output[0]:
            return 'Could not open sections file.', 428

        sectionBreakData = state.proc.section_splitter.get_expression()
        sectionNameData = state.proc.feature_combiner.get_all_expressions_as_dict_with_valid()

        return jsonify({"sectionBreakData": sectionBreakData, "sectionNameData": sectionNameData})
    except:
        return 'Could not open sections file.', 428

@bp_regex_setup.route('/sections/break/edit', methods=['POST'])
def set_sections_break():
    """
    Update the section break regular expression in application state
    ---
    tags: ["Sections"]
    parameters:
      - in: query
        name: regex
        schema:
            type: string
        description: "updated regular expression"
        required: true
    responses:
        200:
            description: "Section break regular expression successfully edited"
            content:
                application/json:
                    schema:
                        description: "Updated regular expression"
                        type: object
        500:
            description: "Failed to modify section break regular expression"
            content:
                text/plain:
                    schema:
                        type: string
    """

    new_regex = request.json.get("regex")
    
    results = state.proc.section_splitter.set_expression(new_regex)

    return jsonify({"success": results[0], "regex": results[1]})

@bp_regex_setup.route('/sections/names/edit', methods=['POST'])
def update_section_name():
    """
    Update a section definition in application state
    ---
    tags: ["Sections"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the section regular expression to be updated"
        required: true
      - in: query
        name: name
        schema:
            type: string
        description: "updated name"
        required: true
      - in: query
        name: regex
        schema:
            type: string
        description: "updated regular expression"
        required: true
      - in: query
        name: use
        schema:
            type: boolean
        description: "updated value for section use"
        required: true
    responses:
        200:
            description: "Section successfully edited"
            content:
                application/json:
                    schema:
                        description: "Updated section data"
                        type: object
        500:
            description: "Failed to modify section value"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.json.get("index"))
        new_name = request.json.get("name")
        new_regex = request.json.get("regex")
        use_regex = request.json.get("use")

        state.proc.feature_combiner.edit_expression(index, new_name, new_regex, use_regex)

        sectionNameData = state.proc.feature_combiner.get_all_expressions_as_dict_with_valid()
        return jsonify({"sectionNameData": sectionNameData})

    except:
        return 'Could not edit sections.', 500

@bp_regex_setup.route('/sections/names/new')
def new_section_name():
    """
    Add a new, empty, section definition in application state
    ---
    tags: ["Sections"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the new blank section regular expression"
        required: true
    responses:
        200:
            description: "New section definition successfully added"
            content:
                application/json:
                    schema:
                        description: "Updated section data"
                        type: object
        500:
            description: "Failed to modify section"
            content:
                text/plain:
                    schema:
                        type: string
    """
    try:
        index = int(request.args.get('index'))

        state.proc.feature_combiner.new_expression(index)
        sectionNameData = state.proc.feature_combiner.get_all_expressions_as_dict_with_valid()

        return jsonify({"sectionNameData": sectionNameData})

    except:
        return 'Could not edit sections.', 500

@bp_regex_setup.route('/sections/names/move')
def move_section_name():
    """
    Move a section name within the list in application state
    ---
    tags: ["Sections"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the entry to move"
        required: true
      - in: query
        name: newIndex
        schema:
            type: integer
        description: "new index of where to move the entry"
        required: true
    responses:
        200:
            description: "Section expression successfully moved within list"
            content:
                application/json:
                    schema:
                        description: "Updated section data"
                        type: object
        500:
            description: "Failed to move section expression"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))
        new_index = int(request.args.get('newIndex'))

        state.proc.feature_combiner.move_expression(index, new_index)
        sectionNameData = state.proc.feature_combiner.get_all_expressions_as_dict_with_valid()

        return jsonify({"sectionNameData": sectionNameData})

    except:
        return 'Could not edit keyword file.', 500

@bp_regex_setup.route('/sections/names/remove')
def remove_section_name():
    """
    Remove a section expression from the list in application state
    ---
    tags: ["Sections"]
    parameters:
      - in: query
        name: index
        schema:
            type: integer
        description: "index of the entry to remove"
        required: true
    responses:
        200:
            description: "Section expression successfully removed"
            content:
                application/json:
                    schema:
                        description: "Updated section expressions"
                        type: object
        500:
            description: "Failed to remove section expression"
            content:
                text/plain:
                    schema:
                        type: string
    """

    try:
        index = int(request.args.get('index'))

        state.proc.feature_combiner.remove_expression(index)
        sectionNameData = proc.feature_combiner.get_all_expressions_as_dict_with_valid()

        return jsonify({"sectionNameData": sectionNameData})

    except:
        return 'Could not edit sections.', 500
