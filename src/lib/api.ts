import { chunk, fromPairs, isEmpty, isPlainObject, keyBy, mapValues, omit, pickBy, values } from "lodash";
import { parse } from "papaparse";

import { enrichWorks } from "./data";
import { CustomFieldTypes, RichWork, Work } from "./types";
import { unflattenObject, wait } from "./utils";

const PER_PAGE = 200;
const DEFAULT_MAILTO = "tommaso.venturini@cnrs.fr";
const WORK_FIELDS = [
  "id",
  "doi",
  "display_name",
  "authorships",
  "cited_by_count",
  "grants",
  "keywords",
  "locations",
  "primary_location",
  "primary_topic",
  "primary_topic",
  "publication_year",
  "referenced_works",
  "title",
  "topics",
];

export async function fetchWorksCount(queryURL: string) {
  let count = 0;
  const url = new URL(queryURL);
  url.searchParams.set("select", "id");
  url.searchParams.set("mailto", DEFAULT_MAILTO);
  url.searchParams.set("per-page", "1");
  url.searchParams.set("page", "1");
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    count = data.meta.count;
  } catch (e) {
    console.error(`Error while fetching works count:\n\t${e}`);
  }
  return count;
}

export async function fetchQuery(
  queryURL: string,
  { maxWorks = 10000, updateProgress }: { maxWorks?: number; updateProgress?: (percents: number) => void } = {},
): Promise<{ works: RichWork[]; customFields: CustomFieldTypes }> {
  const count = await fetchWorksCount(queryURL);
  const numReq = Math.ceil(Math.min(count, maxWorks) / PER_PAGE);
  let numReqDone = 0;

  const url = new URL(queryURL);
  url.searchParams.set("sort", "cited_by_count:desc");
  url.searchParams.set("mailto", DEFAULT_MAILTO);
  url.searchParams.set("per-page", `${PER_PAGE}`);
  url.searchParams.set("select", WORK_FIELDS.join(","));

  const works = await Promise.all(
    [...Array(numReq).keys()].map(async (i) => {
      try {
        url.searchParams.set("page", `${i + 1}`);
        let response = await fetch(url);
        if (response.status == 429) {
          for (let j = 1; j <= 3 && !response.ok; j++) {
            await wait(j * 100);
            response = await fetch(url);
          }
        }
        if (!response.ok) {
          throw new Error(`Network response was ${response.status} ${response.statusText}`);
        }
        const data = (await response.json()) as { results: Work[] };
        numReqDone++;
        if (updateProgress) updateProgress(Math.round((numReqDone / numReq) * 100));
        return data.results;
      } catch (e) {
        console.error(`Error while fetching works:\n\t${e}`);
      }

      return [];
    }),
  );

  return {
    works: works
      .flat()
      .slice(0, maxWorks)
      .filter((work) => work)
      .map((work) => ({ ...work, metadata: {} })),
    customFields: {},
  };
}

