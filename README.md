# Relay 온보딩 세션

## Sandbox 사용법

### 세팅

- GitHub Access Token 설정하기

  - [이곳에서](https://github.com/settings/tokens/new?description=Relay+Onboarding+Session&scopes=repo%2Cuser) 생성하실 수 있습니다.

  - `githubCredentials.local.ts`를 만들고, `githubCredentials.sample.ts`의 내용을 참조하여 토큰을 적절히 삽입합니다.

  - 위 토큰은 각 sandbox 앱에서 불러와 사용하게 됩니다.

- 언어 결정하기

  - TypeScript와 ReScript 샌드박스가 각각 `sandbox/typescript` 와 `sandbox/rescript`에 존재합니다.

  - 원하는 샌드박스의 폴더를 **VSCode의 폴더 열기 기능으로 엽니다** (Relay 익스텐션이 모노레포에서 잘 안 돔)

  - 워크스페이스 설정에 따라 권장되는 익스텐션들을 설치합니다.

- 프로젝트 셋업하기

  - `pnpm i`를 실행합니다. pnpm이 없다면 `corepack enable`을 실행합니다.

  - Relay 컴파일러를 Watch 모드로 실행하려면 Watchman이 필요합니다. `brew install watchman` 내지 환경에 맞는 적절한 설치법을 사용해 설치합니다.

  - `pnpm dev`을 실행하면 Relay 컴파일러와 Vite 개발 서버가 실행될 것입니다. `http://localhost:5173`에 접속합니다.

  - 화면에 GitHub Access Token을 생성한 계정의 이름이 잘 표시되는지 확인합니다.

### 언어별 팁

- TypeScript

  - Relay 컴파일러는 TypeScript 타입 정의를 자동으로 생성하는 기능을 내장하고 있습니다. 컴파일에 성공하면 작성한 Query, Mutation, Fragment의 이름에 맞게 타입이 생성됩니다.

    - Query 타입 활용하기

      ```tsx
      import type { AppQuery } from "./__generated__/AppQuery.graphql.ts";

      const App = () => {
        const data = useLazyLoadQuery<AppQuery>(
          graphql`
            query AppQuery {
              viewer {
                login
              }
            }
          `,
          {}
        );

        return <>{data.viewer.login}</> // 타입이 잘 잡힘
      };
      ```

    - Fragment 타입 활용하기

      ```tsx
      import type { RepoSummary_repository$key } from "./__generated__/RepoSummary_repository.graphql.ts";

      interface Props {
        $repository: RepoSummary_repository$key
      }

      const RepoSummary = ({ $repository }: Props) => {
        const repository = useFragment(
          graphql`
            fragment RepoSummary_repository on Repository {
              nameWithOwner
              stargazerCount
            }
          `,
          $repository // 이 값의 타입 가지고 Relay가 자동으로 반환값 타입을 잡아줌
        )

        return <>{repository.nameWithOwner}</> // 타입이 잘 잡힘
      }
      ```
