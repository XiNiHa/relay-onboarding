import { Environment, Network, RecordSource, Store } from "relay-runtime";
import type {
  FetchFunction,
  GraphQLResponse,
  IEnvironment,
} from "relay-runtime";

const fetchFn: FetchFunction = async (params, variables) => {
  if (!import.meta.env.VITE_GITHUB_ACCESS_TOKEN) {
    throw new Error(
      "VITE_GITHUB_ACCESS_TOKEN is missing. Copy .env.example to .env and add a GitHub access token.",
    );
  }

  if (!params.text) {
    throw new Error(`Relay operation ${params.name} has no query text.`);
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_GITHUB_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: params.text, variables }),
  });

  const payload = (await response.json()) as GraphQLResponse;

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed (${response.status}).`);
  }

  return payload;
};

function createEnvironment(): IEnvironment {
  const network = Network.create(fetchFn);
  const store = new Store(new RecordSource());
  return new Environment({ store, network });
}

export const environment = createEnvironment();
