// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from "next";

const fs = require("fs");

const response = (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req.query;
  const filePath = `../data/${encodeURIComponent(query as string)}.json`;
  const data = fs.readFileSync(filePath);
  res.status(200).json(data);
};

export default response;
