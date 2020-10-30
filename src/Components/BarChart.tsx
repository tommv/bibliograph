import React, { FC } from "react";
import { Aggregation, FieldDefinition, FiltersType } from "../Lib/types";

import "./BarChart.css";

const BarChart: FC<{
  agg: Aggregation;
  field: FieldDefinition;
  filters: FiltersType;
  setFilters: (filters: FiltersType) => void;
}> = ({ agg, field, filters, setFilters }) => {
  const maxP10 =
    agg.max > 0 ? Math.pow(10, Math.floor(Math.log10(agg.max))) : 0;
  const hLineValue = ([5, 2].find((n) => n * maxP10 < agg.max) || 1) * maxP10;

  return (
    <div className="BarChart">
      <div className="bars">
        {agg.values.map(({ lowerBound, count }) => (
          <div
            key={lowerBound}
            className={`bar${
              filters[field.key] === lowerBound ? " selected" : ""
            }`}
            style={{
              height: (100 * Math.log(count)) / Math.log(agg.max) + "%",
            }}
            onClick={() => setFilters({ ...filters, [field.key]: lowerBound })}
          >
            <span>
              <strong>
                {count} {field.label}
                <br />
                in more than ${lowerBound - 1} records
              </strong>
            </span>
          </div>
        ))}
      </div>
      <div
        className="y-caption"
        style={{
          bottom: (100 * Math.log(hLineValue)) / Math.log(agg.max) + "%",
        }}
      >
        <span>{hLineValue}</span>
      </div>
    </div>
  );
};

export default BarChart;
