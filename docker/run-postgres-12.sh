docker run -d --name postgres12 -v /opt/data/postgres_data12:/var/lib/postgresql/data -p 5433:5432 -e POSTGRES_PASSWORD=1234 postgres:latest
