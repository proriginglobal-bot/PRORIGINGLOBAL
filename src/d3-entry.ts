import * as d3 from 'd3';

declare global {
  interface Window {
    d3: typeof d3;
    _lastFreightChartData?: any;
    renderFreightD3Chart?: (data: any) => void;
  }
}

// Expose d3 on window for global access
window.d3 = d3;

// If chart data was waiting for D3 initialization, render immediately
if (typeof window.renderFreightD3Chart === 'function' && window._lastFreightChartData) {
  window.renderFreightD3Chart(window._lastFreightChartData);
}
