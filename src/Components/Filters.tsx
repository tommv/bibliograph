import React, { FC, useState } from "react";
import { last, mapValues } from "lodash";

import {
  FiltersType,
  CSVFormat,
  FieldIndices,
  Aggregation,
} from "../Lib/types";
import { aggregateFieldIndices } from "../Lib/getAggregations";

import "./Filters.css";

const Filters: FC<{
  fieldIndices: FieldIndices;
  format: CSVFormat;
  onSubmit(filters: FiltersType): void;
}> = ({ fieldIndices, format, onSubmit }) => {
  // Aggregate data:
  const { aggregations, fields } = aggregateFieldIndices(fieldIndices, format);
  // Default filters:
  const [filters, setFilters] = useState<FiltersType>({
    ...mapValues(
      aggregations,
      (agg: Aggregation) => last(agg.values)!.lowerBound + 1
    ),
    references: 2,
  });

  return (
    <section className="Filters c">
      <h2>
        <span className="hg">Filters</span>
      </h2>
      <p>
        Use the sliders to chose how many nodes of each type should be included
        in your network based on the number of records in which they appears. It
        is strongly recommended NOT to include the references occurring in one
        record only.
      </p>

      <div className="fields">
        {fields.map((field) => {
          const agg = aggregations[field.key];
          const maxValue = last(agg.values)!.lowerBound || 0;
          const value = filters[field.key] || 0;
          const aggValue = agg.values.find((agg) => agg.lowerBound >= value);
          const count = aggValue ? aggValue.count : 0;

          return (
            <div key={field.label}>
              <h4>{field.label || field.key}</h4>
              <div>
                Keep the <strong>{count}</strong> item{count > 1 ? "s" : ""}{" "}
                occurring in at least <strong>{value}</strong> record
                {value > 1 ? "s" : ""}
              </div>
              <input
                list={field.key + "-tickmarks"}
                type="range"
                name="vol"
                min={0}
                max={maxValue + 1}
                value={maxValue + 1 - value}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    [field.key]: maxValue + 1 - +e.target.value,
                  })
                }
              />
              <datalist id={field.key + "-tickmarks"}>
                <option value={0} label={agg.values[0].lowerBound + ""} />
                <option value={maxValue + 1} label="0" />
              </datalist>
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
