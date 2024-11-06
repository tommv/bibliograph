import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import React, { Component, RefObject, createRef } from "react";
import Sigma from "sigma";

import { saveGEXF, saveHeatmap, saveReport, saveSVG } from "../Lib/saveHelpers";
import { CSVFormat, FieldIndices, FiltersType } from "../Lib/types";
import "./Viz.css";

interface PropsType {
  graph: Graph;
  indices: FieldIndices;
  filters: FiltersType;
  format: CSVFormat;
  onGoBack: () => void;
}
interface StateType {
  isFA2Running: boolean;
}

const DURATION = 200;

class Viz extends Component<PropsType, StateType> {
  domRoot: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  sigma?: Sigma;
  fa2?: FA2LayoutSupervisor;
  state: StateType = {
    isFA2Running: false,
  };

  // React lifecycle:
  componentDidMount(): void {
    this.initSigma();
  }
  componentWillUnmount(): void {
    this.killSigma();
  }
  componentDidUpdate(prevProps: PropsType): void {
    if (prevProps.graph !== this.props.graph) {
      if (this.props.graph) {
        this.initSigma();
      } else {
        this.killSigma();
      }
    }
  }

  // Sigma lifecycle:
  killSigma(): void {
    if (this.sigma) {
      this.sigma.kill();
      this.sigma = undefined;
    }
  }
  initSigma(): void {
    if (!this.domRoot.current) return;
    if (this.state.isFA2Running) this.stopFA2();
    if (this.sigma) this.killSigma();

    this.sigma = new Sigma(this.props.graph, this.domRoot.current, {
      labelFont: "Nunito, sans-serif",
    });

    this.initFA2();
  }

  // FA2 management:
  initFA2(): void {
    if (this.fa2) {
      this.fa2.kill();
    }

    this.fa2 = new FA2LayoutSupervisor(this.props.graph, {
      settings: forceAtlas2.inferSettings(this.props.graph),
    });
  }
  stopFA2(): void {
    if (!this.fa2) return;

    this.setState({ ...this.state, isFA2Running: false });
    this.fa2.stop();
  }
  startFA2(): void {
    if (!this.fa2) {
      return;
    }

    this.setState({ ...this.state, isFA2Running: true });
    this.fa2.start();
  }
  toggleFA2(): void {
    if (this.state.isFA2Running) {
      this.stopFA2();
    } else {
      this.startFA2();
    }
  }

  // Misc:
  zoom(ratio?: number): void {
    if (!this.sigma) return;

    if (!ratio) {
      this.sigma.getCamera().animatedReset({ duration: DURATION });
    } else if (ratio > 0) {
      this.sigma.getCamera().animatedZoom({ duration: DURATION });
    } else if (ratio < 0) {
      this.sigma.getCamera().animatedUnzoom({ duration: DURATION });
    }
  }

  render(): JSX.Element {
    return (
      <section className="Viz">
        <div className="features">
          <button className="btn" onClick={() => saveGEXF(this.props.graph, "graph-export.gexf")}>
            <i className="fa fa-download" /> Download <strong>.GEXF</strong> file
          </button>
          <button className="btn" onClick={() => saveSVG(this.props.graph, "graph-export.svg")}>
            <i className="fa fa-download" /> Download <strong>.SVG</strong> file
          </button>
          <button className="btn" onClick={() => saveHeatmap(this.props.graph, "graph-heatmap-export.svg")}>
            <i className="fa fa-download" /> Download <strong>Heatmap</strong> image
          </button>
          <button
            className="btn"
            onClick={() =>
              saveReport(
                this.props.graph,
                this.props.indices,
                this.props.filters,
                this.props.format,
                "graph-report.txt",
              )
            }
          >
            <i className="fa fa-download" /> Download <strong>report</strong>{" "}
          </button>
          <button className="btn right" onClick={this.props.onGoBack}>
            <i className="fa fa-undo" /> Go back to <strong>filters</strong> view
          </button>
        </div>

        <div className="sigma-wrapper">
          <div className="sigma-container" ref={this.domRoot} />

          <div className="controls">
            <span className="btn-wrapper">
              <button
                className="btn"
                onClick={() => this.toggleFA2()}
                title={this.state.isFA2Running ? "Stop the layout animation" : "Start the layout animation"}
              >
                {this.state.isFA2Running ? <i className="fas fa-spinner fa-pulse" /> : <i className="fas fa-play" />}
              </button>
            </span>
            <span className="btn-wrapper">
              <button className="btn" onClick={() => this.zoom(1)} title="Zoomer">
                <i className="fas fa-search-plus" />
              </button>
            </span>
            <span className="btn-wrapper">
              <button className="btn" onClick={() => this.zoom(-1)} title="Unzoom">
                <i className="fas fa-search-minus" />
              </button>
            </span>
            <span className="btn-wrapper">
              <button className="btn" onClick={() => this.zoom()} title="Zoom">
                <i className="far fa-dot-circle" />
              </button>
            </span>
          </div>
        </div>

        <div className="caption">
          {[
            this.props.format.references,
            ...this.props.format.metadataFields,
            ...(this.props.format.generatedFields || []),
          ]
            .filter((field) => field.variableColor)
            .map((field) => (
              <span key={field.variableName}>
                <span className="color-disc" style={{ background: field.variableColor }} /> {field.variableLabel}
              </span>
            ))}
        </div>
      </section>
    );
  }
}

export default Viz;
