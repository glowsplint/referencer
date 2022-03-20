import re

text_type = {
    "title",
    "linebreak",
    "footnotetext",
    "header",
    "versenum",
    "footnotenum",
    "standardtext",
}

def text_parser(text, max_header_length=100, **kwargs):
    """
    function to parse text

    :param text: str() of text from esv api
    :param max_header_length: int() of max header length 
    :return: list() of dict()
        [
            {
                "type" : str(),
                "lidx" : int(),
                "text" : str(),
            },
        ]
    """

    # parse
    parsed_list = []  # init output list
    text_linebreak_l = text.split("\n")  # linebreaks

    # iterate by line
    for _line_idx in range(0, len(text_linebreak_l)):
        
        # str() at line
        _line = text_linebreak_l[_line_idx]

        # parse title
        if _line_idx == 0:

            parsed_list.append(
                {
                    "type" : "title",
                    "lidx" : _line_idx,
                    "text" : _line,
                }
            )

        # parse linebreak
        elif (len(_line.replace(" ", "")) == 0):

            parsed_list.append(
                {
                    "type" : "linebreak",
                    "lidx" : _line_idx,
                    "text" : _line
                }
            )

        # parse esv watermark (removed)
        elif _line == " (ESV)":
            pass

        # parse footnote
        elif (
            ("(" in _line[0])
            and (")" in _line[:4])
        ):

            parsed_list.append(
                {
                    "type" : "footnotetext",
                    "lidx" : _line_idx,
                    "text" : _line
                }
            )
        
        # parse header
        elif (
            (len(text_linebreak_l[_line_idx-1].replace(" ", "")) == 0)  # linebreak before
            and (len(text_linebreak_l[_line_idx+1].replace(" ", "")) == 0)  # linebreak after
            and (len(_line) < max_header_length)  # less than maximum header length
            and (re.search(r"[^[]*\[([^]]*)\]", _line) is None)  # does not have square brackets
        ):


            footnote_split_l = parse_intext_num(
                text=_line, 
                line_idx=_line_idx, 
                num_type="footnotenum",
                subtext_type="header",
                paranthesis_type="()",
            )

            parsed_list.extend(footnote_split_l)


        # parse body text

        # split verses
        else:

            verse_split_l = parse_intext_num(
                text=_line, 
                line_idx=_line_idx, 
                num_type="versenum",
                subtext_type="standardtext",
                paranthesis_type="[]",
            )

            # split footnote number
            for _verse_d in verse_split_l:
                
                # footnote number
                if _verse_d["type"] == "versenum":
                    
                    parsed_list.append(_verse_d)

                # subverses split by footnote number
                else:

                    footnote_split_l = parse_intext_num(
                        text=_verse_d["text"], 
                        line_idx=_line_idx, 
                        num_type="footnotenum",
                        subtext_type="standardtext",
                        paranthesis_type="()",
                    )
                
                    parsed_list.extend(footnote_split_l)


    return parsed_list

def parse_intext_num(
    text, 
    line_idx=0, 
    num_type="versenum",
    subtext_type="standardtext",
    paranthesis_type="[]",
    **kwargs,
    ):
    """
    function to parse footnote numbers

    :param text: str() of text
    :param line_idx: int() of line index number
    :param num_type: str() of number type name
    :param subtext_type: str() of subtext type name
    :param paranthesis_type: str() {"[]", "()"} of paranthesis
    """

    parsed_list = []  # init output list

    # "()"
    if paranthesis_type == "()":
        num_split_l = re.split(r"\(([0-9_]+)\)", text)
    # "[]"
    else:
        num_split_l = re.split(r"\[([0-9_]+)\]", text)

    for _subtext in num_split_l:

        # number
        if _subtext.isnumeric():

            parsed_list.append(
                {
                    "type" : num_type,
                    "lidx" : line_idx,
                    "text" : _subtext
                }
            )
        
        # subtext
        else: 

            parsed_list.append(
                {
                    "type" : subtext_type,
                    "lidx" : line_idx,
                    "text" : _subtext
                }
            )
    
    return parsed_list


