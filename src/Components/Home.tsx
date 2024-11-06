import { toPairs } from "lodash";
import React, { FC, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";

import { CSVFormats } from "../Lib/CSVFormats";
import { CSVFormat } from "../Lib/types";
import "./Home.css";

const FORMAT_PLACEHOLDER = "SELECT_A_FORMAT";

const Home: FC<{
  files: File[];
  format: CSVFormat | null;
  range: { min?: number; max?: number };
  onSubmit(files: File[], format: CSVFormat, range: { min?: number; max?: number }): void;
}> = ({ files, range, format, onSubmit }) => {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();
  const defaultFormat = toPairs(CSVFormats).find(([, f]) => f.label === format?.label);
  const [selectedFormat, setSelectedFormat] = useState<string>(defaultFormat ? defaultFormat[0] : FORMAT_PLACEHOLDER);
  const [minYear, setMinYear] = useState<number>(range.min || 1900);
  const [maxYear, setMaxYear] = useState<number>(range.max || 2100);

  const csvFiles = (acceptedFiles.length > 0 ? acceptedFiles : files).filter(
    (file: FileWithPath) => file.path && (file.path.split(".").pop() || "").toLowerCase() === "csv",
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

      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        <p>Drag and drop here your CSV files or their folder</p>
        {csvFiles.length > 0 && (
          <>
            <p>
              <b>
                currently {csvFiles.length} selected file
                {csvFiles.length > 1 ? "s" : ""}
              </b>
            </p>
            <div className="files-list">
              {csvFiles.map((f) => (
                <span key={f.name}>{f.name}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <br />

      <div className="flex-row">
        <span>Only parse papers published between</span>{" "}
        <input value={minYear} onChange={(e) => setMinYear(+e.target.value)} className="card" type="number" />{" "}
        <span>and</span>{" "}
        <input value={maxYear} onChange={(e) => setMaxYear(+e.target.value)} className="card" type="number" />
      </div>
      <div className="flex-row">
        <span>These CSVs come from</span>
        <select className="card" value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}>
          <option value={FORMAT_PLACEHOLDER}>(please select a source)</option>
          {toPairs(CSVFormats).map(([key, format]) => (
            <option key={key} value={key}>
              {format.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-row">
        <button
          className="btn primary"
          disabled={!csvFiles.length || !CSVFormats[selectedFormat]}
          onClick={() => {
            if (csvFiles.length && CSVFormats[selectedFormat])
              onSubmit(csvFiles, CSVFormats[selectedFormat], {
                min: minYear,
                max: maxYear,
              });
          }}
        >
          Parse and index {csvFiles.length} CSV file
          {csvFiles.length > 1 ? "s" : ""}
        </button>
      </div>
      <hr />
      <div className="flex-row">
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
