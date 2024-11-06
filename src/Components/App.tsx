import Graph, { UndirectedGraph } from "graphology";
import { isEmpty, pickBy, toPairs } from "lodash";
import React, { FC, useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";

import { aggregateFieldIndices } from "../Lib/getAggregations";
import { indexCSVs } from "../Lib/indexCSVs";
import { loadFilterGraph } from "../Lib/loadFilterGraph";
import { prepareGraph } from "../Lib/prepareGraph";
import { CSVFormat, FieldIndices, FiltersType } from "../Lib/types";
import "./App.css";
import Filters from "./Filters";
import Home from "./Home";
import Viz from "./Viz";

//TODO: put this in config
const defaultFilters: FiltersType = {
  references: 2,
};

const App: FC = () => {
  const [files, setFiles] = useState<File[] | null>(null);
  const [filesReady, setFilesReady] = useState<boolean>(false);
  const [range, setRange] = useState<{ min?: number; max?: number }>({});
  const [format, setCSVFormat] = useState<CSVFormat | null>(null);
  const [filters, setFilters] = useState<FiltersType>(defaultFilters);
  const [filtersReady, setFiltersReady] = useState<boolean>(false);
  const [indices, setIndices] = useState<FieldIndices>({});
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);

  // ****************** Index uploaded CSV prepare filters *************** //
  useEffect(() => {
    // Load CSVs on submit Home component:
    if (filesReady && files && files.length && format && isEmpty(indices) && !isLoading) {
      setIsLoading(true);
      indexCSVs(files, format, range, setLoaderMessage).then((indices) => {
        setIndices(indices);
        setIsLoading(false);
      });
    }
  }, [filesReady, files, format, indices, isLoading, range]);

  // ****************** Build and display Network *********************** //
  useEffect(() => {
    // Prepare graph when filters are submitted:
    if (files && files.length && format && indices && filters && filtersReady && !filteredGraph && !isLoading) {
      setIsLoading(true);
      // filter fieldIndices
      // hash with at least one dups are passed for filtering
      const filteredFieldIndices: FieldIndices = {
        hash: pickBy(indices.hash, (nb) => nb > 1),
      };
      // keep the occ index entries only if occ counts >= filters
      toPairs(indices).forEach(([fieldType, valuesOccs]) => {
        if (filters[fieldType])
          filteredFieldIndices[fieldType] = pickBy(valuesOccs, (occ) => occ >= filters[fieldType]);
      });

      setLoaderMessage("Creating the graph from CSVs...");
      loadFilterGraph(files, format, filteredFieldIndices, range, setLoaderMessage).then((graph: UndirectedGraph) => {
        setLoaderMessage("Spacialiazing the graph...");
        prepareGraph(graph).then((spacialisedGraph) => {
          setFilteredGraph(spacialisedGraph);
          setIsLoading(false);
        });
      });
    }
  }, [files, filteredGraph, filters, format, indices, isLoading, range, filtersReady]);

  // ****************** Chose the right component *********************** //
  let Component = <div>Woops, something went wrong...</div>;

  if (isEmpty(indices))
    Component = (
      <Home
        files={files || []}
        range={range}
        format={format}
        onSubmit={(files: File[], format: CSVFormat, range: { min?: number; max?: number }) => {
          setFiles(files);
          setRange(range);
          setCSVFormat(format);
          setFilesReady(true);
        }}
      />
    );
  if (format && !isEmpty(indices) && !filteredGraph) {
    // Aggregate data:
    const { aggregations, fields } = aggregateFieldIndices(indices, format);
    const articlesMetadata = toPairs(indices.hash).reduce(
      (r, [, nb]) => ({
        nbArticles: r.nbArticles + nb,
        nbDuplicates: r.nbDuplicates + nb - 1,
      }),
      { nbArticles: 0, nbDuplicates: 0 },
    );
    Component = (
      <Filters
        filters={filters}
        setFilters={setFilters}
        aggregations={aggregations}
        fields={fields}
        onSubmit={() => {
          setFiltersReady(true);
        }}
        articlesMetadata={articlesMetadata}
        range={range}
        onGoBack={() => {
          setIndices({});
          setFilters(defaultFilters);
          setFilesReady(false);
        }}
      />
    );
  }
  if (filteredGraph)
    Component = (
      <Viz
        graph={filteredGraph}
        indices={indices}
        filters={filters || {}}
        format={format as CSVFormat}
        onGoBack={() => {
          setFilteredGraph(null);
          setFiltersReady(false);
        }}
      />
    );

  if (isLoading) {
    Component = (
      <div className="loading">
        <div>
          <FaSpinner className="spin x5" />
        </div>
        <div>{loaderMessage}</div>
      </div>
    );
  }

  return <div className="App">{Component}</div>;
};

export default App;
