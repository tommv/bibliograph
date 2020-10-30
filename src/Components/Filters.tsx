import React, { FC, useState } from "react";

import { FiltersType, CSVFormat, FieldIndices } from "../Lib/types";
import { aggregateFieldIndices } from "../Lib/getAggregations";

import "./Filters.css";
import BarChart from "./BarChart";

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
      <button onClick={() => onSubmit(filters)}>Filter and visualise</button>
      {fields.map((field) => (
        <div key={field.label}>
          <h3>
            <span className="hg">{field.label || field.key}</span>
          </h3>
          {<BarChart
            agg={aggregations[field.key]}
            field={field}
            filters={filters}
            setFilters={setFilters}
          />}
        </div>
      ))}
    </section>
  );
};

export default Filters;
