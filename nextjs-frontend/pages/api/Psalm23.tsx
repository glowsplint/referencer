// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default (req, res) => {
  res.status(200).json({
    "query": "Psalm 23",
    "canonical": "Psalm 23",
    "parsed": [
        [
            19023001,
            19023006
        ]
    ],
    "passage_meta": [
        {
            "canonical": "Psalm 23",
            "chapter_start": [
                19023001,
                19023006
            ],
            "chapter_end": [
                19023001,
                19023006
            ],
            "prev_verse": 19022031,
            "next_verse": 19024001,
            "prev_chapter": [
                19022001,
                19022031
            ],
            "next_chapter": [
                19024001,
                19024010
            ]
        }
    ],
    "passages": [
        "Psalm 23\n\nThe LORD Is My Shepherd\n\nA Psalm of David.\n\n    [1] The LORD is my shepherd; I shall not want.\n    [2]     He makes me lie down in green pastures.\n    He leads me beside still waters.(1)\n    [3]     He restores my soul.\n    He leads me in paths of righteousness(2)\n        for his name’s sake.\n    \n    \n    [4] Even though I walk through the valley of the shadow of death,(3)\n        I will fear no evil,\n    for you are with me;\n        your rod and your staff,\n        they comfort me.\n    \n    \n    [5] You prepare a table before me\n        in the presence of my enemies;\n    you anoint my head with oil;\n        my cup overflows.\n    [6] Surely(4) goodness and mercy(5) shall follow me\n        all the days of my life,\n    and I shall dwell(6) in the house of the LORD\n        forever.(7)\n    \n\nFootnotes\n\n(1) 23:2 Hebrew *beside waters of rest*\n\n(2) 23:3 Or *in right paths*\n\n(3) 23:4 Or *the valley of deep darkness*\n\n(4) 23:6 Or *Only*\n\n(5) 23:6 Or *steadfast love*\n\n(6) 23:6 Or *shall return to dwell*\n\n(7) 23:6 Hebrew *for length of days*\n (ESV)"
    ]
});
};
