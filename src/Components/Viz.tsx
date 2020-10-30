import React, { Component, createRef, RefObject } from "react";
import { WebGLRenderer } from "sigma";
import Graph from "graphology";

import { saveGEXF, saveSVG } from "../Lib/saveHelpers";

import "./Viz.css";

interface PropsType {
  graph: Graph;
  onGoBack: () => void;
}
interface StateType {}

class Viz extends Component<PropsType, StateType> {
  domRoot: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  sigma?: WebGLRenderer;

  // React lifecycle:
  componentDidMount() {
    this.initSigma();
  }
  componentWillUnmount() {
    this.killSigma();
  }
  componentDidUpdate(prevProps: PropsType) {
    if (prevProps.graph !== this.props.graph) {
      if (this.props.graph) {
        this.initSigma();
      } else {
        this.killSigma();
      }
    }
  }

  // Sigma lifecycle:
  killSigma() {
    if (this.sigma) {
      this.sigma.kill();
      this.sigma = undefined;
    }
  }
  initSigma() {
    if (!this.domRoot.current) return;
    if (this.sigma) this.killSigma();

    this.sigma = new WebGLRenderer(this.props.graph, this.domRoot.current, {
      labelFont: "Helvetica, sans-serif",
    });

    this.sigma.on("clickNode", ({ node }) => {
      // TODO
    });
    this.sigma.on("clickStage", () => {
      // TODO
    });
  }

  render() {
    return (
      <section className="Viz">
        <div className="controls">
          <button
            className="btn"
            onClick={() => saveGEXF(this.props.graph, "graph-export.gexf")}
          >
            Download .GEXF file
          </button>
          <button
            className="btn"
            onClick={() => saveSVG(this.props.graph, "graph-export.svg")}
          >
            Download .SVG file
          </button>
        </div>
        <div className="sigma-container" ref={this.domRoot} />
      </section>
    );
  }
}

export default Viz;
