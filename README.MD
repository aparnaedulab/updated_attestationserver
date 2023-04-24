This is a server side code for attestation module 

To run this locally 
1)make sure node-dev is installed then issue the command
2)npm start 

To run this on server

1)Edit line number 8 to 
"start": "node app.js"
2)add it to pm2 

Create a folder config 
add the following files 
config.json
constant.js
mobileMsgConfig.json
sendmail.js

# Docker Installation for development 

docker run -it --rm -e MYSQL_PWD=<user pass> mysql:5.7 mysqldump -u <user> -h <ip address> -P 3306 database 1> backup.sql
# please be wait it will take sometime
docker cp backup.sql gu_attestation_db:/tmp
# go inside terminal and issue this command after issuing command enter the password as password
mysql -u root -p GU_SFC < /tmp/backup.sql