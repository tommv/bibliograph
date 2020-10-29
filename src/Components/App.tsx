import React, { FC, useEffect, useState } from "react";
import Graph from "graphology";

import Viz from "./Viz";
import Home from "./Home";
import Filters from "./Filters";
import { prepareGraph } from "../Lib/prepareGraph";
import { loadFullGraph } from "../Lib/loadFullGraph";
import { CSVFormat, FiltersType } from "../Lib/types";
import { getRandomGraph } from "../Lib/getRandomGraph";

import "./App.css";

const App: FC<{}> = () => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [format, setCSVFormat] = useState<CSVFormat | null>(null);
  const [filters, setFilters] = useState<FiltersType | null>(null);
  const [fullGraph, setFullGraph] = useState<Graph | null>(getRandomGraph());
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load CSVs on submit Home component:
    if (files && files.length && format && !fullGraph && !isLoading) {
      setIsLoading(true);
      loadFullGraph(files, format).then((graph) => {
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
  }, [files]);

  let Component = <div>Woops, something went wrong...</div>;

  if (!fullGraph)
    Component = (
      <Home
        onSubmit={(files: File[], format: CSVFormat) => {
          setFiles(files);
          setCSVFormat(format);
        }}
      />
    );
  if (fullGraph && !filteredGraph)
    Component = <Filters fullGraph={fullGraph} onSubmit={setFilters} />;
  if (filteredGraph)
    Component = (
      <Viz graph={filteredGraph} onGoBack={() => setFilteredGraph(null)} />
    );

  return <div className="App c">{Component}</div>;
};

export default App;
