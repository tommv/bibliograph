import { zipObject } from "lodash";

import { FIELDS_META, cleanFieldValues } from "./consts";
import { FIELD_IDS, FieldIndices, Work } from "./types";
import { wait } from "./utils";

const PER_PAGE = 200;

export async function fetchWorksCount(queryURL: string) {
  let count = 0;
  const url = new URL(queryURL);
  url.searchParams.set("select", "id");
  url.searchParams.set("mailto", "****@****.com");
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
  url.searchParams.set(
    "select",
    "id,title,publication_year,primary_location,authorships,concepts,locations,grants,referenced_works,cited_by_count",
  );
  url.searchParams.set("mailto", "****@****.com");
  url.searchParams.set("per-page", `${PER_PAGE}`);

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

export async function fetchFiles(files: File[]): Promise<Work[]> {
  const works: Work[] = [];
  await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      const data = JSON.parse(text) as { results: Work[] };
      data.results.forEach((work) => works.push(work));
    }),
  );

  return works;
}

export async function indexWorks(works: Work[]): Promise<FieldIndices> {
  const indices = zipObject(
    FIELD_IDS,
    FIELD_IDS.map(() => ({})),
  ) as FieldIndices;

  for (let workIndex = 0; workIndex < works.length; workIndex++) {
    const work = works[workIndex];

    for (let fieldIndex = 0; fieldIndex < FIELD_IDS.length; fieldIndex++) {
      const field = FIELD_IDS[fieldIndex];
      const { getValues } = FIELDS_META[field];
      const values = await cleanFieldValues(getValues(work));

      values.forEach(({ id, label }) => {
        indices[field][id] = indices[field][id] || { count: 0, label };
        indices[field][id].count++;
      });
    }
  }

  return indices;
}
