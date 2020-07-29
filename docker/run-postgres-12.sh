docker run -d --restart unless-stopped --network skyplus-network --name postgres12 -v /Users/khailv/postgres_data12:/var/lib/postgresql/data -p 5433:5432 -e POSTGRES_PASSWORD=1234 postgres:latest
