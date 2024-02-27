import React from 'react';
import { classes } from 'core/js/reactHelpers';

export default function Bookmarking(props) {
  const {
    label,
    ariaLabel,
    isDisabled
  } = props;
  return (
    <div className="bookmarking-resume__inner">
      <button
        type='button'
        className={classes([
          'btn-text bookmarking-resume__button js-bookmarking-resume-button',
          isDisabled && 'is-disabled'
        ])}
        aria-disabled={isDisabled || null}
        aria-label={ariaLabel} >
        {label}
      </button>
    </div>
  );
}
