import Graph from "graphology";
import React, { FC, useCallback, useEffect, useState } from "react";
import { FaUndo } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { TbFaceIdError } from "react-icons/tb";

import { fetchFiles, fetchQuery } from "../lib/api";
import { indexWorks } from "../lib/data";
import { getDefaultFilters, getFilteredGraph } from "../lib/filters";
import { aggregateFieldIndices } from "../lib/getAggregations";
import { prepareGraph } from "../lib/prepareGraph";
import { Aggregations, CustomFieldTypes, FieldIndices, FiltersType, RichWork } from "../lib/types";
import { useQuery } from "../lib/useQuery";
import "./App.css";
import Filters from "./Filters";
import Home from "./Home";
import Viz from "./Viz";

const App: FC = () => {
  const {
    query: { csvFile, jsonFile, openAlexQuery },
  } = useQuery();
  const [data, setData] = useState<{
    works: RichWork[];
    customFields: CustomFieldTypes;
    indices: FieldIndices;
    aggregations: Aggregations;
    filters: FiltersType;
  } | null>(null);
  const [filteredGraph, setFilteredGraph] = useState<Graph | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prepareData = useCallback(
    async (promise: Promise<{ works: RichWork[]; customFields: CustomFieldTypes }>) => {
      setIsLoading(true);
      setLoaderMessage("Indexing data");

      try {
        const { works, customFields } = await promise;
        const indices = await indexWorks(works);
        const aggregations = aggregateFieldIndices(indices, works, customFields);

        setData({
          works,
          customFields,
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
    let graph = await getFilteredGraph(data.works, data.indices, data.filters, data.customFields);
    graph = await prepareGraph(graph);

    setLoaderMessage(null);
    setIsLoading(false);
    setFilteredGraph(graph);
  }, [data, setIsLoading, setFilteredGraph]);

  let Component = <div>Woops, something went wrong...</div>;

  useEffect(() => {
    if (!data && csvFile) {
      prepareData(fetchFiles([{ path: csvFile, extension: "csv" }]));
    } else if (!data && jsonFile) {
      prepareData(fetchFiles([{ path: jsonFile, extension: "json" }]));
    } else if (!data && openAlexQuery) {
      prepareData(fetchQuery(openAlexQuery));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvFile, jsonFile, prepareData]);

  if (!data) Component = <Home onSubmit={prepareData} />;
  if (data && !filteredGraph) {
    Component = (
      <Filters
        works={data.works}
        aggregations={data.aggregations}
        filters={data.filters}
        customFields={data.customFields}
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
          <TbFaceIdError className="x5" />
        </div>
        <div>{errorMessage}</div>
        <div>
          <button className="btn right" onClick={() => setData(null)}>
            <FaUndo /> Go back to <strong>homepage</strong>
          </button>
        </div>
      </div>
    );
  }

  return <div className="App">{Component}</div>;
};

export default App;
