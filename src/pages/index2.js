/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OrbitView, LinearInterpolator} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {tableFromIPC} from 'apache-arrow';


// Data source: kaarta.com
const LAZ_SAMPLE =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/point-cloud-laz/indoor.0.1.laz';

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

const transitionInterpolator = new LinearInterpolator(['rotationOrbit']);

export default function App({onLoad}) {
  const [viewState, updateViewState] = useState(INITIAL_VIEW_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      const data = getData();
      setData(data);    
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

  async function getData(){
    const dataSize = 15000000;
    const data = await requestData(dataSize, 'lorenz/coords', `sigma=10&beta=2.667&rho=28.0&n=${dataSize}`);
    const positions = data.data[0].children[0].values;
    return {
        length: positions ? (positions.length)/3 : 1,
        attributes: {
            getPosition: {value: positions, size:3},
        }
    };
  }

  const layers = [
    new PointCloudLayer({
      id: 'laz-point-cloud-layer',
      data: data,
    //   coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      getNormal: [0, 1, 0],
      getColor: [0,0,0],
      opacity: 0.5,
      pointSize: 0.5,
    })
  ];

  return (
    <DeckGL
      views={new OrbitView({orbitAxis: 'Y', fov: 50})}
      viewState={viewState}
      controller={true}
      onViewStateChange={v => updateViewState(v.viewState)}
      layers={layers}
      parameters={{
        clearColor: [0.93, 0.86, 0.81, 1]
      }}
    />
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}
