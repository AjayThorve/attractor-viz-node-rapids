// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const {DataFrame, Series, Uint32, Int16, Int8, Float32} = require('@rapidsai/cudf');
const path                                              = require('path');

const trips = DataFrame.readCSV({
  header:0,
  sourceType: 'files',
  sources: [path.resolve('./public', 'data.csv')]
});

async function handler(req, res) {
  // console.log(trips.numRows);
  // console.log(trips.head(5));
  res.status(200).json({ name: 'John Doe' });
}

async function numRows(req, res) {
  res.send(trips.numRows);
}

export {handler, numRows}