import React from 'react';

const BuildPCOption = ({
    opt,
    isSelected = false,
    onSelect = () => {},
    isCompatible = true,
    compatText = null
}) => {
    return (
        <div
            className={`build-part-card ${isSelected ? 'selected' : ''}`}
            data-category={opt.category}
            data-id={opt.id}
            data-name={opt.dataName}
            data-price={opt.price}
            data-watts={opt.watts}
            data-socket={opt.socket || opt.brands}
            data-brand={opt.brand}
            onClick={() => onSelect(opt)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(opt);
                }
            }}
        >
            <div className="build-part-top">
                {opt.badge?.text && (
                    <span className={`badge badge-${opt.badge.type || 'primary'}`}>
                        {opt.badge.text}
                    </span>
                )}
                <span className="build-part-price">
                    {opt.displayPrice || `৳${Number(opt.price || 0).toFixed(2)}`}
                </span>
            </div>

            <strong className="build-part-title">{opt.title}</strong>

            <div className="build-part-chips">
                {opt.chips?.map((chip, idx) => (
                    <span key={idx}>{chip}</span>
                ))}
            </div>

            <div className="build-part-bottom">
                {compatText ? (
                    <span className={`build-compat-pill ${isCompatible ? 'match' : 'error'}`}>
                        {compatText}
                    </span>
                ) : opt.compatibility !== null && opt.compatibility !== undefined ? (
                    <span className={`build-compat-pill ${opt.compatibility.isMatch ? 'match' : ''}`}>
                        {opt.compatibility.text}
                    </span>
                ) : null}

                <button
                    type="button"
                    className={`btn btn-sm btn-${isSelected ? 'primary' : 'outline'} build-select-btn`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(opt);
                    }}
                    aria-pressed={isSelected}
                >
                    {isSelected ? 'Selected ✓' : 'Select Part'}
                </button>
            </div>
        </div>
    );
};

export default BuildPCOption;
