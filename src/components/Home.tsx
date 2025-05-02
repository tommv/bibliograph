import React, { FC, useMemo, useState } from "react";

import { fetchFiles, fetchQuery } from "../lib/api";
import { CustomFieldTypes, RichWork } from "../lib/types";
import { useLocalStorage } from "../lib/useLocalStorage";
import "./Home.css";

const STORAGE_LAST_QUERY_KEY = "lastQueryKey";

const Home: FC<{
  onSubmit(promise: Promise<{ works: RichWork[]; customFields: CustomFieldTypes }>): void;
}> = ({ onSubmit }) => {
  const [initialQueryURL, setInitialQueryURL] = useLocalStorage(STORAGE_LAST_QUERY_KEY);
  const [queryURL, setQueryURL] = useState<string | null | undefined>(initialQueryURL);
  const [files, setFiles] = useState<File[]>([]);
  const iframeURL = useMemo(
    () =>
      queryURL
        ? queryURL.replace("//api.", "//") + "&view=api,list,report"
        : "https://openalex.org/works?view=api,list,report",
    [queryURL],
  );

  return (
    <section className="Home c">
      <h1 className="center">
        <span className="hg">Bibliograph</span>
      </h1>
      <p>BiblioGraph allows turning a query to OpenAlex (or an OpenAlex corpus) into a scientometric landscape, a network composed of:</p>
        <ol>
          <li>A base-network of references appearing together in the records of the corpus (co-cited by them)</li>
          <li>A layer of metadata extracted from the records (authors, sources, subﬁelds...) positioned according to their co-occurrence with the references in the base map</li>
        </ol>
      <p>Define your query in the frame below. Set the ﬁlter thresholds in the next page. Explore and export your bibliographic landscape.</p>
      <p><a href="https://docs.google.com/document/d/1YOcy9B9VeLpCAfG-gDwSoSma8UUCehzokVoJ2wPJKmM/edit?usp=sharing" target="_blank">Read (and cite) the method paper &gt;&gt;</a></p>

      <br />

      <iframe src={iframeURL} width="100%" height="480px" allow="clipboard-write"></iframe>

      <br />

      <div className="row">
        <div className="6 col">
          <label htmlFor="query-url">Please copy the address provided above in the "API Box" and paste it below:</label>
          <div className="flex-row">
            <input
              id="query-url"
              type="text"
              value={queryURL || ""}
              onChange={(e) => setQueryURL(e.target.value || null)}
              placeholder={initialQueryURL || undefined}
              style={{
                flexGrow: 1,
              }}
            />
          </div>
        </div>

        <div className="6 col">
          <label htmlFor="file-upload">
            Or upload a local CSV or JSON OpenAlex results file, or a custom CSV file instead:
          </label>
          <div>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              style={{
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>

      <br />

      <div className="flex-row center">
        <button
          className="btn primary"
          disabled={!files.length && !queryURL}
          onClick={() => {
            if (files.length) {
              onSubmit(fetchFiles(files));
            } else if (queryURL) {
              setInitialQueryURL(queryURL);
              onSubmit(fetchQuery(queryURL));
            }
          }}
        >
          {files.length ? `Index the given OpenAlex API results JSON files` : `Extract data from OpenAlex`}
        </button>
      </div>
      <hr />
      <div className="flex-row center">
        <div className="logos">
        <a href="https://www.unige.ch/sciences-societe/medialab/">
            <img
              className="logo"
              src={import.meta.env.BASE_URL + "img/logo_medialab_UNIGE.jpg"}
              alt="Medialab UNIGE"
            />
          </a>
          <a href="https://cis.cnrs.fr/">
            <img
              className="logo"
              src={import.meta.env.BASE_URL + "img/logo_CNRS_CIS.jpg"}
              alt="Centre Internet Société CNRS"
            />
          </a>
          <a href="https://ouestware.com">
            <img className="logo" src={import.meta.env.BASE_URL + "img/logo_ouestware_text.svg"} alt="OuestWare" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Home;
