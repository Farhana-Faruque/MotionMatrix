import React, { useState, useEffect } from 'react';
import '../styles/GraphViewPage.css';
import { getAllGraphData } from '../db';

export default function GraphViewPage() {
  const [graphs, setGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState(null);

  useEffect(() => {
    const allGraphs = getAllGraphData();
    setGraphs(allGraphs);
    if (allGraphs.length > 0) {
      setSelectedGraph(allGraphs[0]);
    }
  }, []);

  const getGraphColor = (type) => {
    switch(type) {
      case 'production':
        return '#1B4332';
      case 'attendance':
        return '#10B981';
      case 'efficiency':
        return '#D97706';
      default:
        return '#1B4332';
    }
  };

  const getMaxValue = (data) => {
    return Math.max(...data.map(d => d.value));
  };

  const renderLineChart = (data, color) => {
    if (data.length < 2) return null;

    const maxValue = getMaxValue(data);
    const width = 800;
    const height = 300;
    const padding = 40;

    const xScale = (width - 2 * padding) / (data.length - 1);
    const yScale = (height - 2 * padding) / maxValue;

    let pathData = '';
    data.forEach((point, index) => {
      const x = padding + index * xScale;
      const y = height - padding - point.value * yScale;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });

    return (
      <svg width={width} height={height} className="line-chart">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <line
              key={idx}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#E5E5E5"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const value = Math.round(maxValue * ratio);
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <text
              key={`label-${idx}`}
              x={padding - 10}
              y={y + 5}
              fontSize="12"
              fill="#999"
              textAnchor="end"
            >
              {value}
            </text>
          );
        })}

        {/* Path */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, idx) => {
          const x = padding + idx * xScale;
          const y = height - padding - point.value * yScale;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* X-axis labels (show every 5th point) */}
        {data.map((point, idx) => {
          if (idx % 5 === 0 || idx === data.length - 1) {
            const x = padding + idx * xScale;
            return (
              <text
                key={`date-${idx}`}
                x={x}
                y={height - padding + 20}
                fontSize="11"
                fill="#999"
                textAnchor="middle"
              >
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          }
          return null;
        })}

        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div className="graph-view-container">
      <div className="graph-header">
        <h2>📈 View Graphs</h2>
        <p>Track operational metrics and performance trends</p>
      </div>

      <div className="graph-layout">
        {/* Graph Selector */}
        <div className="graph-selector">
          <h3>Available Graphs</h3>
          <div className="graph-options">
            {graphs.map(graph => (
              <button
                key={graph.id}
                className={`graph-option ${selectedGraph?.id === graph.id ? 'active' : ''}`}
                onClick={() => setSelectedGraph(graph)}
                style={{ borderLeftColor: getGraphColor(graph.type) }}
              >
                <span className="graph-icon">
                  {graph.type === 'production' ? '📦' : 
                   graph.type === 'attendance' ? '👥' : '⚙️'}
                </span>
                <div className="option-info">
                  <p className="option-title">{graph.title}</p>
                  <p className="option-unit">{graph.unit}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Graph Display */}
        {selectedGraph && (
          <div className="graph-display">
            <div className="graph-header-info">
              <div>
                <h3>{selectedGraph.title}</h3>
                <p className="graph-period">{selectedGraph.period}</p>
              </div>
              <div className="graph-stats">
                <div className="stat">
                  <span className="stat-label">Max</span>
                  <span className="stat-value">{getMaxValue(selectedGraph.data)} {selectedGraph.unit}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg</span>
                  <span className="stat-value">
                    {Math.round(selectedGraph.data.reduce((a, b) => a + b.value, 0) / selectedGraph.data.length)} {selectedGraph.unit}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Min</span>
                  <span className="stat-value">{Math.min(...selectedGraph.data.map(d => d.value))} {selectedGraph.unit}</span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              {renderLineChart(selectedGraph.data, getGraphColor(selectedGraph.type))}
            </div>

            <div className="graph-table">
              <h4>Recent Data</h4>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGraph.data.slice(-10).reverse().map((point, idx) => (
                    <tr key={idx}>
                      <td>{new Date(point.date).toLocaleDateString()}</td>
                      <td>{point.value} {selectedGraph.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
