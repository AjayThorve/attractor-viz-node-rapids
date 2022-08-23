import React from 'react';
import DeckGL from '@deck.gl/react';
import {PointCloudLayer, PolygonLayer} from '@deck.gl/layers';
import {tableFromIPC} from 'apache-arrow';
import {OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import ControlPanel from '../components/utils/controlPanel';
import { VictoryChart, VictoryAxis, VictoryBar } from 'victory';
import * as d3 from "d3";

const view = new OrbitView({fov: 50});

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 0,
  rotationOrbit: 0,
  minZoom: 0,
  maxZoom: 10,
  zoom: 5
};

async function requestData(chunkSize=1000, type='lorenz', params=null){
  let url = `/api/attractors/${type}?numRows=${chunkSize}`;
  if(params!=null){
    url += `&${params}`;
  }
  const result = await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}});
  const table = tableFromIPC(result);
  return table;
}

async function requestStats(type='numRows', params=null){
  let url = `/api/dataframe/${type}?`;
  if(params!=null){
    url += `&${params}`;
  }
  return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json());
}
const dataChunks = [];

export default class CustomScatter extends React.Component {

  constructor(props){
    super(props);
    this._updateSettings = this._updateSettings.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.deckRef = React.createRef();
    this.clearSelections = this.clearSelections.bind(this);

    this.state = {
      maleColor: MALE_COLOR,
      femaleColor: FEMALE_COLOR,
      mapStyle: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
      data: [],
      layers: [],
      radiusScale: 10,
      dataSize: 0,
      settings:{
        radius: 250,
        boxSelection: false
      },
      boxSelect: {
        rectdata: [{polygon: [], show: true}]
      },
      stats: {
        qcScore:0,
        geneCounts: 0,
        sex: []
      }
    }
  }

  async resetData(){
    let numRows = 10000;
    this.setState({
      dataSize: numRows
    });
    
    const data = await requestData(numRows, 'lorenz');

    this.setState({
      data:{
        positions: data.data[0].children[0].values,
      },
      numRows: numRows,
    });
  }

  async componentDidMount(){
    window.deckRef = this.deckRef;
    this.resetData();
  }

  async clearSelections(){
    this.setState({
      boxSelect: {
        rectdata: [{polygon: [], show: true}]
      }
    });
    await this.resetData();
  }

  _renderLayers() {
    let layers = [];

    if(this.state.data['positions']){
      layers.push(
        new PointCloudLayer({
          id: "scatter-plot-layer1",
          data: {
            length: this.state.data['positions'] ? (this.state.data['positions'].length)/3 : 1,
            attributes: {
              getPosition: {value: this.state.data['positions'], size:3},
            }
          },
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
          getNormal: [0, 1, 0],
          getColor: [255, 255, 255],
          opacity: 0.5,
          pointSize: 0.5,    
        })
      );
    }
    if(this.state.settings.boxSelection){
      layers.push(
        new PolygonLayer({
          id: "box-select-layer",
          filled: true,
          stroked: true,
          getPolygon: d => d.polygon,
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          getLineColor: [80, 80, 80],
          getLineColor: [0, 0, 0, 150],
          getFillColor: [255, 255, 255, 65],
          data: this.state.boxSelect.rectdata
        })
      )
    }
    return layers;
  }
  
  _onResize() {
    this._updateViewport({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  _updateViewport(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  _updateSettings(settings) {
    this.setState({
      settings: {...this.state.settings, ...settings},
    });
  }

  onDragStart(info, event){
      console.log(info);
      const {coordinate, x, y}                       = info;
      const [px, py]                     = info.viewport.unproject([x, y]);
      this.setState({
        boxSelect: {
          status: this.state.settings.boxSelection, rectdata: [{polygon: [[px, py], [px, py], [px, py], [px, py]], show: true}],
          startPos: coordinate
        }
      })
    }

  onDrag(info, event) {
      if (this.state.boxSelect.startPos) {
        const {x, y}     = info;
        const [px, py]   = info.viewport.unproject([x, y]);
        const startPoint = this.state.boxSelect.rectdata[0].polygon[0];
        this.setState({
          boxSelect: {
            status: this.state.settings.boxSelection, rectdata:[{polygon: [startPoint, [startPoint[0], py], [px, py], [px, startPoint[1]]], show: true}],
            startPos: this.state.boxSelect.startPos
          }
        });
      };
    };

  async onDragEnd(info, event) {
    if(this.state.settings.boxSelection){
      const {coordinate}     = info;
      const [x,y] = coordinate;
      const sx = this.state.boxSelect.startPos[0];
      const sy = this.state.boxSelect.startPos[1];

      const opts = {
        x_bounds: [Math.min(sx, x),Math.max(sx, x)],
        y_bounds: [Math.min(sy, y),Math.max(sy, y)],
      }
      console.log(opts, coordinate, x, y, sx, sy);

      const numRows = await requestStats('boxSelectnumRows', `&opts=${JSON.stringify(opts)}`);
      const color = await requestData(this.state.numRows, 1, 'boxSelectColor', `&opts=${JSON.stringify(opts)}`);
      const stats = await requestStats('getStatsOnBoxSelect', `&opts=${JSON.stringify(opts)}`);
      this.setState({
        data:{
          ...this.state.data,
          color: color.data[0].children[0].values,
        },
        dataSize: numRows,
        stats: stats
      });
  }
}

  render(){
    const {viewport, settings} = this.state;
    return (
      <div>
      <DeckGL 
        views={view}
        controller={true}
        viewState={INITIAL_VIEW_STATE}
        layers={this._renderLayers()}
        ref={this.deckRef}
        // onDragStart={this.onDragStart} onDrag={this.onDrag} onDragEnd={this.onDragEnd}
        >
      </DeckGL>
      {/* <div className="control-panel">
          <h1>Forebrain Cells</h1>
          <h2>No. of Points: {this.state.dataSize.toLocaleString()}</h2>
          <p>Visualize cell data in a 2d space.</p>
          <ul>
            <li>Hold cmd + drag to tilt the view</li>
            <li>Slide raidus to increase cell radius</li>
            <li>Uncheck Box Select Mode, and click any where to clear selections</li>
          </ul>
          <p>
            Made with <a href="http://deck.gl">deck.gl</a></p>
          <p>
            Data source: Allen's Institue
          </p>
          <hr />
            <ControlPanel settings={settings} onChange={this._updateSettings} />
          <hr />
          <p>Average Stats:</p>
          <ul>
            <li>qcScore: <b>{this.state.stats['qcScore']}</b></li>
            <li>geneCounts: <b>{this.state.stats['geneCounts']}</b></li>
          </ul>
          <hr />
          <p>Male Female Ratio:</p>
          <VictoryChart domainPadding={{x: 100}}>
            <VictoryBar  style={{ data: { fill: "#dfdcd6" } }} data={this.state.stats.sex} x="value" y="count"></VictoryBar>
            <VictoryAxis label="Sex" style={{axis: {stroke: "#dfdcd6"}, axisLabel: { padding: 30, fontSize: 20, stroke: "#dfdcd6" }, tickLabels: {stroke: "#dfdcd6", fontSize:15}}}/>
            <VictoryAxis dependentAxis style={{axis: {stroke: "#dfdcd6"}, axisLabel: { padding: 30 }, tickLabels: {stroke: "#dfdcd6", fontSize:15}}} tickFormat={(t) => `${d3.format(".2s")(t)}`} />
          </VictoryChart>
          <hr />
          <button onClick={this.clearSelections} style={{float: 'right'}}>Clear Selections</button>
        </div> */}
      </div>
      );
  }
  
}