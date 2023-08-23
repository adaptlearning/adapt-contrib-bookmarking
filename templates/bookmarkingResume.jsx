import React from 'react';

export default function Bookmarking(props) {
  const {
    label,
    ariaLabel
  } = props;
  return (
    <div className="bookmarking-resume__inner">
      <button
        className='btn-text bookmarking-resume__button js-bookmarking-resume-button'
        aria-label={ariaLabel} >
        {label}
      </button>
    </div>
  );
}
