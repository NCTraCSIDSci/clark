// Process ^-^ColorCode^-^!!Text!!

/*
   Code that integrates with the markdown-it markup module to
   transform markdown color blocks into html.

   This function scans through text blocks and finds all phrases matching the following.

   :rgb:color:rgb::blob:text to highlight:blob:

   It splits the text blocks into individual tokens. So a block coming in might be:

   Token(text, content="asdf")

   And split into:

   Token(text, content="a")
   Token(color_open, color="black")
   Token(color_text, content="sd")
   Token(color_close)
   Token(text, content="f")

   In other words, it breaks the original Token into smaller tokens usable by markdown-it.

   @author: bwalenz, blame for all problems
   */
module.exports.highlight = function highlight(state) {
  var attrs,
      code,
      label,
      labelEnd,
      labelStart,
      pos,
      res,
      ref,
      title,
      token,
      href = '',
      level,
      oldPos = state.pos,
      max = state.posMax,
      start = state.pos;

  var blockTokens = state.tokens;
  var highlighted;
  var tokens, currentToken, text, matches;
  var j, i, l, nodes, m;

  var Token = state.Token;

  var regex, color, splitStr;
  var match = ':rgb:(.+?):rgb::phrase:(.+?):phrase::blob:(.+?):blob:';
  regex = new RegExp(match, 'g');

  /* markdown-it produces a list of tokens that break the text up, telling
     the renderer how to render markdown tags.

     Our process comes after other tags have been generated, so we walk through the
     tokens and find anything labeled as a text token (everything else is a markdown formatted token already).
    */
  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline') {
      continue;
    }

    tokens = blockTokens[j].children;

    for (i = tokens.length - 1; i >= 0; i--) {
        currentToken = tokens[i];

        if (currentToken.type !== 'text') {
          continue;
        }

        /* We know we have a text tag now, so match our regex to find all occurrences. */
        text = currentToken.content;
        matches = text.match(regex);
        if (matches === null) { continue; }
        nodes = [];
        level = currentToken.level;

        for (m = 0; m < matches.length; m++) {
          color = matches[m].split(':rgb:')[1];
          phrase = matches[m].split(':phrase:')[1];
          splitStr = matches[m].split(':blob:');
          highlighted = splitStr[1];
          // find the beginning of the matched text
          pos = text.indexOf(matches[m]);

          if (pos > 0) {
            token         = new Token('text', '', 0);
            token.content = text.slice(0, pos);
            token.level   = level;
            nodes.push(token);
          }

          token         = new Token('color_open', '', 1);
          token.content = color;
          token.level   = level++;
          token.attrSet("phrase", phrase);
          nodes.push(token);

          token         = new Token('text', '', 0);
          token.content = highlighted;
          token.level   = level;
          nodes.push(token);

          token         = new Token('color_close', '', -1);
          token.level   = --level;
          nodes.push(token);

          //advance the position past our markup block. splitStr[0] is :rgb:color:rgb:, 12 is :blob:*2
          text = text.slice(pos + splitStr[0].length + highlighted.length + 12);
        }

        /* We might still have some remaining text, push the rest into a new text Token. */
        if (text.length > 0) {
          token         = new Token('text', '', 0);
          token.content = text;
          token.level   = level;
          nodes.push(token);
        }

        // replace current node with our broken apart nodes.
        blockTokens[j].children = tokens = state.md.utils.arrayReplaceAt(tokens, i, nodes);
      }
    }
  }
