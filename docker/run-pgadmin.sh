docker run --restart unless-stopped -d --network skyplus-network --name pgadmin -v /Users/khailv/Desktop/shared:/var/lib/pgadmin -e PGADMIN_DEFAULT_EMAIL=roboticscm2018@gmail.com -e PGADMIN_DEFAULT_PASSWORD=1234 -p 7579:80 dpage/pgadmin4:latest

