import React, {Component} from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  settings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default class ControlPanel extends Component {
  constructor(props) {
    super(props);
  }

  _renderToggle(key, displayName) {
    return (
      <div className="input">
        <label>{displayName}</label>
        <input
          type="checkbox"
          checked={this.props.settings[key] || false}
          onChange={e => this.props.onChange({[key]: e.target.checked})}
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
          value={this.props.settings[key] || 0}
          onChange={e => this.props.onChange({[key]: parseInt(e.target.value)})}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this._renderSlider('radius', 'Cell Radius', {min: 1, max: 1000, step: 1})}
        {this._renderToggle('boxSelection', 'Box Select Mode')}
      </div>
    );
  }
}