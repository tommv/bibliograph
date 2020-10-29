import React, { FC } from "react";
import Graph from "graphology";

import { FiltersType } from "../Lib/types";

import "./Filters.css";

const Filters: FC<{
  fullGraph: Graph;
  onSubmit(filters: FiltersType): void;
}> = () => {
  return <section className="Filters">TODO</section>;
};

export default Filters;
