import React, { FC, useState } from "react";
import { last } from "lodash";

import { FiltersType, CSVFormat, FieldIndices } from "../Lib/types";
import { aggregateFieldIndices } from "../Lib/getAggregations";
import BarChart from "./BarChart";

import "./Filters.css";

const Filters: FC<{
  fieldIndices: FieldIndices;
  format: CSVFormat;
  onSubmit(filters: FiltersType): void;
}> = ({ fieldIndices, format, onSubmit }) => {
  // Aggregate data:
  const { aggregations, fields } = aggregateFieldIndices(fieldIndices, format);
  // default filters
  const [filters, setFilters] = useState<FiltersType>({ references: 2 });

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
      {fields.map((field) => {
        const maxValue = last(aggregations[field.key].values)!.lowerBound || 0;
        const value = filters[field.key] || 0;
        const aggValue = aggregations[field.key].values.find(
          (agg) => agg.lowerBound >= value
        );
        const count = aggValue ? aggValue.count : 0;

        return (
          <div key={field.label}>
            <h4>
              <span className="hg">{field.label || field.key}</span>
            </h4>
            {/*<BarChart*/}
            {/*  agg={aggregations[field.key]}*/}
            {/*  field={field}*/}
            {/*  filters={filters}*/}
            {/*  setFilters={setFilters}*/}
            {/*/>*/}
            <div>
              Keep the <strong>{count}</strong> item{count > 1 ? "s" : ""}{" "}
              occurring in at least <strong>{value}</strong> record
              {value > 1 ? "s" : ""}
            </div>
            <input
              type="range"
              name="vol"
              min={0}
              max={maxValue}
              value={value}
              onChange={(e) =>
                setFilters({ ...filters, [field.key]: +e.target.value })
              }
            />
          </div>
        );
      })}
      <button onClick={() => onSubmit(filters)}>Filter and visualise</button>
    </section>
  );
};

export default Filters;
