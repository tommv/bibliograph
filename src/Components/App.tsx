import React, { FC, useEffect, useState } from "react";
import Graph, { UndirectedGraph } from "graphology";
import { isEmpty, pickBy, toPairs } from "lodash";

import Viz from "./Viz";
import Home from "./Home";
import Filters from "./Filters";
import { prepareGraph } from "../Lib/prepareGraph";
import { loadFilterGraph } from "../Lib/loadFilterGraph";
import { CSVFormat, FieldIndices, FiltersType } from "../Lib/types";
import { indexCSVs } from "../Lib/indexCSVs";

import "./App.css";

const App: FC<{}> = () => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [range, setRange] = useState<{ min?: number; max?: number }>({});
  const [format, setCSVFormat] = useState<CSVFormat | null>(null);
  const [filters, setFilters] = useState<FiltersType | null>(null);
  const [indices, setIndices] = useState<FieldIndices>({});
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load CSVs on submit Home component:
    if (files && files.length && format && isEmpty(indices) && !isLoading) {
      setIsLoading(true);
      indexCSVs(files, format, range).then((indices) => {
        setIndices(indices);
        setIsLoading(false);
      });
    }
  }, [files, format, indices, isLoading, range]);

  useEffect(() => {
    // Prepare graph when filters are submitted:
    if (
      files &&
      files.length &&
      format &&
      indices &&
      filters &&
      !filteredGraph &&
      !isLoading
    ) {
      setIsLoading(true);
      // filter fieldIndices
      const filteredFieldIndices: FieldIndices = {};
      // keep the occ index entries only if occ counts >= filters
      toPairs(indices).forEach(([fieldType, valuesOccs]) => {
        if (filters[fieldType])
          filteredFieldIndices[fieldType] = pickBy(
            valuesOccs,
            (occ, type) => occ >= filters[fieldType]
          );
      });
      loadFilterGraph(files, format, filteredFieldIndices, range).then(
        (graph: UndirectedGraph) =>
          prepareGraph(graph).then((spacialisedGraph) => {
            setFilteredGraph(spacialisedGraph);
            setIsLoading(false);
          })
      );
    }
  }, [files, filteredGraph, filters, format, indices, isLoading, range]);

  let Component = <div>Woops, something went wrong...</div>;

  if (isEmpty(indices))
    Component = (
      <Home
        onSubmit={(
          files: File[],
          format: CSVFormat,
          range: { min?: number; max?: number }
        ) => {
          setFiles(files);
          setRange(range);
          setCSVFormat(format);
        }}
      />
    );
  if (format && !isEmpty(indices) && !filteredGraph)
    Component = (
      <Filters fieldIndices={indices} format={format} onSubmit={setFilters} />
    );
  if (filteredGraph)
    Component = (
      <Viz
        graph={filteredGraph}
        onGoBack={() => {
          setFilteredGraph(null);
          setFilters(null);
        }}
      />
    );

  return <div className="App">{Component}</div>;
};

export default App;
