// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const {DataFrame, Series, Float32, Uint32} = require('@rapidsai/cudf');
const {sendDF, mapValuesToColorSeries} = require('../../../../components/server/utils');
const lorenz = require("lorenz-attractor-3d");


export default function handler(req, res) {
    const n = parseInt(req.query.n);
    const categories = parseInt(req.query.categories) || 6;
    const color_col = Series.sequence({type: new Float32, size: n, init: 0, step: categories/n}).cast(new Uint32);

    const colors = mapValuesToColorSeries(
            color_col,
            [...color_col.valueCounts()['value']],
            ["#440154","#414487","#2a788e","#22a884","#7ad151","#fde725"]
        )
    sendDF(
        new DataFrame({colors: colors.interleaveColumns()}),
        res
    );
}