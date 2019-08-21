from typing import List, Pattern

# for sorting by a call to a method
from operator import methodcaller
from collections import deque

import re


def get_colors(expressions: List[Pattern[str]]):
    """
    Get the list of colors available to a MultiRegexText markup.
    For now, we maintain a static list of colors,
    so colors should be mostly stable unless a lot of editing is occurring.

    Returns a dictionary of expression -> hex color string.

    colors list was generated as:

        #import seaborn as sns
        #sns.husl_palette(10).as_hex()

    husl palette gives us colors of the same intensity
    makes for easier reading

    """
    colors = ['#f77189', '#dc8932', '#ae9d31', '#77ab31', '#33b07a', '#36ada4', '#38a9c5', '#6e9bf4', '#cc7af4', '#f565cc']
    color_map = {}
    for idx, expr in enumerate(expressions):
        color_map[expr] = colors[idx % len(colors)]
    return color_map


def get_name_map(expressions: List[Pattern[str]], names: List[str]):
    name_map = {}
    for expr, name in zip(expressions, names):
        name_map[expr] = name
    return name_map


class MultiRegexText(object):
    def __init__(self, text: List[str], expressions: List[Pattern[str]], open_tag=":rgb:{0}:rgb::phrase:{1}:phrase::blob:", close_tag=":blob:", names=[]):
        self.matches = []
        self.expressions = expressions
        self.text = text
        self.open_tag = open_tag
        self.close_tag = close_tag
        self.color_map = get_colors(self.expressions)
        self.names = names
        self.name_map = get_name_map(self.expressions, self.names)

    def run(self) -> List[str]:
        new_text = []
        for block in self.text:
            updated = self.substitute(self.expressions, block)
            new_text.append(updated)
        return new_text

    def substitute(self, expressions: List[Pattern[str]], block: str) -> str:
        """ Substitute a series of possibly overlapping regex patterns
        into a string. 

        Basic algorithm (similar to the Merge Overlapping Intevals problem):

        1. For each pattern (expression), find all matches in block.
        2. Sort the matches two ways: once by start, once by end
        3. Create two stacks: start and end
        4. Walk through the start stack, keep track of an index cursor
           into block. If index is behind the current start element, output
           block from index to start.head. 
        5. When we move our start pointer, check to see if we have any
           end span points we need to output. Do roughly the same thing as in 4.
        6. When the start stack is empty, output all the closing tails by walking
           through end stack.

        Runtime: 
        Finding all expressions in text O(n), where n is length of text.
        m expressions, = O(mn) for matching expressions to text

        Suppose we result in r expressions, then we have two sorts of expressions.
        O(2 * r log r)

        Main loop: Guaranteed to remove one element from start stack every iteration, so
        at worst case O(r).

        Thus, if mn >> r (which it should be), we are bound by the running time of matching
        the expressions to text, or O(mn) is our dominate time.
        """

        matches = []
        new_block = ""
        ignored = []
        # first, find all the matches in this group

        for idx, expr in enumerate(expressions):
            if not expr:
                continue
            groups = list(re.finditer(expr, block))
            matches.extend(groups)

        # now, sort the list of matches by start function
        sorted_starts = sorted(matches, key=methodcaller('start'))
        sorted_ends = sorted(matches, key=methodcaller('end'))

        start_stack = deque(sorted_starts)
        end_stack = deque(sorted_ends)
        head = None
        tail = None
        index = 0

        """ Main merge block. Iterate through opening elements, ensuring our
        cursor is aware of position in both opening and closing element deques,
        and output opening/closing tags appropriately. Single pass merge."""
        while len(start_stack) > 0:
            head = start_stack.popleft()

            if not tail:
                tail = end_stack.popleft()

            # need to output any end tags before opening tags that occur at the
            # same position, to avoid improper HTML
            while head.start() >= tail.end():
                new_block += block[index:tail.end()]
                index = tail.end()
                # new_block += "</SPAN>"
                if tail not in ignored:
                    new_block += self.close_tag
                tail = end_stack.popleft()

            if index < head.start():
                new_block += block[index:head.start()]
                index = head.start()

            # new_block += "<SPAN>"
            if tail != head and tail.end() >= head.start():
                ignored.append(head)
                continue
            new_block += self.open_tag.format(self.color_map[head.re], self.name_map[head.re])

        # iterate over any remaining closing spans
        while len(end_stack) > 0:
            new_block += block[index:tail.end()]
            index = tail.end()
            # new_block += "</SPAN>"
            new_block += self.close_tag
            tail = end_stack.popleft()

        # use the very last tail
        if tail:
            new_block += block[index:tail.end()]
            index = tail.end()
            # new_block += "</SPAN>"
            new_block += self.close_tag

        new_block += block[index:]
        return new_block

