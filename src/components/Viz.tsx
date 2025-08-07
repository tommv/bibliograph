import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import { keys, sortBy } from "lodash";
import { Component, RefObject, createRef } from "react";
import { FaDotCircle, FaSearchMinus, FaSearchPlus, FaUndo } from "react-icons/fa";
import { FaDownload, FaPlay, FaSpinner } from "react-icons/fa6";
import Sigma from "sigma";

import { DEFAULT_METADATA_COLOR, FIELDS_META } from "../lib/consts";
import { saveGEXF, saveHeatmap, saveSVG } from "../lib/saveHelpers";
import { CustomFieldTypes, FIELD_IDS, FieldIndices, FiltersType } from "../lib/types";
import { drawNodeHover } from "../lib/utils";
import "./Viz.css";

interface PropsType {
  graph: Graph;
  indices: FieldIndices;
  filters: FiltersType;
  customFields: CustomFieldTypes;
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
      defaultDrawNodeHover: drawNodeHover,
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
    const allVisibleFields = this.props.graph.getAttribute("allVisibleFields");
    console.log(this.props.graph.getAttribute("allVisibleFields"));
    return (
      <section className="Viz">
        <div className="features">
          <button className="btn" onClick={() => saveGEXF(this.props.graph, "graph-export.gexf")}>
            <FaDownload /> Download <strong>GEXF</strong>
          </button>
          <button className="btn" onClick={() => saveSVG(this.props.graph, "graph-export.svg")}>
            <FaDownload /> Download <strong>graph</strong> image
          </button>
          <button className="btn" onClick={() => saveHeatmap(this.props.graph, "graph-heatmap-export.svg")}>
            <FaDownload /> Download <strong>heatmap</strong> image
          </button>
          <button className="btn right" onClick={this.props.onGoBack}>
            <FaUndo /> Go back to <strong>filters</strong> view
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
                {this.state.isFA2Running ? <FaSpinner className="spin" /> : <FaPlay />}
              </button>
            </span>
            <span className="btn-wrapper">
              <button className="btn" onClick={() => this.zoom(1)} title="Zoomer">
                <FaSearchPlus />
              </button>
            </span>
            <span className="btn-wrapper">
              <button className="btn" onClick={() => this.zoom(-1)} title="Unzoom">
                <FaSearchMinus />
              </button>
            </span>
            <span className="btn-wrapper">
              <button className="btn" onClick={() => this.zoom()} title="Zoom">
                <FaDotCircle />
              </button>
            </span>
          </div>
        </div>

        <div className="caption">
          {FIELD_IDS.filter((field) => allVisibleFields.has(`openAlex::${field}`)).map((field) => {
            const { color, label } = FIELDS_META[field];
            return (
              <span key={field}>
                <span className="color-disc" style={{ background: color }} /> {label}
              </span>
            );
          })}
          {/* order of custom fields is important for colors that's why we sort */}
          {sortBy(keys(this.props.customFields)).map((customField, i) => {
            return allVisibleFields.has(`custom::${customField}`) ? (
              <span key={customField}>
                <span
                  className="color-disc"
                  style={{ background: i < DEFAULT_METADATA_COLOR.length ? DEFAULT_METADATA_COLOR[i] : "pink" }}
                />{" "}
                {customField}
              </span>
            ) : null;
          })}
        </div>
      </section>
    );
  }
}

export default Viz;
