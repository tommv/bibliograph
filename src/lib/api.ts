import { keyBy, mapValues } from "lodash";

import { Work } from "./types";
import { wait } from "./utils";

const PER_PAGE = 200;
const DEFAULT_MAILTO = "tommaso.venturini@cnrs.fr";

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
): Promise<Work[]> {
  const count = await fetchWorksCount(queryURL);
  const numReq = Math.ceil(Math.min(count, maxWorks) / PER_PAGE);
  let numReqDone = 0;

  const url = new URL(queryURL);
  url.searchParams.set("sort", "cited_by_count:desc");
  url.searchParams.set("mailto", DEFAULT_MAILTO);
  url.searchParams.set("per-page", `${PER_PAGE}`);
  url.searchParams.set(
    "select",
    [
      "id",
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
    ].join(","),
  );

  let works = await Promise.all(
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

  return works
    .flat()
    .slice(0, maxWorks)
    .filter((work) => work);
}

export async function fetchRefsLabels(ids: string[]): Promise<Record<string, string | undefined>> {
  if (ids.length === 0) return {};

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
