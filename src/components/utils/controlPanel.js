import React, {Component} from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

const propTypes = {
  settings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default class ControlPanel extends Component {
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
    this._renderSlider = this._renderSlider.bind(this);
    this.getControls = this.getControls.bind(this);
    this.state = {
      ...this.props.settings
    }
  }

  componentDidMount(){
    this.setState({
      ...this.props.settings
    })
  }

  handler() {
    console.log("controlPanel",this.state);
    this.props.onChange(this.state);
  }

  _renderToggle(key, displayName) {
    return (
      <div className="input">
        <label>{displayName}</label>
        <input
          type="checkbox"
          checked={this.props.settings[key] || false}
        />
      </div>
    );
  }  

  _renderSlider(key, displayName, props) {
    return (
      <div className="input">
        <label>{displayName}</label>
        <input
          type="range"
          {...props}
          value={this.state[key].value}
          onChange={(e) => {
            if(!this.state[key].datafixed){
              this.setState({[key]: {...this.state[key], value: e.target.value}});
            }
          }
          }
        />
        <label>{d3.format(",")(this.state[key].value)}</label>
        
      </div>
    );
  }

  getControls(controls){
    let render = [];
    Object.entries(controls).map(([key, value]) => {
      if(key !== 'color'){
        render.push(this._renderSlider(key, String(key).toUpperCase(), value));
      }
    })
    return render;
  }

  render() {
    return (
      <div>
        <div>
        {this.getControls(this.props.settings)}
        </div>
        <button className="gen-plot" onClick={this.handler}>Generate Plot</button>
      </div>
    );
  }
}