export async function fetchWorks(
  ids: string[],
  {
    batchSize = 50,
    updateProgress,
    idType = "openalex",
  }: { batchSize?: number; updateProgress?: (percents: number) => void; idType?: "doi" | "openalex" } = {},
): Promise<Record<string, Work>> {
  if (ids.length > batchSize) {
    let complete = 0;
    const allBatchesResults = await Promise.all(
      chunk(ids, batchSize).map(async (batch) => {
        try {
          const batchResult = await fetchWorks(batch, { batchSize, idType });
          complete += batch.length;
          if (updateProgress) updateProgress(Math.round((complete / ids.length) * 100));
          return batchResult;
        } catch (e) {
          console.error(`Error while fetching works:\n\t${e}`);
        }

        return {};
      }),
    );

    return allBatchesResults.reduce((iter, batchResults) => ({ ...iter, ...batchResults }), {});
  } else {
    const url = new URL(`https://api.openalex.org/works`);
    url.searchParams.set("select", WORK_FIELDS.join(","));
    url.searchParams.set("mailto", DEFAULT_MAILTO);
    url.searchParams.set("filter", `${idType}:${ids.join("|")}`);
    url.searchParams.set("per-page", ids.length + "");
    url.searchParams.set("page", "1");

    let response = await fetch(url);
    if (response.status == 429) {
      for (let j = 1; j <= 3 && !response.ok; j++) {
        await wait(j * 100);
        response = await fetch(url);
      }
    }
    if (!response.ok) {
      throw new Error(`Network response was ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as { results: Work[] };

    return keyBy(
      data.results.map((work) => ({ ...work, metadata: {} })),
      (work) => (idType === "openalex" ? work.id : (work.doi as string)),
    );
  }
}

export async function fetchRefsLabels(
  ids: string[],
  { batchSize = 30 }: { batchSize?: number } = {},
): Promise<Record<string, string | undefined>> {
  if (ids.length === 0) return {};

  if (ids.length > batchSize) {
    const allBatchesResults = await Promise.all(
      chunk(ids, batchSize).map(async (batch) => {
        try {
          return await fetchRefsLabels(batch, { batchSize });
        } catch (e) {
          console.error(`Error while fetching works:\n\t${e}`);
        }

        return {};
      }),
    );

    return allBatchesResults.reduce((iter, batchResults) => ({ ...iter, ...batchResults }), {});
  } else {
    const url = new URL(`https://api.openalex.org/works`);
    url.searchParams.set("select", "display_name,id");
    url.searchParams.set("mailto", DEFAULT_MAILTO);
    url.searchParams.set("filter", "ids.openalex:" + ids.join("|"));
    url.searchParams.set("per-page", ids.length + "");
    url.searchParams.set("page", "1");

    const response = await fetch(url);
    if (!response.ok) return {};
    const data = (await response.json()) as { results: Work[] };
    return mapValues(keyBy(data.results, "id"), ({ display_name }) => display_name);
  }
}

export type FilePath = { path: string; extension?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFilePath(file: any): file is FilePath {
  return isPlainObject(file) && typeof file.path === "string";
}

export function getPathExtension(path: string) {
  return path.split(".").at(-1)?.toLowerCase();
}

const UNFLATTEN_WORKS_SETTINGS = {
  arrayKeys: [
    "authorships",
    "concepts",
    "counts_by_year",
    "grants",
    "keywords",
    "locations",
    "mesh",
    "referenced_works",
    "related_works",
    "topics",
  ],
  booleanKeys: [
    "has_fulltext",
    "is_retracted",
    "is_paratext",
    "primary_location.is_oa",
    "primary_location.source.is_oa",
    "primary_location.source.is_in_doaj",
    "primary_location.source.is_indexed_in_scopus",
    "primary_location.source.is_core",
    "primary_location.is_accepted",
    "primary_location.is_published",
    "open_access.is_oa",
    "open_access.any_repository_has_fulltext",
    "citation_normalized_percentile.is_in_top_1_percent",
    "citation_normalized_percentile.is_in_top_10_percent",
    "best_oa_location.is_oa",
    "best_oa_location.source.is_oa",
    "best_oa_location.source.is_in_doaj",
    "best_oa_location.source.is_indexed_in_scopus",
    "best_oa_location.source.is_core",
    "best_oa_location.is_accepted",
    "best_oa_location.is_published",
    "authorships.is_corresponding",
    "locations.is_oa",
    "locations.is_accepted",
    "locations.is_published",
    "locations.source.is_oa",
    "locations.source.is_in_doaj",
    "locations.source.is_indexed_in_scopus",
    "locations.source.is_core",
  ],
  jsonKeys: ["authorships.institutions", "authorships.affiliations"],
  numberKeys: [
    "cited_by_count",
    "countries_distinct_count",
    "institutions_distinct_count",
    "referenced_works_count",
    "locations_count",
    "publication_year",
    "cited_by_percentile_year.min",
    "cited_by_percentile_year.max",
    "apc_list.value",
    "apc_list.value_usd",
    "topics.score",
    "keywords.score",
    "concepts.level",
    "concepts.score",
    "sustainable_development_goals.score",
    "counts_by_year.year",
    "counts_by_year.cited_by_count",
  ],
};
const OPEN_ALEX_MARKERS = ["id", "doi", "type", "has_fulltext", "versions"];
export async function fetchFiles(
  files: (File | FilePath)[],
): Promise<{ works: RichWork[]; customFields: CustomFieldTypes }> {
  const result: { works: RichWork[]; customFields: CustomFieldTypes } = { works: [], customFields: {} };

  await Promise.all(
    files.map(async (file) => {
      const text = await (isFilePath(file) ? (await fetch(file.path)).text() : file.text());

      const extension = isFilePath(file) ? file.extension || getPathExtension(file.path) : getPathExtension(file.name);
      switch (extension) {
        case "csv": {
          // Check header to see if the CSV is an export from OpenAlex:
          const {
            data: [header],
          } = parse<Record<string, string>>(text, { header: false, preview: 1 });
          const columnsSet = new Set(values(header));

          // If all markers are here, then we consider this file as a CSV exported from OpenAlex
          if (OPEN_ALEX_MARKERS.every((field) => columnsSet.has(field))) {
            const { data } = parse<Record<string, string>>(text, { header: true });
            data.forEach((row) => {
              // This test clears empty-esque trailing rows:
              if (!isEmpty(pickBy(row, (v) => !!v))) {
                const work = unflattenObject<RichWork>(row, UNFLATTEN_WORKS_SETTINGS);
                result.works.push(work);
              }
            });
          }
          // Else, we consider it as a CSV with a first column with work IDs (to fetch from OpenAlex), and then columns
          // with custom arbitrary metadata fields:
          else {
            const res = parse<Record<string, string>>(text, { header: true });
            const { data, meta } = res;
            const idField = meta.fields?.at(0);
            if (!idField) throw new Error("Missing ID field.");

            const ids = data.map((row) => row[idField]).filter((str) => !!str);
            const idType: "doi" | "openalex" = ids[0].match(/^https:\/\/openalex\.org/)
              ? "openalex"
              : ids[0].match(/^https:\/\/doi\.org/)
                ? "doi"
                : "openalex";

            const rawWorks = Object.values(await fetchWorks(ids, { idType }));
            const customRows = fromPairs(
              data.map((row) => [row[idField], omit(row, idField) as Record<string, string>]),
            );
            const { works, customFields } = enrichWorks(rawWorks, customRows);
            works.forEach((work) => {
              result.works.push(work);
            });
            result.customFields = customFields;
          }
          break;
        }
        case "json":
        default: {
          const data = JSON.parse(text) as { results: Work[] };
          data.results.forEach((work) => result.works.push({ ...work, metadata: {} }));
        }
      }
    }),
  );

  return result;
}
