import pytest
import re
from ..regtext import MultiRegexText

""" You can run these tests by doing:

    conda install pytest

    Then (from python base directory):

    python -m pytest engine/test/
"""

def test_single_word_match():
    text = ["quick brown fox jumped over the lazy dog"]
    expr = '\\bquick\\b'
    open_tag = ":rgb:#f77189:rgb::phrase:\\bquick\\b:phrase::blob:"
    close_tag = ":blob:"
    compiled = [re.compile(expr)]
    mrt = MultiRegexText(text, compiled)
    new_text = mrt.run()
    assert len(new_text) == 1
    assert new_text[0] == "{0}quick{1} brown fox jumped over the lazy dog".format(open_tag, close_tag)

"""Next two tests use multiple overlapping matches, so I used <SPAN> elements instead of markdown
for readability when tests fail. """

def test_overlap_match():

    text = ["quick brown fox jumped over the lazy dog"]
    expr = ['\\bquick\\b', 'quick brown']
    compiled = []
    for e in expr:
        compiled.append(re.compile(e))
    mrt = MultiRegexText(text, compiled, open_tag="<SPAN>", close_tag="</SPAN>")
    new_text = mrt.run()

    assert len(new_text) == 1
    assert new_text[0] == "<SPAN><SPAN>quick</SPAN> brown</SPAN> fox jumped over the lazy dog"
    print("{0}".format(new_text))


def test_boundary_match():
    text = ["quick brown fox jumped over the lazy dog"]
    expr = ['lazy dog', '\\bdog\\b', 'over the lazy']
    compiled = []
    for e in expr:
        compiled.append(re.compile(e))
    mrt = MultiRegexText(text, compiled, open_tag="<SPAN>", close_tag="</SPAN>")
    new_text = mrt.run()
    assert len(new_text) == 1
    assert new_text[0] == "quick brown fox jumped <SPAN>over the <SPAN>lazy</SPAN> <SPAN>dog</SPAN></SPAN>"
    print("{0}".format(new_text))
