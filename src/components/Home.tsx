import React, { FC, useMemo, useState } from "react";

import { fetchFiles, fetchQuery } from "../lib/data";
import { Work } from "../lib/types";
import "./Home.css";

const Home: FC<{
  onSubmit(dataset: Work[]): void;
}> = ({ onSubmit }) => {
  const initialQueryURL: string | null = null;
  const [queryURL, setQueryURL] = useState<string | null>(initialQueryURL);
  const [files, setFiles] = useState<File[]>([]);
  const iframeURL = useMemo(
    () =>
      queryURL
        ? queryURL.replace("//api.", "//") + "&view=api,list,report"
        : "https://openalex.org/works?view=api,list,report",
    [],
  );

  return (
    <section className="Home c">
      <h1 className="center">
        <span className="hg">Bibliograph</span>
      </h1>
      <p>
        Bibliograph allows you turn a corpus of scientometrics records from ISI Web of Science or Scopus into a
        landscape of bibliographic coupling. Such a landscape consists in:
      </p>
      <ol>
        <li>
          A base map network of references co-occurring in the records of the corpus - weighted by the frequency of
          their co-occurrence;
        </li>
        <li>
          A layer of metadata extracted from the records (e.g. authors, subject areas, keywords) and positioned in the
          graph according to their co-occurrence with the references of the base map.
        </li>
      </ol>
      <p>
        Upload your corpus, choose the period you want to investigate, select the filtering thresholds and explore your
        bibliographic landscape.
      </p>

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
          <label htmlFor="file-upload">Or upload a local OpenAlex CSV works results file instead:</label>
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
              fetchFiles(files).then((results) => onSubmit(results));
            } else if (queryURL) {
              fetchQuery(queryURL).then((results) => onSubmit(results));
            }
          }}
        >
          {files.length ? `Index the given OpenAlex API results JSON files` : `Query OpenAlex API`}
        </button>
      </div>
      <hr />
      <div className="flex-row center">
        <div className="logos">
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