class SectionRegexText(object):
    def __init__(self, text: List[str], break_expression: Pattern[str], expressions: List[Pattern[str]], expressions_used: List[bool], expression_names: List[str], open_tag=":rgb:{0}:rgb::phrase:{1}:phrase::blob:", close_tag=":blob:"):
        self.matches = []
        self.break_expression = break_expression
        self.expressions = expressions
        self.expressions_used = expressions_used
        self.expression_names = expression_names
        self.text = text
        self.open_tag = open_tag
        self.close_tag = close_tag
        self.color_map = get_colors(self.expressions)

    def run(self) -> List[str]:
        new_text = []
        for block in self.text:
            updated = self.substitute(block)
            new_text.append(updated)
        return new_text

    def substitute(self, block: str) -> str:
        """ Substitute a series of possibly overlapping regex patterns
        into a string.

        Basic algorithm (similar to the Merge Overlapping Intevals problem):

        1. For each pattern (expression), find all matches in block.
        2. Sort the matches two ways: once by start, once by end
        3. Create two stacks: start and end
        4. Walk through the start stack, keep track of an index cursor
           into block. If index is behind the current start element, output
           block from index to start.head. 
        5. When we move our start pointer, check to see if we have any
           end span points we need to output. Do roughly the same thing as in 4.
        6. When the start stack is empty, output all the closing tails by walking
           through end stack.

        Runtime:
        Finding all expressions in text O(n), where n is length of text.
        m expressions, = O(mn) for matching expressions to text

        Suppose we result in r expressions, then we have two sorts of expressions.
        O(2 * r log r)

        Main loop: Guaranteed to remove one element from start stack every iteration, so
        at worst case O(r).

        Thus, if mn >> r (which it should be), we are bound by the running time of matching
        the expressions to text, or O(mn) is our dominate time.
        """

        matches = []
        new_block = ""
        # first, find all the matches in this group

        # for idx, expr in enumerate(expressions):
        #    if not expr:
        #        continue
        #    groups = list(re.finditer(expr, block))
        #    matches.extend(groups)

        matches = list(re.finditer(self.break_expression, block))

        # now, sort the list of matches by start function
        sorted_starts = sorted(matches, key=methodcaller('start'))
        sorted_ends = sorted(matches, key=methodcaller('end'))

        start_stack = deque(sorted_starts)
        end_stack = deque(sorted_ends)
        head = None
        tail = None
        index = 0

        """ Main merge block. Iterate through opening elements, ensuring our
        cursor is aware of position in both opening and closing element deques,
        and output opening/closing tags appropriately. Single pass merge."""
        while len(start_stack) > 0:
            head = start_stack.popleft()

            if not tail:
                tail = end_stack.popleft()

            # need to output any end tags before opening tags that occur at the
            # same position, to avoid improper HTML
            while head.start() >= tail.end():
                block_to_add = block[index:tail.end()]
                new_block += block_to_add.replace('\n', '')
                index = tail.end()
                # new_block += "</SPAN>"
                new_block += self.close_tag + '\n\n'
                tail = end_stack.popleft()

            if index < head.start():
                new_block += block[index:head.start()]
                index = head.start()

            # new_block += "<SPAN>"

            # TODO: format this string properly, so that it uses the expressions to properly
            # format the tag.

            """
            1. If the expression matches and is used and is named, then we mark it up as blue.
            2. If the expr. matches, is used, but is not named, then we mark it up as default (orange)
            3. If the expression matches but is not used, then we mark it red.
            """
            color = "orange"
            sub_text = "block expression"
            for expr, used, name in zip(self.expressions, self.expressions_used, self.expression_names):
                # this is sent across from js improperly for now
                if used == "false":
                    used = False
                else:
                    used = True
                print("{0} - {1} - {2}".format(expr, used, name))
                text_block = block[head.start():head.end()]
                sub_match = re.search(expr, text_block)
                if sub_match:
                    if not used:
                        color = "red"
                    elif used and not name:
                        color = "orange"
                    elif used and name:
                        color = "blue"
                    else:  # don't think this can happen
                        color = "white"
                    sub_text = expr.pattern
            new_block += '\n\n' + self.open_tag.format(color, sub_text)

        # iterate over any remaining closing spans
        while len(end_stack) > 0:
            block_to_add = block[index:tail.end()]
            new_block += block_to_add.replace('\n', '')

            index = tail.end()
            # new_block += "</SPAN>"
            new_block += self.close_tag + '\n\n'
            tail = end_stack.popleft()

        # use the very last tail
        if tail:
            block_to_add = block[index:tail.end()]
            new_block += block_to_add.replace('\n', '')

            index = tail.end()
            # new_block += "</SPAN>"
            new_block += self.close_tag + '\n\n'

        new_block += block[index:]
        # new_block = new_block.replace("\n", "")
        return new_block


if __name__ == "__main__":
    # test
    text = ["quick brown fox jumped over the lazy dog"]
    expr = ['\\bquick\\b', 'quick brown']
    compiled = []
    for e in expr:
        compiled.append(re.compile(e))
    mrt = MultiRegexText(text, compiled)
    new_text = mrt.run()
    print("{0}".format(new_text))

    expr = ['\\bdog\\b', 'over the lazy']
    compiled = []
    for e in expr:
        compiled.append(re.compile(e))
    mrt = MultiRegexText(text, compiled)
    new_text = mrt.run()
    print("{0}".format(new_text))
