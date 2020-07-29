

#! /bin/bash
docker run --restart unless-stopped -d --network skyplus-network -p 7580:8080 \
  -e HASURA_GRAPHQL_DATABASE_URL=postgres://skyplus:skyplus@postgres12:5432/skyplus \
  -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
  --name hasura7580 \
  hasura/graphql-engine:v1.0.0