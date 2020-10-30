import React, { FC, useState } from "react";
import Graph from "graphology";

import { FieldDefinition, FiltersType, CSVFormat } from "../Lib/types";
import { getAggregations } from "../Lib/getAggregations";

import "./Filters.css";
import BarChart from "./BarChart";

const Filters: FC<{
  fullGraph: Graph;
  format: CSVFormat;
  onSubmit(filters: FiltersType): void;
}> = ({ fullGraph, format, onSubmit }) => {
  const [filters, setFilters] = useState<FiltersType>({});

  // Aggregate data:
  const { aggregations, fields } = getAggregations(fullGraph, format);

  return (
    <section className="Filters c">
      <button onClick={() => onSubmit(filters)}>Filter and visualise</button>
      {fields.map((field) => (
        <div key={field.label}>
          <h3>
            <span className="hg">{field.label || field.key}</span>
          </h3>
          <BarChart agg={aggregations[field.key]} field={field} filters={filters} setFilters={setFilters}/>
        </div>
      ))}
    </section>
  );
};

export default Filters;
