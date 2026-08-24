import { createSignal, Show, startTransition } from "solid-js";
import { graphql } from "relay-runtime";
import { createFragment, createLazyLoadQuery } from "solid-relay";
import { debounce } from "./utils/debounce";
import type { HandsOn1Query } from "./__generated__/HandsOn1Query.graphql";
import type { HandsOn1_RepoSummary_repository$key } from "./__generated__/HandsOn1_RepoSummary_repository.graphql";

export default function HandsOn1() {
  const [owner, setOwner] = createSignal("");
  const [name, setName] = createSignal("");

  const setOwnerDebounced = debounce(
    (v: string) => startTransition(() => setOwner(v)),
    500,
  );
  const setNameDebounced = debounce(
    (v: string) => startTransition(() => setName(v)),
    500,
  );

  const data = createLazyLoadQuery<HandsOn1Query>(
    graphql`
      query HandsOn1Query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          ...HandsOn1_RepoSummary_repository
        }
      }
    `,
    () => ({ owner: owner(), name: name() }),
  );

  return (
    <div>
      <input
        type="text"
        onInput={(e) => setOwnerDebounced(e.currentTarget.value)}
      />
      <input
        type="text"
        onInput={(e) => setNameDebounced(e.currentTarget.value)}
      />
      <Show when={data()?.repository}>
        {(repository) => <RepoSummary $repository={repository()} />}
      </Show>
    </div>
  );
}

function RepoSummary(props: {
  $repository: HandsOn1_RepoSummary_repository$key;
}) {
  const data = createFragment(
    graphql`
      fragment HandsOn1_RepoSummary_repository on Repository {
        nameWithOwner
        stargazerCount
      }
    `,
    () => props.$repository,
  );

  return (
    <Show when={data()}>
      {(data) => (
        <div>
          {data().nameWithOwner} {data().stargazerCount}
        </div>
      )}
    </Show>
  );
}
