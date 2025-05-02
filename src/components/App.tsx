import Graph from "graphology";
import React, { FC, useCallback, useState } from "react";
import { FaUndo } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { TbFaceIdError } from "react-icons/tb";

import { indexWorks } from "../lib/data";
import { getDefaultFilters, getFilteredGraph } from "../lib/filters";
import { aggregateFieldIndices } from "../lib/getAggregations";
import { prepareGraph } from "../lib/prepareGraph";
import { Aggregations, FieldIndices, FiltersType, RichWork } from "../lib/types";
import "./App.css";
import Filters from "./Filters";
import Home from "./Home";
import Viz from "./Viz";

const App: FC = () => {
  const [data, setData] = useState<{
    works: RichWork[];
    indices: FieldIndices;
    aggregations: Aggregations;
    filters: FiltersType;
  } | null>(null);
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prepareData = useCallback(
    async (promise: Promise<RichWork[]>) => {
      setIsLoading(true);
      setLoaderMessage("Indexing data");

      try {
        const works = await promise;
        const indices = await indexWorks(works);
        const aggregations = aggregateFieldIndices(indices, works);

        setData({
          works,
          indices,
          aggregations,
          filters: getDefaultFilters(aggregations),
        });
      } catch (e) {
        setErrorMessage(e + "");
      }

      setIsLoading(false);
      setLoaderMessage(null);
    },
    [setIsLoading, setData],
  );

  const filterGraph = useCallback(async () => {
    if (!data) return;

    setIsLoading(true);
    setLoaderMessage("Preparing graph data");
    let graph = await getFilteredGraph(data.works, data.indices, data.filters);
    graph = await prepareGraph(graph);

    setLoaderMessage(null);
    setIsLoading(false);
    setFilteredGraph(graph);
  }, [data, setIsLoading, setFilteredGraph]);

  let Component = <div>Woops, something went wrong...</div>;

  if (!data) Component = <Home onSubmit={prepareData} />;
  if (data && !filteredGraph) {
    Component = (
      <Filters
        works={data.works}
        aggregations={data.aggregations}
        filters={data.filters}
        setFilters={(filters) => setData({ ...data, filters })}
        onSubmit={filterGraph}
        onGoBack={() => {
          setData(null);
        }}
      />
    );
  }
  if (data && filteredGraph)
    Component = (
      <Viz
        graph={filteredGraph}
        indices={data.indices}
        filters={data.filters}
        onGoBack={() => {
          setFilteredGraph(null);
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

  if (errorMessage) {
    Component = (
      <div className="error">
        <div>
          <TbFaceIdError />
        </div>
        <div>{errorMessage}</div>
        <div>
          <button className="btn right" onClick={() => setData(null)}>
            <FaUndo /> Go back to <strong>upload CSV files</strong>
          </button>
        </div>
      </div>
    );
  }

  return <div className="App">{Component}</div>;
};

export default App;
