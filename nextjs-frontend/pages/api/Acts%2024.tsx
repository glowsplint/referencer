// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({
    query: "Acts 24",
    canonical: "Acts 24",
    parsed: [[44024001, 44024027]],
    passage_meta: [
      {
        canonical: "Acts 24",
        chapter_start: [44024001, 44024027],
        chapter_end: [44024001, 44024027],
        prev_verse: 44023035,
        next_verse: 44025001,
        prev_chapter: [44023001, 44023035],
        next_chapter: [44025001, 44025027],
      },
    ],
    passages: [
      "Acts 24\n\nPaul Before Felix at Caesarea\n\n  [1] And after five days the high priest Ananias came down with some elders and a spokesman, one Tertullus. They laid before the governor their case against Paul. [2] And when he had been summoned, Tertullus began to accuse him, saying:\n\n  “Since through you we enjoy much peace, and since by your foresight, most excellent Felix, reforms are being made for this nation, [3] in every way and everywhere we accept this with all gratitude. [4] But, to detain(1) you no further, I beg you in your kindness to hear us briefly. [5] For we have found this man a plague, one who stirs up riots among all the Jews throughout the world and is a ringleader of the sect of the Nazarenes. [6] He even tried to profane the temple, but we seized him.(2) [8] By examining him yourself you will be able to find out from him about everything of which we accuse him.”\n\n  [9] The Jews also joined in the charge, affirming that all these things were so.\n\n  [10] And when the governor had nodded to him to speak, Paul replied:\n\n  “Knowing that for many years you have been a judge over this nation, I cheerfully make my defense. [11] You can verify that it is not more than twelve days since I went up to worship in Jerusalem, [12] and they did not find me disputing with anyone or stirring up a crowd, either in the temple or in the synagogues or in the city. [13] Neither can they prove to you what they now bring up against me. [14] But this I confess to you, that according to the Way, which they call a sect, I worship the God of our fathers, believing everything laid down by the Law and written in the Prophets, [15] having a hope in God, which these men themselves accept, that there will be a resurrection of both the just and the unjust. [16] So I always take pains to have a clear conscience toward both God and man. [17] Now after several years I came to bring alms to my nation and to present offerings. [18] While I was doing this, they found me purified in the temple, without any crowd or tumult. But some Jews from Asia—[19] they ought to be here before you and to make an accusation, should they have anything against me. [20] Or else let these men themselves say what wrongdoing they found when I stood before the council, [21] other than this one thing that I cried out while standing among them: ‘It is with respect to the resurrection of the dead that I am on trial before you this day.’”\n\nPaul Kept in Custody\n\n  [22] But Felix, having a rather accurate knowledge of the Way, put them off, saying, “When Lysias the tribune comes down, I will decide your case.” [23] Then he gave orders to the centurion that he should be kept in custody but have some liberty, and that none of his friends should be prevented from attending to his needs.\n\n  [24] After some days Felix came with his wife Drusilla, who was Jewish, and he sent for Paul and heard him speak about faith in Christ Jesus. [25] And as he reasoned about righteousness and self-control and the coming judgment, Felix was alarmed and said, “Go away for the present. When I get an opportunity I will summon you.” [26] At the same time he hoped that money would be given him by Paul. So he sent for him often and conversed with him. [27] When two years had elapsed, Felix was succeeded by Porcius Festus. And desiring to do the Jews a favor, Felix left Paul in prison.\n\nFootnotes\n\n(1) 24:4 Or *weary*\n\n(2) 24:6 Some manuscripts add *and we would have judged him according to our law. [7] But the chief captain Lysias came and with great violence took him out of our hands, [8] commanding his accusers to come before you*.\n (ESV)",
    ],
  });
};
