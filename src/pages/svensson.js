/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {OrthographicView} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {tableFromIPC} from 'apache-arrow';
import ControlPanel from '../components/utils/controlPanel';
import { ColorPicker } from '../components/utils/colorPicker';
import * as d3 from 'd3';

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  rotationX: 20,
  rotationOrbit: 0,
  minZoom: -5,
  maxZoom: 10,
  zoom: -3
};

async function requestData(type='svensson/coords', params=null){
    let url = `/api/attractors/${type}`;
    if(params!=null){
        url += `?${params}`;
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
const settings =  {
  'a': {min: -10, max: 100, step: 0.1, value: 1.4, datafixed: true},
  'b': {min: -10, max: 10, step: 0.1, value: 1.56, datafixed: true},
  'c': {min: -10, max: 100, step: 0.1, value: 1.40, datafixed: true},
  'd': {min: -10, max: 100, step: 0.1, value: -2.56, datafixed: true},
  'n': {min: 100000, max: 50000000, step: 10000, value: 100000, datafixed: false}
}

export default function App({onLoad}) {
  const [viewState, updateViewState] = useState(INITIAL_VIEW_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [radius, setRadius] = useState(1);
  const [color, setColor] = useState([255, 140, 0]);

  const [config, setConfig] = useState({
    ...settings
  })

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const rotateCamera = () => {
      updateViewState(v => ({
        ...v,
        rotationOrbit: v.rotationOrbit + 120,
        transitionDuration: 2400,
        transitionInterpolator,
        onTransitionEnd: rotateCamera
      }));
    };
    rotateCamera();
  }, [isLoaded]);

  async function getData(n){
    const data_coords = await requestData('svensson/coords',
    `n=${n}`
    );
    const positions = data_coords.data[0].children[0].values;
    return {
        length: positions ? (positions.length)/2 : 1,
        attributes: {
            getPosition: {value: positions, size:2},
        }
    };
  }

  const layers = [
    new ScatterplotLayer({
      id: 'scatter-plot-layer',
      data: data,
      pickable: true,
      opacity: 0.4,
      stroked: false,
      filled: true,
      autoHighlight: true,
      getFillColor: color,
      getRadius: parseInt(radius),
      updateTriggers: {
        getFillColor: color,
        getRadius: radius
      }
    })
  ];
  async function updateConfig(s){
    setConfig({...config, ...s});
    const data = await getData(s.n.value);
    setData(data);
  }
  function updateRadius(e){
    setRadius(e.target.value);
  }
  function updateColor(color){
    setColor(color);
  }
  return (
    <div>
    <DeckGL
      views={new OrthographicView({id: '2d-scene', controller: true})}
      viewState={viewState}
      controller={true}
      onViewStateChange={v => updateViewState(v.viewState)}
      layers={layers}
    />
      <div className="control-panel">
          <h1>Svensson Attractor Dashboard</h1>
          <h2>No. of Points: {d3.format(",")(config.n.value)}</h2>
          <p>
            Made with <a href="https://github.com/rapidsai/node">Node Rapids</a> and <a href="http://deck.gl">deck.gl</a>
          </p>
          <hr />
          <p>
            Attractor Configurations
          </p>
            <ControlPanel settings={settings} onChange={updateConfig} />
          <hr />
          <p>
            Visual Configurations
          </p>
          <div className='input'>
            <label style={{"marginRight": "10px"}}>Radius</label>
            <input type="range" value={radius} onChange={updateRadius} min={1} max={30} step={1}></input>
            <label>{radius}</label>
          </div>
          <div className='input'>
            <label style={{"marginRight": "10px"}}>Color</label>
            <ColorPicker onChange={updateColor}/>
          </div>
          <hr />
      </div>

    </div>
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}
