import React, { FC } from "react";
import Graph from "graphology";

import "./Filters.css";
import { FiltersType } from "../Lib/types";

const Filters: FC<{
  fullGraph: Graph;
  onSubmit(filters: FiltersType): void;
}> = () => {
  return <section className="Filters">TODO</section>;
};

export default Filters;
