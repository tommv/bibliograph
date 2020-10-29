import React, { FC, useEffect, useState } from "react";
import Graph from "graphology";

import Home from "./Home";
import Filters from "./Filters";
import { FiltersType } from "../Lib/types";
import { loadFullGraph } from "../Lib/loadFullGraph";

import "./App.css";
import Viz from "./Viz";
import { prepareGraph } from "../Lib/prepareGraph";

const App: FC<{}> = () => {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [filters, setFilters] = useState<FiltersType | null>(null);
  const [fullGraph, setFullGraph] = useState<Graph | null>(null);
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load CSVs on submit Home component:
    if (paths && paths.length && !fullGraph && !isLoading) {
      setIsLoading(true);
      loadFullGraph(paths).then((graph) => {
        setFullGraph(graph);
        setIsLoading(false);
      });
    }

    // Prepare graph when filters are submitted:
    if (filters && fullGraph && !filteredGraph && !isLoading) {
      setIsLoading(true);
      prepareGraph(fullGraph, filters).then((graph) => {
        setFilteredGraph(graph);
        setIsLoading(false);
      });
    }
  }, [paths]);

  let Component = <div>Woops, something went wrong...</div>;

  if (!fullGraph) Component = <Home onSubmit={setPaths} />;
  if (fullGraph && !filteredGraph)
    Component = <Filters fullGraph={fullGraph} onSubmit={setFilters} />;
  if (filteredGraph)
    Component = (
      <Viz graph={filteredGraph} onGoBack={() => setFilteredGraph(null)} />
    );

  return <div className="App">{Component}</div>;
};

export default App;
