import React, { useState, useMemo } from 'react';
import BuildPCOption from '../BuildPCOption/BuildPCOption';

const BuildPCStage = ({
    stage,
    selectedComponent = null,
    onSelectComponent = () => {},
    selectedCpuSocket = null,
    selectedMoboSocket = null
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState({ group: 'all', value: 'all' });
    const [isExpanded, setIsExpanded] = useState(true);

    // Filter components by search and active pill
    const filteredComponents = useMemo(() => {
        let list = stage.components || [];

        // 1. Text Search Filter
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase().trim();
            list = list.filter(opt => {
                const title = (opt.title || opt.dataName || '').toLowerCase();
                const brand = (opt.brand || '').toLowerCase();
                const socket = (opt.socket || '').toLowerCase();
                const chips = (opt.chips || []).join(' ').toLowerCase();
                return title.includes(q) || brand.includes(q) || socket.includes(q) || chips.includes(q);
            });
        }

        // 2. Pill Filter
        if (activeFilter.value !== 'all') {
            const val = activeFilter.value.toLowerCase();
            const group = activeFilter.group;

            list = list.filter(opt => {
                if (group === 'brand') {
                    return (opt.brand || '').toLowerCase() === val;
                }
                if (group === 'socket') {
                    return (opt.socket || '').toLowerCase() === val;
                }
                if (group === 'form') {
                    return (opt.form || '').toLowerCase() === val;
                }
                if (group === 'cooling') {
                    return (opt.cooling || '').toLowerCase() === val;
                }
                if (group === 'capacity') {
                    return (opt.capacity || '').toLowerCase().includes(val);
                }
                if (group === 'gen') {
                    return (opt.gen || '').toLowerCase() === val;
                }
                if (group === 'tier') {
                    return (opt.tier || '').toLowerCase() === val;
                }
                if (group === 'wattage') {
                    const w = Number(opt.watts) || 0;
                    if (val === '650') return w <= 650;
                    if (val === '750') return w === 750;
                    if (val === '850') return w === 850;
                    if (val === '1000') return w >= 1000;
                }
                // Fallback check in title / chips / brand
                const fullText = `${opt.title || ''} ${(opt.chips || []).join(' ')} ${opt.brand || ''}`.toLowerCase();
                return fullText.includes(val);
            });
        }

        return list;
    }, [stage.components, searchTerm, activeFilter]);

    return (
        <div className="build-stage-card" id={stage.id}>
            {/* Stage Header with Expand/Collapse Toggle */}
            <div
                className="build-stage-header"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsExpanded(!isExpanded);
                    }
                }}
            >
                <div className="build-stage-title-wrap">
                    <span className="build-stage-num">{stage.stepNumber}</span>
                    <div>
                        <h3 className="build-stage-name">{stage.title}</h3>
                    </div>
                </div>
                <div className="build-stage-header-right">
                    <span className="build-stage-avail-count">
                        {filteredComponents.length} of {stage.components?.length || 0} available
                    </span>
                    {selectedComponent ? (
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="build-stage-status selected">
                                Selected ✓
                            </span>
                            <button
                                type="button"
                                className="build-line-remove"
                                onClick={() => onSelectComponent(null)}
                                title="Deselect"
                                style={{
                                    border: 'none',
                                    background: 'var(--color-surface-subtle)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <span className="build-stage-status">
                            Pending Selection
                        </span>
                    )}
                    <button
                        type="button"
                        className="build-stage-toggle-btn"
                        aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '4px 6px',
                            color: 'var(--color-text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                        }}
                    >
                        ▼
                    </button>
                </div>
            </div>

            {/* Collapsible Content: Filters Toolbar and Components Grid */}
            {isExpanded && (
                <>
                    {stage.filters && (
                        <div className="build-filter-toolbar">
                            <div className="build-filter-search">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                                <input
                                    type="search"
                                    className="build-search-input"
                                    placeholder={stage.filters.searchPlaceholder || `Search ${stage.title}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            padding: '0 4px',
                                            color: 'var(--color-text-muted)'
                                        }}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>

                            {stage.filters.pills && stage.filters.pills.length > 0 && (
                                <div className="build-filter-pills">
                                    {stage.filters.pills.map((pill, idx) => {
                                        const isActive = activeFilter.value === pill.value;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={`build-pill ${isActive ? 'active' : ''}`}
                                                onClick={() => {
                                                    setActiveFilter({
                                                        group: pill.group,
                                                        value: pill.value
                                                    });
                                                }}
                                            >
                                                {pill.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Components Grid */}
                    <div className="build-components-grid" id={`grid-${stage.id}`}>
                        {filteredComponents.length > 0 ? (
                            filteredComponents.map((opt) => {
                                const isSelected = selectedComponent?.id === opt.id;

                                // Dynamic socket compatibility check
                                let compatText = null;
                                let isCompatible = true;

                                if (stage.id === 'stage-cpu' && selectedMoboSocket && opt.socket) {
                                    if (opt.socket === selectedMoboSocket) {
                                        compatText = `✓ Matches Board (${selectedMoboSocket})`;
                                        isCompatible = true;
                                    } else {
                                        compatText = `⚠️ Incompatible with ${selectedMoboSocket} Board`;
                                        isCompatible = false;
                                    }
                                } else if (stage.id === 'stage-mobo' && selectedCpuSocket && opt.socket) {
                                    if (opt.socket === selectedCpuSocket) {
                                        compatText = `✓ Matches CPU (${selectedCpuSocket})`;
                                        isCompatible = true;
                                    } else {
                                        compatText = `⚠️ Incompatible with ${selectedCpuSocket} CPU`;
                                        isCompatible = false;
                                    }
                                }

                                return (
                                    <BuildPCOption
                                        key={opt.id}
                                        opt={opt}
                                        isSelected={isSelected}
                                        onSelect={(item) => {
                                            if (isSelected) {
                                                onSelectComponent(null);
                                            } else {
                                                onSelectComponent(item);
                                            }
                                        }}
                                        isCompatible={isCompatible}
                                        compatText={compatText}
                                    />
                                );
                            })
                        ) : (
                            <div style={{
                                gridColumn: '1 / -1',
                                padding: 'var(--space-6)',
                                textAlign: 'center',
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-surface-subtle)',
                                borderRadius: 'var(--radius-lg)'
                            }}>
                                No components match your search filter "{searchTerm}".
                                <button
                                    type="button"
                                    className="btn btn-xs btn-outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setActiveFilter({ group: 'all', value: 'all' });
                                    }}
                                    style={{ marginLeft: '12px' }}
                                >
                                    Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default BuildPCStage;
