import React, { FC, useState } from "react";
import Graph from "graphology";

import { FieldDefinition, FiltersType } from "../Lib/types";
import { getAggregations } from "../Lib/getAggregations";

import "./Filters.css";
import BarChart from "./BarChart";

const FIELDS: FieldDefinition[] = [
  { label: "Color", key: "color", type: "string" },
  { label: "Product", key: "product", type: "string" },
  { label: "Age", key: "age", type: "number" },
];

const Filters: FC<{
  fullGraph: Graph;
  onSubmit(filters: FiltersType): void;
}> = ({ fullGraph }) => {
  const [filters, setFilters] = useState<FiltersType>({});

  // Aggregate data:
  const aggregations = getAggregations(fullGraph, FIELDS);

  return (
    <section className="Filters c">
      {FIELDS.map((field) => (
        <div key={field.label}>
          <h3>
            <span className="hg">{field.label || field.key}</span>
          </h3>
          <BarChart agg={aggregations[field.key]} />
        </div>
      ))}
    </section>
  );
};

export default Filters;
