import React, { FC } from "react";
import { Aggregation } from "../Lib/types";

import "./BarChart.css";

const BarChart: FC<{ agg: Aggregation; fieldLabel: string }> = ({
  agg,
  fieldLabel,
}) => {
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
            style={{
              height: (100 * Math.log(count)) / Math.log(agg.max) + "%",
            }}
          >
            <span>
              <strong>
                {count} {fieldLabel}
                <br />
                in {label}
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
