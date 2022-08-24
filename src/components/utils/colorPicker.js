import { useState } from "react";
import { SketchPicker } from "react-color";

import styles from "../../styles/ColorPicker.module.css";

export const ColorPicker = (props) => {
  const [state, setState] = useState({
    displayColorPicker: false,
    color: {
      r: '241',
      g: '112',
      b: '19',
      a: '1',
    },
  });

  const handleClick = () => {
    setState({...state, displayColorPicker: !state.displayColorPicker });
  };

  const handleClose = () => {
    setState({...state, displayColorPicker: false });
  };

  const handleChange = (color) => {
    setState({...state, color: color.rgb });
    props.onChange(Object.values(color.rgb));
  };

  return (
    <span>
      <div className={ styles.swatch } onClick={ handleClick }>
        <div className={ styles.color } style={{background: `rgba(${ state.color.r }, ${ state.color.g }, ${ state.color.b }, ${ state.color.a })`}}/>
      </div>
      { state.displayColorPicker ?
        <div className={ styles.popover }>
          <div className={ styles.cover } onClick={ handleClose }/>
          <SketchPicker color={ state.color } onChange={ handleChange } />
        </div> : null
      }
    </span>
  )
}
