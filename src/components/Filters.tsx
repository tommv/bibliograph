import { last, max } from "lodash";
import React, { FC } from "react";
import { FaUndo } from "react-icons/fa";

import { FIELDS_META } from "../lib/consts";
import { Aggregations, FIELD_IDS, FiltersType, Work } from "../lib/types";
import "./Filters.css";

const Filters: FC<{
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  aggregations: Aggregations;
  works: Work[];
  onSubmit(filters: FiltersType): void;
  onGoBack: () => void;
}> = ({ filters, setFilters, aggregations, works, onSubmit, onGoBack }) => {
  return (
    <section className="Filters c">
      <div className="actions">
        <button className="btn right" onClick={onGoBack}>
          <FaUndo /> Go back to <strong>upload CSV files</strong>
        </button>
      </div>
      <h2>
        <span className="hg">Filters</span>
      </h2>
      <p>
        Use the sliders to chose how many nodes of each type should be included in your network based on the number of
        records in which they appears. It is strongly recommended NOT to include the references occurring in one record
        only.
      </p>
      <p>
        <br />
        <i>Your data-set contains {works.length} articles.</i>
      </p>

      <br />

      <div className="fields">
        {FIELD_IDS.map((field) => {
          const { label } = FIELDS_META[field];
          const agg = aggregations[field];
          const maxValue = last(agg.values)?.lowerBound || 0;
          const value = filters[field] || maxValue + 1;
          const aggValue = agg.values.find((agg) => agg.lowerBound >= value);
          const maxCount = max(agg.values.map((v) => v.count));
          const count = aggValue ? aggValue.count : 0;

          const intro = field === "records" ? "with at least" : "occurring in at least";
          const unity = field === "records" ? "citation" : "record";

          return (
            <div key={label}>
              <div>
                Keep the <strong>{count}</strong> <span className="hg">{label.toLowerCase()}</span> {intro}{" "}
                <strong>{value}</strong> {unity}
                {value > 1 ? "s" : ""}
              </div>
              <div>
                <span style={{ float: "left" }}>0</span>
                <span style={{ float: "right" }}>{maxCount}</span>
              </div>
              <input
                list={field + "-tickmarks"}
                type="range"
                name="vol"
                min={0}
                max={maxValue}
                value={maxValue + 1 - value}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    [field]: maxValue + 1 - +e.target.value,
                  })
                }
              />
            </div>
          );
        })}
      </div>

      <br />

      <div className="center">
        <button className="btn primary" onClick={() => onSubmit(filters)}>
          Filter and visualise
        </button>
      </div>
    </section>
  );
};

export default Filters;
