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
query($name: String!) {
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
  )

  return <>{data.viewer.login}</>
}
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
    $repository,
  )

  return <>{repository.nameWithOwner}</>
}
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
    {},
  )

  return <RepoSummary $repository={data.repository} />
}
```

</div>

---

# 핸즈온: 저장소 검색기 만들기

---
layout: end
---
