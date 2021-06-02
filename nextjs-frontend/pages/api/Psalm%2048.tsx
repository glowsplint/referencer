// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default (req, res) => {
  res.status(200).json({
    query: "Psalm 48",
    canonical: "Psalm 48",
    parsed: [[19048001, 19048014]],
    passage_meta: [
      {
        canonical: "Psalm 48",
        chapter_start: [19048001, 19048014],
        chapter_end: [19048001, 19048014],
        prev_verse: 19047009,
        next_verse: 19049001,
        prev_chapter: [19047001, 19047009],
        next_chapter: [19049001, 19049020],
      },
    ],
    passages: [
      "Psalm 48\n\nZion, the City of Our God\n\nA Song. A Psalm of the Sons of Korah.\n\n    [1] Great is the LORD and greatly to be praised\n        in the city of our God!\n    His holy mountain, [2] beautiful in elevation,\n        is the joy of all the earth,\n    Mount Zion, in the far north,\n        the city of the great King.\n    [3] Within her citadels God\n        has made himself known as a fortress.\n    \n    \n    [4] For behold, the kings assembled;\n        they came on together.\n    [5] As soon as they saw it, they were astounded;\n        they were in panic; they took to flight.\n    [6] Trembling took hold of them there,\n        anguish as of a woman in labor.\n    [7] By the east wind you shattered\n        the ships of Tarshish.\n    [8] As we have heard, so have we seen\n        in the city of the LORD of hosts,\n    in the city of our God,\n        which God will establish forever. Selah\n    \n    \n    [9] We have thought on your steadfast love, O God,\n        in the midst of your temple.\n    [10] As your name, O God,\n        so your praise reaches to the ends of the earth.\n    Your right hand is filled with righteousness.\n    [11]     Let Mount Zion be glad!\n    Let the daughters of Judah rejoice\n        because of your judgments!\n    \n    \n    [12] Walk about Zion, go around her,\n        number her towers,\n    [13] consider well her ramparts,\n        go through her citadels,\n    that you may tell the next generation\n    [14]     that this is God,\n    our God forever and ever.\n        He will guide us forever.(1)\n    \n\nFootnotes\n\n(1) 48:14 Septuagint; another reading is (compare Jerome, Syriac) *He will guide us beyond death*\n (ESV)",
    ],
  });
};
