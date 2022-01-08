// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({
    query: "Genesis 1:2–13",
    canonical: "Genesis 1:2–13",
    parsed: [[1001002, 1001013]],
    passage_meta: [
      {
        canonical: "Genesis 1:2–13",
        chapter_start: [1001001, 1001031],
        chapter_end: [1001001, 1001031],
        prev_verse: 1001001,
        next_verse: 1001014,
        prev_chapter: null,
        next_chapter: [1002001, 1002025],
      },
    ],
    passages: [
      "Genesis 1:2–13\n\n  [2] The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.\n\n  [3] And God said, “Let there be light,” and there was light. [4] And God saw that the light was good. And God separated the light from the darkness. [5] God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day.\n\n  [6] And God said, “Let there be an expanse(1) in the midst of the waters, and let it separate the waters from the waters.” [7] And God made(2) the expanse and separated the waters that were under the expanse from the waters that were above the expanse. And it was so. [8] And God called the expanse Heaven.(3) And there was evening and there was morning, the second day.\n\n  [9] And God said, “Let the waters under the heavens be gathered together into one place, and let the dry land appear.” And it was so. [10] God called the dry land Earth,(4) and the waters that were gathered together he called Seas. And God saw that it was good.\n\n  [11] And God said, “Let the earth sprout vegetation, plants(5) yielding seed, and fruit trees bearing fruit in which is their seed, each according to its kind, on the earth.” And it was so. [12] The earth brought forth vegetation, plants yielding seed according to their own kinds, and trees bearing fruit in which is their seed, each according to its kind. And God saw that it was good. [13] And there was evening and there was morning, the third day.\n\nFootnotes\n\n(1) 1:6 Or *a canopy*; also verses 7, 8, 14, 15, 17, 20\n\n(2) 1:7 Or *fashioned*; also verse 16\n\n(3) 1:8 Or *Sky*; also verses 9, 14, 15, 17, 20, 26, 28, 30; 2:1\n\n(4) 1:10 Or *Land*; also verses 11, 12, 22, 24, 25, 26, 28, 30; 2:1\n\n(5) 1:11 Or *small plants*; also verses 12, 29\n (ESV)",
    ],
  });
};
