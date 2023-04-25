---
theme: default
class: "text-center"
highlighter: shiki
lineNumbers: true
css: unocss
---

# Relay 온보딩 세션

Cosmo

---

# 진행

- GraphQL 간단 설명

- Relay 소개

- 피쳐 탐방 w/ 핸즈온

---

# GraphQL 간단 설명

- API와 클라이언트 간의 통신을 위해 사용하는 쿼리 언어

```graphql
query {
  repository(owner: "portone-io", name: "sdk-playground") {
    name
    nameWithOwner
    stargazerCount
    stargazers(first: 10) {
      nodes {
        login
        name
        email
      }
    }
  }
}
```

- 대충 이렇게 생긴 걸 서버에 보내면 위 모양에 맞게 JSON 데이터를 반환해준다

---

# GraphQL 간단 설명

- 데이터를 가져올 때 `Query`, 데이터를 변형시킬 때 `Mutation`을 사용함

  - 둘의 타입 시스템은 완전히 동일함, 루트 필드 목록만 다름

- 기본 타입으로는 `Int`, `Float`, `String`, `Boolean`, `ID` 등이 있음

  - `DateTime` 같은 Custom Scalar를 추가할 수도 있음

  - !를 붙여서(`Int!`) Non-nullable함을 표시할 수 있음

  - []로 감싸서(`[Int]`) 리스트임을 표시할 수 있음

  - 둘 다 안팎으로 할 수도 있음 (`[Int!]!`)

---

# GraphQL 간단 설명

- 타입 시스템에는 `type`, `interface`, `union`, `enum`이 있음

- 각 필드는 Argument를 가질 수 있음

  - Argument에는 기본 타입, Custom Scalar, Enum, 그리고 별도로 정의된 `input` 타입만 사용 가능함

- GraphQL Query와 Mutation은 쿼리 호출 시에 전달받을 Variable을 정의해둘 수 있음

  - Variable은 Argument에 사용되며, 따라서 Variable 정의에서 사용 가능한 타입 역시 Argument의 그것과 동일

- 이것들을 잘 조합해서 스키마를 만들고 쿼리를 만듬

---
layout: two-cols
---

# 예시 쿼리

```graphql {all|1|2,4|5|8-13}
query ($name: String!) {
  repository(owner: "portone-io", name: $name) {
    name
    issues(first: 10) {
      nodes {
        author {
          login
          ... on User {
            name
          }
          ... on Bot {
            id
          }
        }
      }
    }
  }
}
```

::right::

<div class="pl-12 pt-20">

- Variables 정의

- Argument를 활용한 쿼리

- 리스트 조회

- Interface의 하위 타입 조회

</div>

---

# Fragment

- GraphQL의 어떠한 타입에 대해서 가져올 데이터의 목록을 정의해 두는 조각

```graphql
fragment RepoSummary on Repository {
  nameWithOwner
  stargazerCount
}
```

- 쿼리 내에 spread해서 사용한다

```graphql
query {
  repository(owner: "portone-io", name: "sdk-playground") {
    ...RepoSummary
  }
}
```

- 재사용 가능한 형태로 정의된 데이터 묶음

---

# Fragment

- 인라인 Fragment도 있다
  - 주로 Union이나 Interface에서 특정 타입을 뽑아낼 때 사용

```graphql
query ($id: ID!) {
  node(id: $id) {
    ... on Repository {
      nameWithOwner
    }
    ... on User {
      email
    }
  }
}
```

---
layout: center
---

# Questions?

---

# Relay 소개

- React와 함께 사용할 수 있는 GraphQL 클라이언트

- 핵심 컨셉

  - 페이지를 이루는 각 컴포넌트는 자신이 의존하는 데이터들을 Fragment를 통해 표현한다

    - 이를 통해 한 페이지 내에서 필요한 모든 데이터를 단 1회의 쿼리만으로 불러올 수 있게 된다

    - 또한 Fragment를 Refetchable하게 만들면 추후 해당 Fragment에 해당하는 데이터만 refetch하는 것도 가능하다

  - 쿼리 결과물은 전부 ID 등을 키로 삼아 중앙 캐시에 정규화되어 저장되고,<br>캐시 내 데이터가 업데이트되면 이를 참조하는 모든 UI가 업데이트된다

    - 캐시는 Query/Mutation을 통해 최신 데이터를 가져오면 자동으로 업데이트된다

  - React Suspense를 매우 적극적으로 활용한다.

    - 유려한 UX를 위해 `startTransition()` 등을 활용하려면 리액트 18 사용이 반강제된다

