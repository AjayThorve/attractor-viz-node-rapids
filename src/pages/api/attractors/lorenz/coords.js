// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const {DataFrame, Series, Float32, Uint32} = require('@rapidsai/cudf');
const {sendDF} = require('../../../../components/server/utils');
const lorenz = require("lorenz-attractor-3d");


export default function handler(req, res) {
    const a = req.query.a;
    const b = req.query.b;
    const c = req.query.c;
    const n = parseInt(req.query.n);
    lorenz.init(a, b, c, Float32Array, n, 1, 1, 1, 0.004); // Init with default values, or
    lorenz.next(n) // Generate next 999 values
    const points = lorenz.points(); // Return array of points [x1, y1, z1, x2, y2, z2, ...]
    const df = new DataFrame({
        'pos': points
    });
    sendDF(df, res);
}
  