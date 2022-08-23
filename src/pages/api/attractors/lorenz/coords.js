// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const {DataFrame, Series, Float32, Uint32} = require('@rapidsai/cudf');
const {sendDF} = require('../../../../components/server/utils');
const lorenz = require("lorenz-attractor-3d");


export default function handler(req, res) {
    const sigma = req.query.sigma;
    const beta = req.query.beta;
    const rho = req.query.rho;
    const n = req.query.n;
    const stepSize = req.query.stepSize;
    lorenz.init(sigma,beta,rho,Float32Array, n, 1, 1, 1, stepSize); // Init with default values, or
    lorenz.next(n) // Generate next 999 values
    const points = lorenz.points(); // Return array of points [x1, y1, z1, x2, y2, z2, ...]
    const df = new DataFrame({
        'pos': points
    });
    sendDF(df, res);
}
  