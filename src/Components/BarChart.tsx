import React, { FC } from "react";
import { Aggregation } from "../Lib/types";

import "./BarChart.css";

const BarChart: FC<{ agg: Aggregation }> = ({ agg }) => {
  const maxP10 =
    agg.max > 0 ? Math.pow(10, Math.floor(Math.log10(agg.max))) : 0;
  const hLineValue = ([5, 2].find((n) => n * maxP10 < agg.max) || 1) * maxP10;

  return (
    <div className="BarChart">
      <div className="bars">
        {agg.values.map(({ label, count }) => (
          <div
            key={label}
            className="bar"
            style={{ height: (100 * count) / agg.max + "%" }}
          >
            <span>
              <strong>{label}</strong> ({count} line{count > 1 ? "s" : ""})
            </span>
          </div>
        ))}
      </div>
      <div
        className="y-caption"
        style={{ bottom: (100 * hLineValue) / agg.max + "%" }}
      >
        <span>{hLineValue}</span>
      </div>
    </div>
  );
};

export default BarChart;
