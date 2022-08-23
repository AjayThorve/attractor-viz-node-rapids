const {DataFrame, Float32} = require('@rapidsai/cudf');
const { RecordBatchStreamWriter } = require('apache-arrow');
const pipeline = require('util').promisify(require('stream').pipeline);

async function sendDF(df, res){
    await pipeline(
        RecordBatchStreamWriter.writeAll(df.toArrow()).toNodeStream(),
        res.writeHead(200, 'Ok', { 'Content-Type': 'application/octet-stream' })
    );
}

async function sendCoordinates(df, numRows, page, res){
    const columns = ['x', 'y'];
    const result = new DataFrame({positions: df.select(columns).castAll(new Float32).head(numRows*page).interleaveColumns()});
    await sendDF(result, res);
}

export {sendDF, sendCoordinates};