---

# Relay 기본 Hooks 알아보기

- `useLazyLoadQuery(query, variables): Query$data`

  - 데이터를 쿼리하기 위한 가장 기본적인 Hook

  - 쿼리와 Variable 객체를 넣어 호출하면...

    - 캐시에 필요한 데이터가 있으면 즉시 반환한다

    - 없으면 서버로 요청을 보내고, 컴포넌트를 Suspend시킨 후, 데이터가 도착하면 반환한다

```tsx
const App = () => {
  const data = useLazyLoadQuery(
    graphql`
      query AppQuery {
        viewer { login }
      }
    `,
    {}
  );

  return <>{data.viewer.login}</>;
};
```

---

# Relay 기본 Hooks 알아보기

- `useFragment(fragmentDef, fragmentKey): Fragment$data`

  - 컴포넌트가 사용할 Fragment를 정의하는 Hook

  - 정의한 Fragment는 해당 컴포넌트를 사용하는 컴포넌트에서 spread해서 필요한 데이터를 가져온 후,<br>
    이를 그대로 해당 컴포넌트에 넘겨주는 방식으로 사용한다

<div class="grid grid-cols-2">

```tsx
const RepoSummary = ({ $repository }) => {
  const repository = useFragment(
    graphql`
      fragment RepoSummary_repository on Repository {
        nameWithOwner
        stargazerCount
      }
    `,
    $repository
  );

  return <>{repository.nameWithOwner}</>;
};
```

```tsx
const App = () => {
  const data = useLazyLoadQuery(
    graphql`
      query AppQuery {
        repository(
          owner: "portone-io",
          name: "sdk-playground"
        ) {
          ...RepoSummary_repository
        }
      }
    `,
    {}
  );

  return <RepoSummary $repository={data.repository} />;
};
```

</div>

---

# 핸즈온: 저장소 검색기 만들기

<img src="/assets/handson-1.png" class="w-500px">

