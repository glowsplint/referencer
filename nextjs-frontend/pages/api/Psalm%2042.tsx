// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({
    query: "Psalm 42",
    canonical: "Psalm 42",
    parsed: [[19042001, 19042011]],
    passage_meta: [
      {
        canonical: "Psalm 42",
        chapter_start: [19042001, 19042011],
        chapter_end: [19042001, 19042011],
        prev_verse: 19041013,
        next_verse: 19043001,
        prev_chapter: [19041001, 19041013],
        next_chapter: [19043001, 19043005],
      },
    ],
    passages: [
      "Psalm 42\n\nBook Two\n\nWhy Are You Cast Down, O My Soul?\n\nTo the choirmaster. A Maskil(1) of the Sons of Korah.\n\n    [1] As a deer pants for flowing streams,\n        so pants my soul for you, O God.\n    [2] My soul thirsts for God,\n        for the living God.\n    When shall I come and appear before God?(2)\n    [3] My tears have been my food\n        day and night,\n    while they say to me all the day long,\n        “Where is your God?”\n    [4] These things I remember,\n        as I pour out my soul:\n    how I would go with the throng\n        and lead them in procession to the house of God\n    with glad shouts and songs of praise,\n        a multitude keeping festival.\n    \n    \n    [5] Why are you cast down, O my soul,\n        and why are you in turmoil within me?\n    Hope in God; for I shall again praise him,\n        my salvation(3) [6] and my God.\n    \n    \n    My soul is cast down within me;\n        therefore I remember you\n    from the land of Jordan and of Hermon,\n        from Mount Mizar.\n    [7] Deep calls to deep\n        at the roar of your waterfalls;\n    all your breakers and your waves\n        have gone over me.\n    [8] By day the LORD commands his steadfast love,\n        and at night his song is with me,\n        a prayer to the God of my life.\n    [9] I say to God, my rock:\n        “Why have you forgotten me?\n    Why do I go mourning\n        because of the oppression of the enemy?”\n    [10] As with a deadly wound in my bones,\n        my adversaries taunt me,\n    while they say to me all the day long,\n        “Where is your God?”\n    \n    \n    [11] Why are you cast down, O my soul,\n        and why are you in turmoil within me?\n    Hope in God; for I shall again praise him,\n        my salvation and my God.\n    \n\nFootnotes\n\n(1) 42:1 Probably a musical or liturgical term\n\n(2) 42:2 Revocalization yields *and see the face of God*\n\n(3) 42:5 Hebrew *the salvation of my face*; also verse 11 and 43:5\n (ESV)",
    ],
  });
};
