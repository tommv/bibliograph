import Graph from "graphology";
import React, { FC, useCallback, useState } from "react";
import { FaSpinner } from "react-icons/fa6";

import { indexWorks } from "../lib/data";
import { getDefaultFilters, getFilteredGraph } from "../lib/filters";
import { aggregateFieldIndices } from "../lib/getAggregations";
import { prepareGraph } from "../lib/prepareGraph";
import { Aggregations, FieldIndices, FiltersType, Work } from "../lib/types";
import { wait } from "../lib/utils";
import "./App.css";
import Filters from "./Filters";
import Home from "./Home";
import Viz from "./Viz";

const App: FC = () => {
  const [data, setData] = useState<{
    works: Work[];
    indices: FieldIndices;
    aggregations: Aggregations;
    filters: FiltersType;
  } | null>(null);
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);

  const prepareData = useCallback(
    async (promise: Promise<Work[]>) => {
      setIsLoading(true);
      const works = await promise;
      const indices = await indexWorks(works);
      const aggregations = aggregateFieldIndices(indices, works);

      setIsLoading(false);
      setData({
        works,
        indices,
        aggregations,
        filters: getDefaultFilters(aggregations),
      });
    },
    [setIsLoading, setData],
  );

  const filterGraph = useCallback(async () => {
    if (!data) return;

    setIsLoading(true);
    let graph = await getFilteredGraph(data.works, data.indices, data.filters);
    graph = await prepareGraph(graph);

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

  return <div className="App">{Component}</div>;
};

export default App;
