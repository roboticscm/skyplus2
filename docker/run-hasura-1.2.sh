

#! /bin/bash
docker run -p 7582:8080 \
  -e HASURA_GRAPHQL_DATABASE_URL=postgres://skyplus:skyplus@172.17.0.5:5432/skyplus \
  -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
  --name hasura7582 \
  hasura/graphql-engine:latest