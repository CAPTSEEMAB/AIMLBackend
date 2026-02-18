class SpecGenerator {
  static generateVisualizationSpec(query, data, queryMetadata = {}) {
    if (!data || data.length === 0) {
      return this.generateEmptySpec();
    }

    const chartType = this.detectChartType(data, queryMetadata);
    const { xAxis, yAxis, nameKey, valueKey } = this.extractAxes(data, queryMetadata);

    const elementId = `chart-${Date.now()}`;
    
    return {
      root: "container",
      elements: {
        container: {
          type: "Stack",
          props: { direction: "vertical", spacing: 16 },
          children: ["query-display", "chart-container", "data-table"]
        },
        "query-display": {
          type: "Card",
          props: {
            title: "Generated Query",
            content: {
              "$state": "/query"
            }
          }
        },
        "chart-container": {
          type: "Card",
          props: {
            title: `${this.formatChartTitle(chartType)} Visualization`
          },
          children: [elementId]
        },
        [elementId]: {
          type: this.mapChartType(chartType),
          props: {
            data: { "$state": "/chartData" },
            xAxis: xAxis || "x",
            yAxis: yAxis || "y",
            nameKey: nameKey,
            valueKey: valueKey,
            responsive: true,
            height: 400
          }
        },
        "data-table": {
          type: "Card",
          props: {
            title: "Raw Data",
            collapsible: true,
            collapsed: true
          },
          children: ["table-element"]
        },
        "table-element": {
          type: "DataTable",
          props: {
            data: { "$state": "/rawData" },
            columns: Object.keys(data[0] || {}).slice(0, 10)
          }
        }
      },
      state: {
        query: query,
        chartData: data,
        rawData: data,
        chartType: chartType,
        metadata: queryMetadata
      }
    };
  }

  static detectChartType(data, metadata = {}) {
    if (metadata.chartType) return metadata.chartType;

    const keys = Object.keys(data[0] || {});
    const numericFields = keys.filter(k => typeof data[0][k] === 'number');
    const stringFields = keys.filter(k => typeof data[0][k] === 'string');

    if (numericFields.length > 2 || (numericFields.length > 1 && stringFields.length > 1)) {
      return "bar";
    }

    if (stringFields.length === 1 && numericFields.length === 1) {
      return "bar";
    }

    if (keys.some(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'))) {
      return "line";
    }

    if (numericFields.length === 2 && stringFields.length === 0) {
      return "scatter";
    }

    if (stringFields.length === 1 && numericFields.length === 1) {
      return "pie";
    }

    return "table";
  }

  static extractAxes(data, metadata = {}) {
    if (metadata.xAxis && metadata.yAxis) {
      return {
        xAxis: metadata.xAxis,
        yAxis: metadata.yAxis,
        nameKey: metadata.nameKey || metadata.xAxis,
        valueKey: metadata.valueKey || metadata.yAxis
      };
    }

    const keys = Object.keys(data[0] || {});
    const numericFields = keys.filter(k => typeof data[0][k] === 'number');
    const stringFields = keys.filter(k => typeof data[0][k] === 'string');

    return {
      xAxis: stringFields[0] || keys[0],
      yAxis: numericFields[0] || keys[1],
      nameKey: stringFields[0] || keys[0],
      valueKey: numericFields[0] || keys[1]
    };
  }

  static mapChartType(chartType) {
    const typeMap = {
      bar: "RechartBar",
      line: "RechartLine",
      pie: "RechartPie",
      scatter: "RechartScatter",
      area: "RechartArea",
      table: "DataTable"
    };
    return typeMap[chartType] || "RechartBar";
  }

  static formatChartTitle(chartType) {
    const titles = {
      bar: "Bar Chart",
      line: "Line Chart",
      pie: "Pie Chart",
      scatter: "Scatter Plot",
      area: "Area Chart",
      table: "Data Table"
    };
    return titles[chartType] || "Chart";
  }

  static generateEmptySpec() {
    return {
      root: "container",
      elements: {
        container: {
          type: "Stack",
          props: { direction: "vertical", spacing: 16 },
          children: ["empty-message"]
        },
        "empty-message": {
          type: "Card",
          props: {
            title: "No Data",
            content: "No results found for this query."
          }
        }
      },
      state: {
        chartData: [],
        rawData: []
      }
    };
  }

  static generateErrorSpec(error) {
    return {
      root: "container",
      elements: {
        container: {
          type: "Stack",
          props: { direction: "vertical", spacing: 16 },
          children: ["error-message"]
        },
        "error-message": {
          type: "Alert",
          props: {
            variant: "destructive",
            title: "Error",
            content: error
          }
        }
      },
      state: {
        error: error
      }
    };
  }
}

module.exports = SpecGenerator;