- 위 스샷처럼 Owner와 Name을 입력받아서 `nameWithOwner`와 `stargazerCount`를 보여주면 됩니다.

  - 핸즈온 샌드박스 기본 사용법은 [XiNiHa/relay-onboarding 레포](https://github.com/XiNiHa/relay-onboarding)의 README를 참조하세요.

  - 아래의 Repo 정보를 보여 주는 부분은 별도 컴포넌트로 분리해주세요.

  - Debounce를 적용하셔야 API Rate Limiting을 피하실 수 있을 겁니다(...)

  - 검색을 실행할 때 화면이 깜빡이지 않게 해 보세요. (힌트: Suspense 트리거를 막으세요)

---

# Fragment에서 Argument 선언하기

- Relay의 Fragment는 Argument를 받을 수 있습니다 (표준 GraphQL에선 [아직 RFC 단계](https://github.com/graphql/graphql-spec/pull/1010))

- 이렇게 선언하고

```graphql
fragment RepoSearch_query on Query
@argumentDefinitions(
  owner: { type: "String", defaultValue: "" }
  name: { type: "String", defaultValue: "" }
) {
  repository(owner: $owner, name: $name) {
    name
  }
}
```

- 이렇게 씁니다

```graphql
query AppQuery($name: String!) {
  ...RepoSearch_query @arguments(owner: "portone-io", name: $name)
}
```

---

# Refetchable Fragment

- Relay에서는 특정 Fragment의 데이터만 Refetch하는 것이 가능합니다.

  - Refetch 시에는 해당 Fragment의 Argument도 다르게 지정해서 넣을 수 있습니다.

  - Fragment Refetch는 해당 Fragment를 사용하는 컴포넌트를 Suspend시킵니다.

<div class="h-340px overflow-y-auto">

```tsx
const RepoSearch = ({ $query }) => {
  const [query, refetch] = useRefetchableFragment(
    graphql`
      fragment RepoSearch_query on Query
      @argumentDefinitions(
        owner: { type: "String", defaultValue: "" }
        name: { type: "String", defaultValue: "" }
      )
      @refetchable(queryName: "RepoSearchRefetchQuery") {
        repository(owner: $owner, name: $name) {
          name
        }
      }
    `,
    $query
  );

  useEffect(() => {
    const timeout = setTimeout(() => refetch({}), 3000); // 인자로는 Partial<Variables>가 들어감
    return () => clearTimeout(timeout);
  });

  return <>{query.repository?.name}</>;
};
```

</div>

---

# 핸즈온: 저장소 검색기 업그레이드하기

- 검색 내용을 갱신할 때 쿼리 전체가 새로 날아가는 대신, Fragment만 Refetch되도록 컴포넌트를 분리해 보세요.

- Debounce를 `setState` 함수들에 먹이는 대신, 검색 역할을 담당할 컴포넌트의 `useEffect`에서 처리해 보세요.

- 검색이 이뤄지는 동안, 아래쪽의 검색 결과를 보여주는 부분만 `Searching...` 이 보여지도록<br>Suspense를 활용해서 개선해 보세요! (스샷 참조)

<img src="/assets/handson-2.png" class="w-500px">

---

# Relay로 무한스크롤 페이지네이션 처리하기

- `usePaginationFragment()`

  - [GraphQL Cursor Connections 스펙](https://relay.dev/graphql/connections.htm)을 만족하는 필드에 대해서<br>간편하게 무한스크롤 페이지네이션을 구현할 수 있도록 돕는 Hook

  - Fragment 정의만 적절히 해 두면, `loadNext()` 등 무한스크롤 처리를 위한 다양한 유틸리티들을 제공해준다.

```graphql
fragment RepoSearchFragment on Query
@argumentsDefinitions(
  query: { type: "String!" }
  cursor: { type: "String" }
  count: { type: "Int", defaultValue: 10 }
)
@refetchable(queryName: "RepoSearchRefetchQuery") {
  search(query: $query, type: REPOSITORY, first: $count, after: $cursor)
    @connection(key: "RepoSearchFragment_search") {
    edges {
      node {
        id
      }
    }
  }
}
```

---

# 사용법

```tsx
const RepoSearch = ({ $query }) => {
  const { data, loadNext } = usePaginationFragment(
    RepoSearchFragment, // 생략
    $query,
  )

  return (
    <>
      {data.search.edges.map(({ node }) => (
        <div key={node.id}>{node.name}</div>
      ))}
      <button
        onClick={() => {
          startTransition(() => {
            loadNext(10)
          })
        }}>
        더 불러오기
      </button>
    </>
  )
}
```

---

# `usePaginationFramgment()`의 반환값

- `data`: 말 그대로 Fragment를 가져온 데이터를 반환

- `loadNext()` / `loadPrevious()`: 다음/이전 항목들을 원하는 갯수만큼 가져오는 함수

  - `loadNext()`를 하려면 `first`와 `after`가, `loadPrevious()`를 하려면 `last`와 `before`가 필요

- `isLoadingNext` / `isLoadingPrevious`: 다음/이전 항목들을 가져오고 있는지를 나타냄

- `refetch()`: 일반적인 `useRefetchableFragment`의 그것과 동일

---

# 핸즈온: 저장소 검색기에 페이지네이션 붙이기

- 방금 배운 `usePaginationFragment`를 가지고 저장소 검색기에 페이지네이션을 붙여봅시다.

- 지금까지는 저장소를 `Query.repository(owner, name)`으로 가져왔는데,<br>이제부턴 `Query.search(query, type: REPOSITORY)`로 가져와보겠습니다.

- 검색창이 `owner`랑 `name` 용으로 나뉘어져 있었는데, `query` 용으로 하나로 합칩시다.

- 최초 10개의 항목을 보여주고, 이후 `더 불러오기` 버튼을 누르면 10개 더 불러오도록 해 봅시다.<br>불러오는 중일 땐 버튼의 텍스트를 `불러오는 중...`으로 바꾸고, 버튼을 비활성화시킵시다.

<img src="/assets/handson-3.png" class="w-250px">

---

# `useMutation()`: 서버에 Mutation 보내기

- 각 컴포넌트에서 사용할 Mutation을 `useMutation()`으로 정의하고,<br>함수를 호출하여 Mutation을 트리거할 수 있음

```tsx
const FollowButton = ({ id }) => {
  const [followUser, isFollowUserInFlight] = useMutation(
    graphql`
      mutation FollowButton_FollowUserMutation($id: ID!) {
        followUser(input: { userId: $id }) {
          user {
            id
            viewerIsFollowing
          }
        }
      }
    `
  )

  return <button onClick={() => followUser({ variables: { id } })}>팔로우</button>
}
```

---

# Mutation 결과값으로 캐시 업데이트하기

- (아까 설명했듯이) Relay는 모든 값을 ID 등을 키로 삼아서 중앙 캐시 저장소에 정규화하여 저장한다

- 데이터를 업데이트하고자 하는 항목의 새 데이터를 Mutation의 결과값으로 가져오기만 하면,<br>
  Relay가 알아서 중앙 캐시의 데이터를 업데이트하고, UI도 함께 업데이트된다

  - 예를 들어, User 타입의 경우 `id` 필드를 키로 삼아서 캐시에 저장된다.<br>
    이때 Mutation의 결과값으로 특정 User의 데이터를 업데이트하려면,<br>
    Mutation의 결과값에서 User를 특정하기 위한 `id`와 업데이트할 필드(`viewerIsFollowing` 등)를 선택해서<br>
    데이터를 가져오면, 응답받은 `id`와 연관된 데이터가 캐시에서 알아서 업데이트된다.

---

# Relay 캐시가 키를 정하는 방법

1. 만약 타입이 Node 인터페이스(`interface Node { id: ID! }`)를 구현할 경우,<br>
   `id`를 키로 삼아서 캐시에 저장함

2. 객체가 Node를 구현하는 타입 안에 속해 있을 경우,<br>
   가장 가까운 Node로부터 이어져오는 경로를 키로 삼아서 캐시에 저장함<br>
   리스트 타입의 경우, 인덱스를 경로에 포함함<br>
   (예: `Node.fieldA.fieldB[0]`를 나타내는 키: `client:{Node.id}:fieldA:fieldB:0`)

3. 가까운 Node가 없을 경우, 최상위 타입(`Query`)으로부터의 경로를 키로 삼아서 캐시에 저장함<br>
   리스트 타입의 경우, 인덱스를 경로에 포함함<br>
   (예: `Query.fieldA.fieldB[0]`를 나타내는 키: `client:root:fieldA:fieldB:0`)

- 정확히 어떤 포맷으로 키가 생성되는지는 몰라도, 어떤 과정을 걸쳐서 키가 생성되는지는 알아야<br>
  효율적이고 정확하게 캐시를 업데이트할 수 있음

- 그래도 헷갈릴 땐 [Relay DevTools](https://github.com/relayjs/relay-devtools)를 사용하면 현재 캐시 상태를 볼 수 있음

---

# `useMutation()`으로 Optimistic Response 날먹하기

- `useMutation()`이 반환하는 dispatch 함수는 Variables 외에도 다양한 옵션을 받는다

- 이 중 `optimisticResponse`를 활용하면 Optimistic Response를 매우 간단하게 구현할 수 있다

- `optimisticResponse` 옵션에 Mutation의 예상되는 응답을 넣으면 Relay가 알아서 캐시를 미리 업데이트해 준다

```tsx
const followUserWithId = (id: string) => {
  return followUser({
    variables: { id },
    optimisticResponse: {
      followUser: {
        user: {
          id,
          viewerIsFollowing: true,
        },
      },
    },
  })
}
```

---

# 핸즈온: 저장소 Owner 팔로우 / 언팔로우 기능 추가하기

<img src="/assets/handson-4.webp" class="w-250px absolute right-30">

- 우측 스샷처럼 저장소의 Owner(`Repository.owner`)를 대상으로<br>
  팔로우/언팔로우 버튼 표시하기

  - Owner가 User가 아니고 Organization일 수도 있는데,<br>
    이 경우에는 그냥 버튼 숨겨지게 처리

- 클릭하면 상황에 맞게 `followUser`/`unfollowUser` 호출하기

- Mutation이 일어나는 중에는 버튼 비활성화시키고, 로딩 표시 보여주기

- Optimistic Response 활용해서 버튼 텍스트는 미리 업데이트시키기

---
layout: end
---
