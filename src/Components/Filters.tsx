import React, { FC } from "react";
import { last, max } from "lodash";

import { FiltersType, FieldDefinition, Aggregation } from "../Lib/types";

import "./Filters.css";

const Filters: FC<{
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  aggregations: { [field: string]: Aggregation };
  fields: FieldDefinition[];
  articlesMetadata: { nbArticles: number; nbDuplicates: number };
  onSubmit(filters: FiltersType): void;
  range: { min?: number; max?: number };
  onGoBack: () => void;
}> = ({
  filters,
  setFilters,
  aggregations,
  fields,
  articlesMetadata,
  onSubmit,
  range,
  onGoBack,
}) => {
  return (
    <section className="Filters c">
      <div className="actions">
        <button className="btn right" onClick={onGoBack}>
          <i className="fa fa-undo" /> Go back to{" "}
          <strong>upload CSV files</strong>
        </button>
      </div>
      <h2>
        <span className="hg">Filters</span>
      </h2>
      <p>
        Use the sliders to chose how many nodes of each type should be included
        in your network based on the number of records in which they appears. It
        is strongly recommended NOT to include the references occurring in one
        record only.
      </p>
      {articlesMetadata && (
        <p>
          <br />
          <i>
            Your data-set contained {articlesMetadata.nbArticles} articles
            published between {range.min} and {range.max}.<br />
            {articlesMetadata.nbDuplicates} articles were duplicates (
            {(articlesMetadata.nbArticles > 0
              ? (articlesMetadata.nbDuplicates / articlesMetadata.nbArticles) *
                100
              : 0
            ).toFixed(1)}
            %).
          </i>
        </p>
      )}

      <div className="fields">
        {fields.map((field) => {
          const agg = aggregations[field.key];
          const maxValue = last(agg.values)?.lowerBound || 0;
          const value = filters[field.key] || maxValue + 1;
          const aggValue = agg.values.find((agg) => agg.lowerBound >= value);
          const maxCount = max(agg.values.map((v) => v.count));
          const count = aggValue ? aggValue.count : 0;

          return (
            <div key={field.label}>
              <h4>{field.label || field.key}</h4>
              <div>
                Keep the <strong>{count}</strong> {field.label} occurring in at
                least <strong>{value}</strong> record
                {value > 1 ? "s" : ""}
              </div>
              <div>
                <span style={{ float: "left" }}>0</span>
                <span style={{ float: "right" }}>{maxCount}</span>
              </div>
              <input
                list={field.key + "-tickmarks"}
                type="range"
                name="vol"
                min={0}
                max={maxValue}
                value={maxValue + 1 - value}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    [field.key]: maxValue + 1 - +e.target.value,
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
